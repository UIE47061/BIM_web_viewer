<template>
  <div class="viewer-layout">
    <!-- Sidebar -->
    <Transition name="sidebar">
      <aside v-show="!store.sidebarCollapsed" class="viewer-layout__sidebar">
        <SidebarPanel
          @file-selected="handleFileSelected"
          @toggle-category="handleToggleCategory"
          @show-all="handleShowAll"
          @hide-all="handleHideAll"
          @toggle-storey="handleToggleStorey"
          @show-all-storeys="handleShowAllStoreys"
          @hide-all-storeys="handleHideAllStoreys"
        />
      </aside>
    </Transition>

    <!-- Main viewport -->
    <main class="viewer-layout__main">
      <ViewerToolbar
        @fit="handleFitToModel"
        @reset-view="handleResetView"
        @toggle-grid="handleToggleGrid"
        @toggle-axes="handleToggleAxes"
        @toggle-wireframe="handleToggleWireframe"
        @open-file="openFilePicker"
        @toggle-sidebar="store.toggleSidebar()"
        @set-up-axis="handleSetUpAxis"
        @clear-drc="handleClearDrc"
      />
      <ThreeCanvas
        ref="threeCanvasRef"
        @file-selected="handleFileSelected"
      />
    </main>

    <!-- DRC Panel -->
    <DrcPanel
      :model-loaded="store.modelLoaded"
      @run-drc="handleRunDrc"
      @clear-drc="handleClearDrc"
      @focus-element="handleFocusElement"
    />

    <!-- Hidden file input for toolbar "open file" -->
    <input
      ref="hiddenFileInput"
      type="file"
      accept=".ifc"
      style="display: none"
      @change="onHiddenFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useViewerStore } from '@/stores/viewerStore'
import { useDrcStore } from '@/stores/drcStore'
import { IfcService } from '@/services/IfcService'
import { DrcService } from '@/services/DrcService'
import type { SceneService } from '@/services/SceneService'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/ifc'
import type { CategoryInfo } from '@/types/ifc'

import ThreeCanvas from '@/components/viewer/ThreeCanvas.vue'
import ViewerToolbar from '@/components/viewer/ViewerToolbar.vue'
import SidebarPanel from '@/components/sidebar/SidebarPanel.vue'
import DrcPanel from '@/components/drc/DrcPanel.vue'

const store = useViewerStore()
const drcStore = useDrcStore()

const threeCanvasRef = ref<InstanceType<typeof ThreeCanvas> | null>(null)
const hiddenFileInput = ref<HTMLInputElement | null>(null)
const ifcService = new IfcService()
const drcService = new DrcService()

// ---------- Scene access ----------

function getScene(): SceneService | null {
  return threeCanvasRef.value?.getSceneService() ?? null
}

// ---------- File handling ----------

async function handleFileSelected(file: File) {
  const scene = getScene()
  if (!scene) return

  store.setLoading(true, 'Initializing IFC parser...')

  try {
    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer()
    const data = new Uint8Array(buffer)

    store.setLoading(true, 'Parsing IFC model...')

    // Load model
    const result = await ifcService.loadModel(data, (percent) => {
      store.setProgress(percent)
      if (percent < 30) {
        store.loadingMessage = 'Reading geometry...'
      } else if (percent < 70) {
        store.loadingMessage = 'Building meshes...'
      } else {
        store.loadingMessage = 'Finalizing...'
      }
    })

    // Clear previous model
    scene.clearModel()
    // Also clear any DRC results from previous model
    handleClearDrc()

    // Build category info list and add groups to scene
    const categories: CategoryInfo[] = []

    for (const [name, group] of result.categoryGroups) {
      const count = result.categoryCounts.get(name) || 0
      categories.push({
        name,
        icon: CATEGORY_ICONS[name] || CATEGORY_ICONS['Other'],
        visible: name !== 'Spaces', // Hide spaces by default
        count,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other'],
      })

      // Hide spaces by default
      if (name === 'Spaces') {
        group.visible = false
      }

      scene.addCategoryGroup(group)
    }

    // Sort categories: most elements first
    categories.sort((a, b) => b.count - a.count)

    // Update store
    store.setModelLoaded(
      {
        fileName: file.name,
        fileSize: file.size,
        totalElements: categories.reduce((s, c) => s + c.count, 0),
        categoriesCount: categories.length,
      },
      categories,
      result.storeyInfos
    )

    // Fit camera to model
    scene.fitToModel()

    // Set up selection callback
    scene.onSelect = (expressID) => {
      if (expressID !== null) {
        const props = ifcService.getElementProperties(expressID)
        store.setSelectedElement(expressID, props)
      } else {
        store.setSelectedElement(null)
      }
    }
  } catch (err) {
    console.error('Failed to load IFC file:', err)
    store.setLoading(false)
    alert('Failed to load IFC file. Please check the console for details.')
    return
  }

  store.setLoading(false)
}

// ---------- Category visibility ----------

function handleToggleCategory(name: string) {
  store.toggleCategoryVisibility(name)
  const cat = store.categories.find((c) => c.name === name)
  if (cat) {
    getScene()?.setCategoryVisible(name, cat.visible)
  }
}

function handleShowAll() {
  store.showAllCategories()
  store.categories.forEach((c) => {
    getScene()?.setCategoryVisible(c.name, true)
  })
}

function handleHideAll() {
  store.hideAllCategories()
  store.categories.forEach((c) => {
    getScene()?.setCategoryVisible(c.name, false)
  })
}

// ---------- View controls ----------

function handleFitToModel() {
  getScene()?.fitToModel()
}

function handleResetView() {
  getScene()?.resetView()
}

function handleToggleGrid() {
  store.toggleGrid()
  getScene()?.setGridVisible(store.showGrid)
}

function handleToggleAxes() {
  store.toggleAxes()
  getScene()?.setAxesVisible(store.showAxes)
}

function handleToggleWireframe() {
  store.toggleWireframe()
  getScene()?.setWireframe(store.wireframeMode)
}

function handleSetUpAxis(axis: 'X+' | 'X-' | 'Y+' | 'Y-' | 'Z+' | 'Z-') {
  store.setUpAxis(axis)
  getScene()?.setUpAxis(axis)
}

function openFilePicker() {
  hiddenFileInput.value?.click()
}

function onHiddenFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    handleFileSelected(input.files[0])
    input.value = ''
  }
}

// ---------- Watchers ----------

// Sync grid/axes visibility with store on mount
watch(
  () => store.showGrid,
  (val: boolean) => getScene()?.setGridVisible(val)
)
watch(
  () => store.showAxes,
  (val: boolean) => getScene()?.setAxesVisible(val)
)

function handleToggleStorey(name: string) {
  store.toggleStoreyVisibility(name)
  const storey = store.storeys.find((s) => s.name === name)
  if (storey) {
    getScene()?.setStoreyVisible(name, storey.visible)
  }
}

function handleShowAllStoreys() {
  store.showAllStoreys()
  store.storeys.forEach((s) => {
    getScene()?.setStoreyVisible(s.name, true)
  })
}

function handleHideAllStoreys() {
  store.hideAllStoreys()
  store.storeys.forEach((s) => {
    getScene()?.setStoreyVisible(s.name, false)
  })
}

// ---------- DRC ----------

function handleRunDrc() {
  const scene = getScene()
  if (!scene) return

  drcStore.setRunning(true)
  // Clear previous highlights before re-run
  scene.clearDrcHighlights()

  // Run in next tick to let UI update
  setTimeout(() => {
    try {
      const modelGroup = scene.getModelGroup()
      const result = drcService.runChecks(modelGroup, drcStore.rules)
      drcStore.setResult(result)

      // Apply highlights per violation (worst severity wins for same element)
      const elementSeverity = new Map<number, { color: string; severity: string }>()
      const severityOrder: Record<string, number> = { critical: 3, warning: 2, notice: 1 }

      for (const v of result.violations) {
        const existing = elementSeverity.get(v.expressID)
        if (!existing || (severityOrder[v.severity] ?? 0) > (severityOrder[existing.severity] ?? 0)) {
          elementSeverity.set(v.expressID, { color: v.color, severity: v.severity })
        }
      }

      for (const [expressID, { color }] of elementSeverity) {
        scene.applyDrcHighlight(expressID, color)
      }
    } finally {
      drcStore.setRunning(false)
    }
  }, 50)
}

function handleClearDrc() {
  getScene()?.clearDrcHighlights()
  drcStore.clearResult()
}

function handleFocusElement(expressID: number) {
  // Select the element to show properties and highlight it
  const props = ifcService.getElementProperties(expressID)
  store.setSelectedElement(expressID, props)
}

// ---------- Cleanup ----------

onBeforeUnmount(() => {
  ifcService.dispose()
})
</script>

<style scoped>
.viewer-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.viewer-layout__sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: 100%;
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  flex-shrink: 0;
  z-index: 30;
}

.viewer-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

/* Sidebar transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.25s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  margin-left: calc(var(--sidebar-width) * -1);
  opacity: 0;
}
</style>
