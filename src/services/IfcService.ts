/* =============================================
   IFC Loading & Parsing Service
   Uses web-ifc WASM to parse IFC files and
   convert geometry to Three.js objects.
   ============================================= */

import * as THREE from 'three'
import * as WebIFC from 'web-ifc'
import {
  IFC_CATEGORY_MAP,
  CATEGORY_COLORS,
  IFC_TYPE_NAMES,
  IFC_TYPES,
  type PropertyGroup,
  type PropertyItem,
  type StoreyInfo,
} from '@/types/ifc'

export interface LoadResult {
  categoryGroups: Map<string, THREE.Group>
  categoryCounts: Map<string, number>
  storeyInfos: StoreyInfo[]
}

export class IfcService {
  private ifcApi: WebIFC.IfcAPI
  private modelID: number | null = null
  private idToCategoryMap: Map<number, string> = new Map()
  private storeyIndexMap: Map<number, string> = new Map()   // expressID → storey name
  private storeyElevations: Map<string, number> = new Map() // storey name → elevation
  private propertyIndex: Map<number, number[]> = new Map()
  private initialized = false

  constructor() {
    this.ifcApi = new WebIFC.IfcAPI()
  }

  async init(): Promise<void> {
    if (this.initialized) return

    // Point to the WASM files in public/wasm/
    this.ifcApi.SetWasmPath(`${import.meta.env.BASE_URL}wasm/`)
    await this.ifcApi.Init()
    this.initialized = true
  }

  async loadModel(
    data: Uint8Array,
    onProgress?: (percent: number) => void
  ): Promise<LoadResult> {
    await this.init()

    // Close previous model if any
    if (this.modelID !== null) {
      this.ifcApi.CloseModel(this.modelID)
      this.idToCategoryMap.clear()
      this.propertyIndex.clear()
    }

    this.modelID = this.ifcApi.OpenModel(data)

    // Build expressID -> category mapping
    this.buildCategoryIndex()

    // Build expressID -> storey mapping
    this.buildStoreyIndex()

    // Build property index for fast lookup
    this.buildPropertyIndex()

    // Count total for progress
    const totalElements = this.idToCategoryMap.size
    let processed = 0

    // Storey counts
    const storeyCounts = new Map<string, number>()

    // Prepare category groups
    const categoryGroups = new Map<string, THREE.Group>()
    const categoryCounts = new Map<string, number>()

    // Stream all meshes
    this.ifcApi.StreamAllMeshes(this.modelID, (flatMesh) => {
      const expressID = flatMesh.expressID
      const category = this.idToCategoryMap.get(expressID) || 'Other'
      const storey = this.storeyIndexMap.get(expressID) || 'Unassigned'

      // Ensure group exists
      if (!categoryGroups.has(category)) {
        const group = new THREE.Group()
        group.name = category
        categoryGroups.set(category, group)
        categoryCounts.set(category, 0)
      }

      // Process each geometry in the flat mesh
      const size = flatMesh.geometries.size()
      for (let i = 0; i < size; i++) {
        const placedGeometry = flatMesh.geometries.get(i)
        const mesh = this.createThreeMesh(placedGeometry, expressID, category, storey)
        if (mesh) {
          categoryGroups.get(category)!.add(mesh)
        }
      }

      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
      storeyCounts.set(storey, (storeyCounts.get(storey) || 0) + 1)
      processed++

      if (onProgress && totalElements > 0) {
        onProgress(Math.min(99, Math.round((processed / totalElements) * 100)))
      }
    })

    onProgress?.(100)

    // Build StoreyInfo list sorted by elevation
    const storeyInfos: StoreyInfo[] = []
    for (const [name, elevation] of this.storeyElevations.entries()) {
      storeyInfos.push({
        name,
        elevation,
        visible: true,
        count: storeyCounts.get(name) || 0,
      })
    }
    // Add Unassigned if any
    const unassignedCount = storeyCounts.get('Unassigned') || 0
    if (unassignedCount > 0) {
      storeyInfos.push({ name: 'Unassigned', elevation: -Infinity, visible: true, count: unassignedCount })
    }
    // Sort by elevation descending (top floor first)
    storeyInfos.sort((a, b) => b.elevation - a.elevation)

    return { categoryGroups, categoryCounts, storeyInfos }
  }

  private buildStoreyIndex(): void {
    if (this.modelID === null) return
    try {
      // Collect all IfcBuildingStorey elements
      const storeyIds = this.ifcApi.GetLineIDsWithType(
        this.modelID,
        IFC_TYPES.IFCBUILDINGSTOREY
      )
      const storeyCount = storeyIds.size()
      for (let i = 0; i < storeyCount; i++) {
        const sid = storeyIds.get(i)
        try {
          const storey = this.ifcApi.GetLine(this.modelID, sid)
          const name = storey?.Name?.value || `Storey ${sid}`
          const elevation: number = storey?.Elevation?.value ?? 0
          this.storeyElevations.set(name, elevation)
          // Map the storey entity itself
          this.storeyIndexMap.set(sid, name)
        } catch { /* skip */ }
      }

      // Map contained elements via IfcRelContainedInSpatialStructure
      const relIds = this.ifcApi.GetLineIDsWithType(
        this.modelID,
        IFC_TYPES.IFCRELCONTAINEDINSPATIALSTRUCTURE
      )
      const relCount = relIds.size()
      for (let i = 0; i < relCount; i++) {
        try {
          const rel = this.ifcApi.GetLine(this.modelID, relIds.get(i))
          const structureRef = rel?.RelatingStructure?.value
          if (!structureRef) continue
          const storeyName = this.storeyIndexMap.get(structureRef)
          if (!storeyName) continue // not a storey (could be building/site level)
          const relatedElements: Array<{ value: number }> = rel.RelatedElements || []
          for (const elem of relatedElements) {
            this.storeyIndexMap.set(elem.value, storeyName)
          }
        } catch { /* skip */ }
      }
    } catch { /* no storeys in model */ }
  }

  private buildCategoryIndex(): void {
    if (this.modelID === null) return

    for (const [category, typeIds] of Object.entries(IFC_CATEGORY_MAP)) {
      for (const typeId of typeIds) {
        try {
          const ids = this.ifcApi.GetLineIDsWithType(this.modelID, typeId)
          const count = ids.size()
          for (let i = 0; i < count; i++) {
            this.idToCategoryMap.set(ids.get(i), category)
          }
        } catch {
          // Type not present in model, skip
        }
      }
    }
  }

  private buildPropertyIndex(): void {
    if (this.modelID === null) return

    try {
      const relDefines = this.ifcApi.GetLineIDsWithType(
        this.modelID,
        IFC_TYPES.IFCRELDEFINESBYPROPERTIES
      )
      const count = relDefines.size()

      for (let i = 0; i < count; i++) {
        try {
          const rel = this.ifcApi.GetLine(this.modelID, relDefines.get(i))
          const psetRef = rel?.RelatingPropertyDefinition?.value
          if (!psetRef) continue

          const relatedObjects = rel.RelatedObjects || []
          for (const obj of relatedObjects) {
            const objID = obj.value
            if (!this.propertyIndex.has(objID)) {
              this.propertyIndex.set(objID, [])
            }
            this.propertyIndex.get(objID)!.push(psetRef)
          }
        } catch {
          // Skip malformed relationships
        }
      }
    } catch {
      // No property relationships in model
    }
  }

  private createThreeMesh(
    placedGeometry: WebIFC.PlacedGeometry,
    expressID: number,
    category: string,
    storey: string
  ): THREE.Mesh | null {
    if (this.modelID === null) return null

    try {
      const geometry = this.ifcApi.GetGeometry(
        this.modelID,
        placedGeometry.geometryExpressID
      )

      const verts = this.ifcApi.GetVertexArray(
        geometry.GetVertexData(),
        geometry.GetVertexDataSize()
      )
      const indices = this.ifcApi.GetIndexArray(
        geometry.GetIndexData(),
        geometry.GetIndexDataSize()
      )

      if (verts.length === 0 || indices.length === 0) {
        geometry.delete()
        return null
      }

      const bufferGeometry = new THREE.BufferGeometry()

      // Vertex data is interleaved: [px, py, pz, nx, ny, nz, ...]
      const vertexCount = verts.length / 6
      const positions = new Float32Array(vertexCount * 3)
      const normals = new Float32Array(vertexCount * 3)

      for (let j = 0; j < vertexCount; j++) {
        const srcIdx = j * 6
        const dstIdx = j * 3
        positions[dstIdx] = verts[srcIdx]
        positions[dstIdx + 1] = verts[srcIdx + 1]
        positions[dstIdx + 2] = verts[srcIdx + 2]
        normals[dstIdx] = verts[srcIdx + 3]
        normals[dstIdx + 1] = verts[srcIdx + 4]
        normals[dstIdx + 2] = verts[srcIdx + 5]
      }

      bufferGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      )
      bufferGeometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(normals, 3)
      )
      bufferGeometry.setIndex(
        new THREE.BufferAttribute(new Uint32Array(indices), 1)
      )

      // Color from IFC or use category default
      const ifcColor = placedGeometry.color
      let color: THREE.Color
      let opacity: number

      if (ifcColor) {
        color = new THREE.Color(ifcColor.x, ifcColor.y, ifcColor.z)
        opacity = ifcColor.w
      } else {
        const hex = CATEGORY_COLORS[category] || '#94a3b8'
        color = new THREE.Color(hex)
        opacity = 1
      }

      // Make spaces semi-transparent
      if (category === 'Spaces') {
        opacity = Math.min(opacity, 0.2)
      }

      const material = new THREE.MeshPhongMaterial({
        color,
        opacity,
        transparent: opacity < 1,
        side: THREE.DoubleSide,
        depthWrite: opacity >= 1,
      })

      const mesh = new THREE.Mesh(bufferGeometry, material)

      // Apply placement transform
      const matrix = new THREE.Matrix4().fromArray(
        placedGeometry.flatTransformation
      )
      mesh.applyMatrix4(matrix)

      mesh.userData.expressID = expressID
      mesh.userData.category = category
      mesh.userData.storey = storey

      geometry.delete()
      return mesh
    } catch (e) {
      console.warn('Failed to create mesh for expressID:', expressID, e)
      return null
    }
  }

  getElementProperties(expressID: number): PropertyGroup[] {
    if (this.modelID === null) return []

    const result: PropertyGroup[] = []

    try {
      // Basic element properties
      const element = this.ifcApi.GetLine(this.modelID, expressID)
      if (!element) return result

      const basicProps: PropertyItem[] = []

      if (element.GlobalId?.value) {
        basicProps.push({ name: 'GlobalId', value: element.GlobalId.value })
      }
      if (element.Name?.value) {
        basicProps.push({ name: 'Name', value: element.Name.value })
      }
      if (element.Description?.value) {
        basicProps.push({ name: 'Description', value: element.Description.value })
      }
      if (element.ObjectType?.value) {
        basicProps.push({ name: 'ObjectType', value: element.ObjectType.value })
      }
      if (element.Tag?.value) {
        basicProps.push({ name: 'Tag', value: element.Tag.value })
      }

      // Add IFC type name
      const typeName = IFC_TYPE_NAMES[element.type] || `IFC Type ${element.type}`
      basicProps.unshift({ name: 'IFC Type', value: typeName })
      basicProps.unshift({ name: 'Express ID', value: expressID })

      if (basicProps.length > 0) {
        result.push({ name: 'Basic Info', properties: basicProps })
      }

      // Property Sets
      const psetIds = this.propertyIndex.get(expressID)
      if (psetIds) {
        for (const psetId of psetIds) {
          try {
            const pset = this.ifcApi.GetLine(this.modelID, psetId, true)
            if (!pset) continue

            const psetName = pset.Name?.value || `Property Set ${psetId}`
            const props: PropertyItem[] = []

            const hasProperties = pset.HasProperties || []
            for (let pi = 0; pi < hasProperties.length; pi++) {
              const prop = hasProperties[pi]
              if (prop && prop.Name?.value != null) {
                let value: string | number | boolean = ''
                if (prop.NominalValue?.value != null) {
                  value = prop.NominalValue.value
                }
                props.push({
                  name: prop.Name.value,
                  value,
                  editable: true,
                  psetId,
                  propIndex: pi,
                })
              }
            }

            if (props.length > 0) {
              result.push({ name: psetName, properties: props })
            }
          } catch {
            // Skip malformed property sets
          }
        }
      }
    } catch (e) {
      console.warn('Failed to get properties for expressID:', expressID, e)
    }

    return result
  }

  /**
   * Update a single property value in the IFC model (in-memory).
   * Returns true on success.
   */
  updatePropertyValue(psetId: number, propIndex: number, newValue: string | number | boolean): boolean {
    if (this.modelID === null) return false
    try {
      const pset = this.ifcApi.GetLine(this.modelID, psetId, true)
      if (!pset) return false
      const prop = pset.HasProperties?.[propIndex]
      if (!prop || !prop.NominalValue) return false
      prop.NominalValue.value = newValue
      this.ifcApi.WriteLine(this.modelID, prop)
      return true
    } catch (e) {
      console.warn('Failed to update property:', e)
      return false
    }
  }

  /**
   * Export the current (possibly modified) IFC model as a Uint8Array.
   */
  saveModel(): Uint8Array | null {
    if (this.modelID === null) return null
    try {
      return this.ifcApi.SaveModel(this.modelID)
    } catch (e) {
      console.warn('Failed to save model:', e)
      return null
    }
  }

  dispose(): void {
    if (this.modelID !== null) {
      try {
        this.ifcApi.CloseModel(this.modelID)
      } catch {
        // Ignore errors during cleanup
      }
      this.modelID = null
    }
    this.idToCategoryMap.clear()
    this.storeyIndexMap.clear()
    this.storeyElevations.clear()
    this.propertyIndex.clear()
  }
}
