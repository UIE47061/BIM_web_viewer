/* =============================================
   Viewer State Store (Pinia)
   Central state management for the IFC viewer.
   ============================================= */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CategoryInfo, PropertyGroup, ModelStats, StoreyInfo } from '@/types/ifc'

export const useViewerStore = defineStore('viewer', () => {
  // ---------- State ----------

  const isLoading = ref(false)
  const loadingProgress = ref(0)
  const loadingMessage = ref('')
  const modelLoaded = ref(false)

  const modelStats = ref<ModelStats>({
    fileName: '',
    fileSize: 0,
    totalElements: 0,
    categoriesCount: 0,
  })

  const categories = ref<CategoryInfo[]>([])
  const storeys = ref<StoreyInfo[]>([])
  const selectedExpressID = ref<number | null>(null)
  const selectedProperties = ref<PropertyGroup[]>([])

  // View options
  const showGrid = ref(true)
  const showAxes = ref(true)
  const wireframeMode = ref(false)
  const sidebarCollapsed = ref(false)
  const upAxis = ref<'X' | 'Y' | 'Z'>('Z')

  // ---------- Getters ----------

  const visibleCategories = computed(() =>
    categories.value.filter((c) => c.visible)
  )

  const hiddenCategories = computed(() =>
    categories.value.filter((c) => !c.visible)
  )

  const totalElements = computed(() =>
    categories.value.reduce((sum, c) => sum + c.count, 0)
  )

  const hasSelection = computed(() => selectedExpressID.value !== null)

  // ---------- Actions ----------

  function setLoading(loading: boolean, message = '') {
    isLoading.value = loading
    loadingMessage.value = message
    if (!loading) {
      loadingProgress.value = 0
      loadingMessage.value = ''
    }
  }

  function setProgress(percent: number) {
    loadingProgress.value = percent
  }

  function setModelLoaded(stats: ModelStats, cats: CategoryInfo[], storeyList: StoreyInfo[] = []) {
    modelStats.value = stats
    categories.value = cats
    storeys.value = storeyList
    modelLoaded.value = true
    selectedExpressID.value = null
    selectedProperties.value = []
  }

  function clearModel() {
    modelLoaded.value = false
    modelStats.value = { fileName: '', fileSize: 0, totalElements: 0, categoriesCount: 0 }
    categories.value = []
    storeys.value = []
    selectedExpressID.value = null
    selectedProperties.value = []
  }

  function toggleCategoryVisibility(name: string) {
    const cat = categories.value.find((c) => c.name === name)
    if (cat) cat.visible = !cat.visible
  }

  function setCategoryVisibility(name: string, visible: boolean) {
    const cat = categories.value.find((c) => c.name === name)
    if (cat) cat.visible = visible
  }

  function showAllCategories() {
    categories.value.forEach((c) => (c.visible = true))
  }

  function hideAllCategories() {
    categories.value.forEach((c) => (c.visible = false))
  }

  function setSelectedElement(
    expressID: number | null,
    properties: PropertyGroup[] = []
  ) {
    selectedExpressID.value = expressID
    selectedProperties.value = properties
  }

  function toggleGrid() {
    showGrid.value = !showGrid.value
  }

  function toggleAxes() {
    showAxes.value = !showAxes.value
  }

  function toggleWireframe() {
    wireframeMode.value = !wireframeMode.value
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleStoreyVisibility(name: string) {
    const s = storeys.value.find((s) => s.name === name)
    if (s) s.visible = !s.visible
  }

  function setStoreyVisibility(name: string, visible: boolean) {
    const s = storeys.value.find((s) => s.name === name)
    if (s) s.visible = visible
  }

  function showAllStoreys() {
    storeys.value.forEach((s) => (s.visible = true))
  }

  function hideAllStoreys() {
    storeys.value.forEach((s) => (s.visible = false))
  }

  function setUpAxis(axis: 'X' | 'Y' | 'Z') {
    upAxis.value = axis
  }

  return {
    // State
    isLoading,
    loadingProgress,
    loadingMessage,
    modelLoaded,
    modelStats,
    categories,
    storeys,
    selectedExpressID,
    selectedProperties,
    showGrid,
    showAxes,
    wireframeMode,
    sidebarCollapsed,
    upAxis,

    // Getters
    visibleCategories,
    hiddenCategories,
    totalElements,
    hasSelection,

    // Actions
    setLoading,
    setProgress,
    setModelLoaded,
    clearModel,
    toggleCategoryVisibility,
    setCategoryVisibility,
    showAllCategories,
    hideAllCategories,
    setSelectedElement,
    toggleGrid,
    toggleAxes,
    toggleWireframe,
    toggleSidebar,
    setUpAxis,
    toggleStoreyVisibility,
    setStoreyVisibility,
    showAllStoreys,
    hideAllStoreys,
  }
})
