/* =============================================
   DRC State Store (Pinia)
   Manages rule configuration and violation results.
   ============================================= */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_DRC_RULES } from '@/types/drc'
import type { DrcRuleConfig, DrcResult } from '@/types/drc'

export const useDrcStore = defineStore('drc', () => {
  // ---------- State ----------

  const panelOpen = ref(false)
  const isRunning = ref(false)
  const result = ref<DrcResult | null>(null)

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

  function resetRules() {
    rules.value = DEFAULT_DRC_RULES.map((r) => ({
      ...r,
      params: Object.fromEntries(
        Object.entries(r.params).map(([k, p]) => [k, { ...p }])
      ),
    }))
  }

  return {
    panelOpen,
    isRunning,
    result,
    rules,
    rulesByCategory,
    openPanel,
    closePanel,
    togglePanel,
    setRunning,
    setResult,
    clearResult,
    toggleRule,
    updateParam,
    resetRules,
  }
})
