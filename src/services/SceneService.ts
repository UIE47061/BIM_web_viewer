/* =============================================
   Three.js Scene Management Service
   Handles rendering, camera, controls, lighting,
   selection, and viewport interactions.
   ============================================= */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type SelectionCallback = (expressID: number | null) => void

export class SceneService {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls

  private container: HTMLElement
  private animationId = 0
  private modelGroup = new THREE.Group()
  private gridHelper: THREE.GridHelper
  private axesHelper: THREE.AxesHelper

  // Selection
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private selectedMesh: THREE.Mesh | null = null
  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
  // DRC highlights (tracked separately from selection)
  private drcOriginalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
  private highlightMaterial = new THREE.MeshPhongMaterial({
    color: 0x7c3aed,
    emissive: 0x7c3aed,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  })

  onSelect: SelectionCallback | null = null

  constructor(container: HTMLElement) {
    this.container = container
    const { width, height } = container.getBoundingClientRect()

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0f0f1a)

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000)
    this.camera.position.set(30, 30, 30)
    this.camera.lookAt(0, 0, 0)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    container.appendChild(this.renderer.domElement)

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.1
    this.controls.screenSpacePanning = true
    this.controls.minDistance = 0.5
    this.controls.maxDistance = 5000

    // Lights
    this.setupLights()

    // Grid
    this.gridHelper = new THREE.GridHelper(200, 200, 0x444466, 0x333355)
    this.gridHelper.name = 'grid'
    this.scene.add(this.gridHelper)

    // Axes
    this.axesHelper = new THREE.AxesHelper(5)
    this.axesHelper.name = 'axes'
    this.scene.add(this.axesHelper)

    // Model group (rotated to convert Z-up to Y-up)
    this.modelGroup.name = 'model'
    this.modelGroup.rotation.x = -Math.PI / 2
    this.scene.add(this.modelGroup)

    // Events
    this.renderer.domElement.addEventListener('click', this.onClick)

    // Start render loop
    this.animate()
  }

  private setupLights(): void {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambient)

    // Hemisphere (sky/ground)
    const hemi = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.3)
    this.scene.add(hemi)

    // Main directional
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(100, 200, 100)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    this.scene.add(dirLight)

    // Fill directional
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-100, 100, -100)
    this.scene.add(fillLight)

    // Back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.2)
    backLight.position.set(0, -100, -100)
    this.scene.add(backLight)
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private onClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const visibleChildren: THREE.Object3D[] = []
    this.modelGroup.children.forEach((group) => {
      if (group.visible) {
        visibleChildren.push(...group.children)
      }
    })

    const intersects = this.raycaster.intersectObjects(visibleChildren, false)

    // Restore previous selection
    this.clearSelection()

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh
      this.selectedMesh = mesh
      this.originalMaterials.set(mesh, mesh.material)
      mesh.material = this.highlightMaterial
      this.onSelect?.(mesh.userData.expressID ?? null)
    } else {
      this.onSelect?.(null)
    }
  }

  clearSelection(): void {
    if (this.selectedMesh) {
      const original = this.originalMaterials.get(this.selectedMesh)
      if (original) {
        this.selectedMesh.material = original
      }
      this.originalMaterials.delete(this.selectedMesh)
      this.selectedMesh = null
    }
  }

  // ---------- Public API ----------

  getModelGroup(): THREE.Group {
    return this.modelGroup
  }

  setSize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  addCategoryGroup(group: THREE.Group): void {
    this.modelGroup.add(group)
  }

  clearModel(): void {
    this.clearSelection()
    while (this.modelGroup.children.length > 0) {
      const child = this.modelGroup.children[0]
      this.modelGroup.remove(child)
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          const mat = obj.material
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose())
          } else {
            mat?.dispose()
          }
        }
      })
    }
  }

  fitToModel(): void {
    const box = new THREE.Box3().setFromObject(this.modelGroup)
    if (box.isEmpty()) return

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const distance = maxDim * 1.5

    this.camera.position.set(
      center.x + distance * 0.6,
      center.y + distance * 0.8,
      center.z + distance * 0.6
    )
    this.controls.target.copy(center)
    this.controls.update()
  }

  setCategoryVisible(categoryName: string, visible: boolean): void {
    const group = this.modelGroup.children.find((c) => c.name === categoryName)
    if (group) group.visible = visible
  }

  setGridVisible(visible: boolean): void {
    this.gridHelper.visible = visible
  }

  setAxesVisible(visible: boolean): void {
    this.axesHelper.visible = visible
  }

  applyDrcHighlight(expressID: number, colorHex: string): void {
    const color = new THREE.Color(colorHex)
    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.modelGroup.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      if (obj.userData.expressID !== expressID) return
      if (!this.drcOriginalMaterials.has(obj)) {
        this.drcOriginalMaterials.set(obj, obj.material)
      }
      obj.material = mat
    })
  }

  clearDrcHighlights(): void {
    for (const [mesh, original] of this.drcOriginalMaterials) {
      mesh.material = original
    }
    this.drcOriginalMaterials.clear()
  }

  setStoreyVisible(storeyName: string, visible: boolean): void {
    this.modelGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData.storey === storeyName) {
        obj.visible = visible
      }
    })
  }

  setWireframe(enabled: boolean): void {
    this.modelGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshPhongMaterial
        if (mat && mat !== this.highlightMaterial) {
          mat.wireframe = enabled
        }
      }
    })
  }

  resetView(): void {
    this.camera.position.set(30, 30, 30)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  setUpAxis(axis: 'X' | 'Y' | 'Z'): void {
    // IFC Z-up → Three.js Y-up 需要繞 X 軸旋轉 -90°
    // IFC Y-up 或已轉換的檔案 → 不需要旋轉
    // IFC X-up → 繞 Z 軸旋轉 +90° 讓 X 軸指向 Three.js Y
    if (axis === 'Z') {
      this.modelGroup.rotation.set(-Math.PI / 2, 0, 0)
    } else if (axis === 'Y') {
      this.modelGroup.rotation.set(0, 0, 0)
    } else {
      this.modelGroup.rotation.set(0, 0, Math.PI / 2)
    }
  }

  setBackgroundColor(color: string): void {
    this.scene.background = new THREE.Color(color)
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId)
    this.renderer.domElement.removeEventListener('click', this.onClick)
    this.clearModel()
    this.controls.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
