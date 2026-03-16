/* =============================================
   DRC State Store (Pinia)
   Manages rule configuration and violation results.
   ============================================= */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_DRC_RULES, USAGE_RULE_OVERRIDES } from '@/types/drc'
import type { DrcRuleConfig, DrcResult, BuildingUsage } from '@/types/drc'

export const useDrcStore = defineStore('drc', () => {
  // ---------- State ----------

  const panelOpen = ref(false)
  const isRunning = ref(false)
  const result = ref<DrcResult | null>(null)
  const buildingUsage = ref<BuildingUsage>('residential')

  // Deep-clone defaults so params are reactive and editable
  const rules = ref<DrcRuleConfig[]>(
    DEFAULT_DRC_RULES.map((r) => ({
      ...r,
      params: Object.fromEntries(
        Object.entries(r.params).map(([k, p]) => [k, { ...p }])
      ),
    }))
  )

  // ---------- Getters ----------

  function rulesByCategory(): Record<string, DrcRuleConfig[]> {
    const map: Record<string, DrcRuleConfig[]> = {}
    for (const rule of rules.value) {
      if (!map[rule.category]) map[rule.category] = []
      map[rule.category].push(rule)
    }
    return map
  }

  // ---------- Actions ----------

  function openPanel() {
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
  }

  function togglePanel() {
    panelOpen.value = !panelOpen.value
  }

  function setRunning(v: boolean) {
    isRunning.value = v
  }

  function setResult(r: DrcResult | null) {
    result.value = r
  }

  function clearResult() {
    result.value = null
  }

  function toggleRule(id: string) {
    const rule = rules.value.find((r) => r.id === id)
    if (rule) rule.enabled = !rule.enabled
  }

  function updateParam(ruleId: string, paramKey: string, value: number) {
    const rule = rules.value.find((r) => r.id === ruleId)
    if (rule && rule.params[paramKey]) {
      rule.params[paramKey].value = value
    }
  }

  function setBuildingUsage(usage: BuildingUsage) {
    buildingUsage.value = usage
    const overrides = USAGE_RULE_OVERRIDES[usage]
    
    if (!overrides) return

    // 遍歷當前所有的規則並套用對應的預設參數
    rules.value.forEach(rule => {
      if (overrides[rule.id]) {
        const paramKeys = Object.keys(overrides[rule.id])
        paramKeys.forEach(key => {
          if (rule.params[key]) {
            rule.params[key].value = overrides[rule.id][key]
          }
        })
      }
    })
  }

  function resetRules() {
    rules.value = DEFAULT_DRC_RULES.map((r) => ({
      ...r,
      params: Object.fromEntries(
        Object.entries(r.params).map(([k, p]) => [k, { ...p }])
      ),
    }))
    setBuildingUsage(buildingUsage.value)
  }

  return {
    panelOpen,
    isRunning,
    result,
    rules,
    buildingUsage,
    rulesByCategory,
    openPanel,
    closePanel,
    togglePanel,
    setRunning,
    setResult,
    clearResult,
    toggleRule,
    updateParam,
    setBuildingUsage,
    resetRules,
  }
})
