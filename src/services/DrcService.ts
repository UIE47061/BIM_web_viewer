/* =============================================
   DRC (Design Rule Check) Service
   Traverses Three.js scene meshes, groups them
   by expressID, computes world-space bounding
   boxes, and evaluates Taiwan building / fire
   code rules against element dimensions.
   ============================================= */

import * as THREE from 'three'
import type { DrcRuleConfig, DrcViolation, DrcResult } from '@/types/drc'

// Severity → highlight color
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',  // red
  warning:  '#f97316',  // orange
  notice:   '#eab308',  // yellow
}

// Helper: sort three dimensions and return [smallest, middle, largest]
function sortDims(sx: number, sy: number, sz: number): [number, number, number] {
  const arr = [sx, sy, sz].sort((a, b) => a - b)
  return [arr[0], arr[1], arr[2]]
}

// ------------------------------------------------------------------
// Core element-dimension checker per rule ID
// All rules receive the world-space bounding box SIZE (after rotation)
// so that size.y is always the real-world vertical extent.
// ------------------------------------------------------------------
type CheckFn = (
  size: THREE.Vector3,
  params: Record<string, number>,
  elementName: string
) => { actual: number; required: number; unit: string } | null

const RULE_CHECKERS: Record<string, CheckFn> = {
  // ── 門淨寬 ──────────────────────────────────
  // Door: height = size.y (IFC Z after rotation)
  //       width  = larger of size.x / size.z
  //       thickness = smaller of size.x / size.z
  door_width: (size, params) => {
    const width = Math.max(size.x, size.z)
    const min = params.minWidth
    if (width > 0.01 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },

  door_height: (size, params) => {
    const height = size.y
    const min = params.minHeight
    if (height > 0.1 && height < min) {
      return { actual: height, required: min, unit: 'm' }
    }
    return null
  },

  // ── 走廊淨寬 ────────────────────────────────
  // Space/Corridor: floor plan = size.x & size.z, height = size.y
  // Width = smaller of the two floor dims (corridor is narrow)
  corridor_width: (size, params, name) => {
    // Only check spaces that look like corridors (narrow ratio or named)
    const isNarrow = Math.max(size.x, size.z) / (Math.min(size.x, size.z) + 0.001) > 2.5
    const isCorridor =
      isNarrow ||
      /走廊|corridor|hall|passage|lobby|foyer|gang|flur/i.test(name)
    if (!isCorridor) return null

    const width = Math.min(size.x, size.z)
    const min = params.minWidth
    if (width > 0.01 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },

  // ── 樓梯淨寬 ────────────────────────────────
  stair_width: (size, params) => {
    // For a stair flight: two large dims are the run & width, one is height
    const [, mid] = sortDims(size.x, size.y, size.z)
    const width = mid
    const min = params.minWidth
    if (width > 0.1 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },

  // ── 居室淨高 ────────────────────────────────
  room_height: (size, params) => {
    const height = size.y
    const min = params.minHeight
    if (height > 0.5 && height < min) {
      return { actual: height, required: min, unit: 'm' }
    }
    return null
  },

  // ── 窗戶採光高 ──────────────────────────────
  window_sill_ratio: (size, params) => {
    const height = size.y
    const min = params.minHeight
    if (height > 0.01 && height < min) {
      return { actual: height, required: min, unit: 'm' }
    }
    return null
  },

  // ── 窗戶通風寬 ──────────────────────────────
  window_width: (size, params) => {
    const width = Math.max(size.x, size.z)
    const min = params.minWidth
    if (width > 0.01 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },

  // ── 樓板厚度 ────────────────────────────────
  // Slab: thin in Y (after Z-up rotation), large in X and Z
  slab_thickness: (size, params) => {
    const [smallest] = sortDims(size.x, size.y, size.z)
    const min = params.minThickness
    if (smallest > 0.001 && smallest < min) {
      return { actual: smallest, required: min, unit: 'm' }
    }
    return null
  },

  // ── 柱截面 ──────────────────────────────────
  // Column: tall in Y, square-ish in X/Z
  column_min_dim: (size, params) => {
    const planMin = Math.min(size.x, size.z)
    const min = params.minDim
    if (planMin > 0.01 && planMin < min) {
      return { actual: planMin, required: min, unit: 'm' }
    }
    return null
  },

  // ── 牆體厚度 ────────────────────────────────
  // Wall: thin in one horiz dim, tall in Y (height), long in the other horiz
  wall_thickness: (size, params) => {
    const planMin = Math.min(size.x, size.z)
    const min = params.minThickness
    // Only check walls that look like walls (height > 1m)
    if (size.y < 1.0) return null
    if (planMin > 0.001 && planMin < min) {
      return { actual: planMin, required: min, unit: 'm' }
    }
    return null
  },

  // ── 消防門寬 ────────────────────────────────
  fire_door_width: (size, params) => {
    const width = Math.max(size.x, size.z)
    const min = params.minWidth
    if (width > 0.01 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },

  // ── 避難走廊寬 ──────────────────────────────
  fire_corridor_width: (size, params, name) => {
    const isNarrow = Math.max(size.x, size.z) / (Math.min(size.x, size.z) + 0.001) > 2.0
    const isCorridor = isNarrow || /走廊|corridor|hall|passage|lobby/i.test(name)
    if (!isCorridor) return null
    const width = Math.min(size.x, size.z)
    const min = params.minWidth
    if (width > 0.01 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },

  // ── 無障礙門寬 ──────────────────────────────
  accessible_door_width: (size, params) => {
    const width = Math.max(size.x, size.z)
    const min = params.minWidth
    if (width > 0.01 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },

  // ── 無障礙走廊寬 ────────────────────────────
  accessible_corridor_width: (size, params, name) => {
    const isNarrow = Math.max(size.x, size.z) / (Math.min(size.x, size.z) + 0.001) > 2.0
    const isCorridor = isNarrow || /走廊|corridor|hall|passage|lobby/i.test(name)
    if (!isCorridor) return null
    const width = Math.min(size.x, size.z)
    const min = params.minWidth
    if (width > 0.01 && width < min) {
      return { actual: width, required: min, unit: 'm' }
    }
    return null
  },
}

// ------------------------------------------------------------------
// DrcService
// ------------------------------------------------------------------
export class DrcService {
  /**
   * Traverse the model group, compute per-element world bounding boxes,
   * and check each enabled rule. Returns DrcResult with all violations.
   */
  runChecks(
    modelGroup: THREE.Group,
    rules: DrcRuleConfig[]
  ): DrcResult {
    const enabledRules = rules.filter((r) => r.enabled)

    // ── Step 1: group meshes by expressID → combined world bbox + metadata
    interface ElemInfo {
      bbox: THREE.Box3
      category: string
      name: string
    }
    const elements = new Map<number, ElemInfo>()

    modelGroup.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const { expressID, category } = obj.userData
      if (!expressID) return

      const worldBBox = new THREE.Box3().setFromObject(obj)

      if (!elements.has(expressID)) {
        elements.set(expressID, {
          bbox: worldBBox.clone(),
          category: category || 'Other',
          name: (obj.userData.name as string) || '',
        })
      } else {
        elements.get(expressID)!.bbox.union(worldBBox)
      }
    })

    // ── Step 2: evaluate rules per element
    const violations: DrcViolation[] = []
    const size = new THREE.Vector3()

    for (const [expressID, info] of elements) {
      info.bbox.getSize(size)

      for (const rule of enabledRules) {
        if (!rule.affectedCategories.includes(info.category)) continue

        const checker = RULE_CHECKERS[rule.id]
        if (!checker) continue

        // Flatten params to number values for checker
        const paramValues: Record<string, number> = {}
        for (const [key, param] of Object.entries(rule.params)) {
          paramValues[key] = param.value
        }

        const failure = checker(size.clone(), paramValues, info.name)
        if (failure) {
          violations.push({
            ruleId: rule.id,
            ruleNameZh: rule.nameZh,
            expressID,
            severity: rule.severity,
            messageZh: `${info.category} #${expressID}：${rule.nameZh} ${failure.actual.toFixed(3)}${failure.unit} < 規定 ${failure.required}${failure.unit}`,
            actualValue: parseFloat(failure.actual.toFixed(4)),
            requiredValue: failure.required,
            unit: failure.unit,
            color: SEVERITY_COLORS[rule.severity] ?? '#ef4444',
          })
        }
      }
    }

    const failIDs = new Set(violations.map((v) => v.expressID))

    return {
      violations,
      elementCheckedCount: elements.size,
      elementFailCount: failIDs.size,
      runAt: new Date(),
    }
  }
}
