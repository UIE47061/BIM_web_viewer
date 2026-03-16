<template>
  <!-- Overlay backdrop -->
  <Transition name="backdrop">
    <div
      v-if="drc.panelOpen"
      class="drc-backdrop"
      @click="drc.closePanel()"
    />
  </Transition>

  <!-- Panel -->
  <Transition name="drc-slide">
    <div v-if="drc.panelOpen" class="drc-panel">

      <!-- ── Header ─────────────────────────── -->
      <div class="drc-panel__header">
        <div class="drc-panel__title-row">
          <SvgIcon :path="icons.check" :size="18" color="var(--accent-primary)" />
          <span class="drc-panel__title">DRC</span>
          <span class="drc-panel__title-zh">設計規則檢查</span>
        </div>
        <div class="drc-panel__header-actions">
          <button
            class="drc-action-btn"
            :disabled="!modelLoaded || drc.isRunning"
            title="執行 DRC 檢查"
            @click="$emit('run-drc')"
          >
            <SvgIcon :path="drc.isRunning ? icons.loading : icons.play" :size="15" :class="{ spin: drc.isRunning }" />
            {{ drc.isRunning ? '檢查中…' : '執行' }}
          </button>
          <button
            class="drc-action-btn"
            :disabled="!drc.result"
            title="清除所有 DRC 標記"
            @click="$emit('clear-drc')"
          >
            <SvgIcon :path="icons.clear" :size="15" />
            清除
          </button>
          <button
            class="drc-action-btn drc-action-btn--icon"
            title="重設所有規則至預設值"
            @click="drc.resetRules()"
          >
            <SvgIcon :path="icons.reset" :size="15" />
          </button>
          <div class="drc-panel__header-divider" />
          <button class="drc-action-btn drc-action-btn--icon" title="關閉" @click="drc.closePanel()">
            <SvgIcon :path="icons.close" :size="15" />
          </button>
        </div>
      </div>

      <!-- ── Tabs ───────────────────────────── -->
      <div class="drc-panel__tabs">
        <button
          class="drc-tab"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          <SvgIcon :path="icons.settings" :size="14" />
          規則設定
        </button>
        <button
          class="drc-tab"
          :class="{ active: activeTab === 'results' }"
          @click="activeTab = 'results'"
        >
          <SvgIcon :path="icons.results" :size="14" />
          檢查結果
          <span
            v-if="drc.result && drc.result.violations.length"
            class="drc-tab__badge"
          >
            {{ drc.result.violations.length }}
          </span>
        </button>
      </div>

      <!-- ── Settings tab ───────────────────── -->
      <div v-show="activeTab === 'settings'" class="drc-panel__body">
        
        <!-- 新增的用途切換器 -->
        <div class="drc-usage-selector">
          <label>建築物用途：</label>
          <select class="drc-select" :value="drc.buildingUsage" @change="(e) => drc.setBuildingUsage((e.target as HTMLSelectElement).value as any)">
            <option value="residential">住宅 (Residential) - H類</option>
            <option value="educational">教育設施 (Educational) - D類</option>
            <option value="commercial">商業空間 (Commercial) - B類</option>
          </select>
        </div>

        <div
          v-for="(groupRules, groupName) in drc.rulesByCategory()"
          :key="groupName"
          class="drc-group"
        >
          <!-- group header matches section-toggle style -->
          <div class="drc-group__header">
            <SvgIcon :path="categoryIcon(groupName)" :size="14" />
            <span>{{ groupName }}</span>
          </div>

          <div
            v-for="rule in groupRules"
            :key="rule.id"
            class="drc-rule"
            :class="{ 'drc-rule--disabled': !rule.enabled }"
          >
            <!-- Rule row -->
            <div class="drc-rule__row" @click="drc.toggleRule(rule.id)">
              <!-- severity color stripe (same pattern as toggle-item__color) -->
              <div class="drc-rule__stripe" :class="rule.severity" />
              <div
                class="drc-rule__toggle"
                :class="{ on: rule.enabled }"
              >
                <div class="drc-rule__toggle-thumb" />
              </div>
              <div class="drc-rule__info">
                <div class="drc-rule__name">{{ rule.nameZh }}</div>
                <div class="drc-rule__meta">
                  <span class="drc-rule__sev-label" :class="rule.severity">{{ severityLabel(rule.severity) }}</span>
                  <span class="drc-rule__ref" :title="rule.descZh">{{ rule.reference }}</span>
                </div>
              </div>
            </div>

            <!-- Param inputs -->
            <div v-if="rule.enabled" class="drc-rule__params">
              <label
                v-for="(param, key) in rule.params"
                :key="key"
                class="drc-param"
                @click.stop
              >
                <span class="drc-param__label">{{ param.label }}</span>
                <div class="drc-param__input-wrap">
                  <input
                    type="number"
                    class="drc-param__input"
                    :value="param.value"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step"
                    @change="onParamChange(rule.id, key, ($event.target as HTMLInputElement).value)"
                  />
                  <span class="drc-param__unit">{{ param.unit }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Results tab ────────────────────── -->
      <div v-show="activeTab === 'results'" class="drc-panel__body">
        <!-- No result yet -->
        <div v-if="!drc.result" class="drc-empty">
          <SvgIcon :path="icons.play" :size="32" color="var(--text-muted)" />
          <p>尚未執行檢查</p>
          <p class="drc-empty__sub">請在「規則設定」中啟用規則<br>再點擊標題列的「執行」</p>
        </div>

        <!-- Summary + violations -->
        <template v-else>
          <div class="drc-summary">
            <div class="drc-summary__stat">
              <span class="drc-summary__num">{{ drc.result.elementCheckedCount }}</span>
              <span class="drc-summary__label">已檢查</span>
            </div>
            <div class="drc-summary__stat">
              <span class="drc-summary__num">{{ drc.result.elementCheckedCount - drc.result.elementFailCount }}</span>
              <span class="drc-summary__label">通過</span>
            </div>
            <div class="drc-summary__stat" :class="{ 'drc-summary__stat--fail': drc.result.elementFailCount > 0 }">
              <span class="drc-summary__num">{{ drc.result.elementFailCount }}</span>
              <span class="drc-summary__label">違規</span>
            </div>
            <div class="drc-summary__time">{{ formatTime(drc.result.runAt) }}</div>
          </div>

          <!-- All pass -->
          <div v-if="drc.result.violations.length === 0" class="drc-pass-msg">
            <SvgIcon :path="icons.pass" :size="22" />
            <span>所有已啟用規則均通過</span>
          </div>

          <!-- Grouped violations -->
          <template v-else>
            <div
              v-for="sev in ['critical', 'warning', 'notice']"
              :key="sev"
            >
              <div v-if="violationsBySeverity(sev).length" class="drc-sev-group">
                <!-- header matches category-tree__header style -->
                <div class="drc-sev-group__header">
                  <div class="drc-sev-group__stripe" :class="sev" />
                  <SvgIcon :path="severityIcon(sev)" :size="13" />
                  <span>{{ severityLabel(sev) }}</span>
                  <span class="drc-sev-group__count">{{ violationsBySeverity(sev).length }}</span>
                </div>
                <div
                  v-for="v in violationsBySeverity(sev)"
                  :key="`${v.ruleId}_${v.expressID}`"
                  class="drc-violation"
                  @click="$emit('focus-element', v.expressID)"
                >
                  <div class="drc-violation__stripe" :style="{ background: v.color }" />
                  <div class="drc-violation__body">
                    <div class="drc-violation__rule">{{ v.ruleNameZh }}</div>
                    <div class="drc-violation__detail">
                      ID {{ v.expressID }}・實際
                      <strong>{{ v.actualValue.toFixed(2) }}{{ v.unit }}</strong>
                      &lt; 規定
                      <strong>{{ v.requiredValue }}{{ v.unit }}</strong>
                    </div>
                  </div>
                  <SvgIcon :path="icons.target" :size="14" class="drc-violation__focus" />
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  mdiCheckDecagram,
  mdiClose,
  mdiPlay,
  mdiEraserVariant,
  mdiRefresh,
  mdiTuneVariant,
  mdiListBox,
  mdiLoading,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiAlert,
  mdiInformationOutline,
  mdiCrosshairsGps,
  mdiDoor,
  mdiElevator,
  mdiHomeCityOutline,
  mdiFireAlert,
  mdiWheelchairAccessibility,
  mdiPillar,
} from '@mdi/js'
import { useDrcStore } from '@/stores/drcStore'
import SvgIcon from '@/components/common/SvgIcon.vue'
import type { DrcSeverity } from '@/types/drc'

const props = defineProps<{ modelLoaded: boolean }>()
defineEmits<{
  'run-drc': []
  'clear-drc': []
  'focus-element': [expressID: number]
}>()

const drc = useDrcStore()
const activeTab = ref<'settings' | 'results'>('settings')

const icons = {
  check: mdiCheckDecagram,
  close: mdiClose,
  play: mdiPlay,
  clear: mdiEraserVariant,
  reset: mdiRefresh,
  settings: mdiTuneVariant,
  results: mdiListBox,
  loading: mdiLoading,
  pass: mdiCheckCircle,
  target: mdiCrosshairsGps,
}

const hasCritical = computed(() =>
  drc.result?.violations.some((v) => v.severity === 'critical') ?? false
)

function violationsBySeverity(sev: string) {
  return drc.result?.violations.filter((v) => v.severity === sev) ?? []
}

function severityLabel(sev: string): string {
  return { critical: '嚴重', warning: '警告', notice: '注意' }[sev] ?? sev
}

function severityIcon(sev: string): string {
  return { critical: mdiAlertCircle, warning: mdiAlert, notice: mdiInformationOutline }[sev] ?? mdiInformationOutline
}

function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    '出入口 & 通道': mdiDoor,
    '挑高 & 空間': mdiHomeCityOutline,
    '結構尺寸': mdiPillar,
    '消防法規': mdiFireAlert,
    '無障礙設計': mdiWheelchairAccessibility,
  }
  return map[cat] ?? mdiCheckDecagram
}

function onParamChange(ruleId: string, key: string, raw: string) {
  const val = parseFloat(raw)
  if (!isNaN(val)) drc.updateParam(ruleId, key, val)
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<style scoped>
/* ── overlay backdrop ─────────────────────────── */
.drc-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.25);
}

/* ── panel ────────────────────────────────────── */
.drc-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  z-index: 2010;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── header ───────────────────────────────────── */
.drc-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 14px;
  height: 44px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.drc-panel__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.drc-panel__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.drc-panel__title-zh {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}

.drc-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.drc-panel__header-divider {
  width: 1px;
  height: 16px;
  background: var(--border-color);
  margin: 0 2px;
}

/* ── action buttons (same as category-tree__action / icon-button) ── */
.drc-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  line-height: 1;
  white-space: nowrap;
}

.drc-action-btn:hover:not(:disabled) {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

.drc-action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.drc-action-btn--icon {
  padding: 5px 6px;
}

/* ── tabs ─────────────────────────────────────── */
.drc-panel__tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.drc-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  justify-content: center;
  padding: 9px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}

.drc-tab:hover {
  color: var(--text-primary);
}

.drc-tab.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent-primary);
}

/* badge matches toggle-item__count */
.drc-tab__badge {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 400;
}

/* ── body ─────────────────────────────────────── */
.drc-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

/* ── rule group header (matches section-toggle) ── */
.drc-usage-selector {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.drc-usage-selector label {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.drc-select {
  flex: 1;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%239ba1a6%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2Fx%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 28px;
  transition: border-color var(--transition-fast);
}

.drc-select:focus {
  border-color: var(--accent-primary);
}

.drc-group {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
  margin-bottom: 0;
}

.drc-group__header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 8px 6px 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  cursor: default;
}

/* ── single rule (matches toggle-item layout) ─── */
.drc-rule {
  padding: 0 4px 0 12px;
  transition: opacity var(--transition-fast);
}

.drc-rule--disabled {
  opacity: 0.55;
}

.drc-rule__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px 7px 0;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  user-select: none;
}

.drc-rule__row:hover {
  background: var(--bg-surface-hover);
}

/* severity left-strip (same as toggle-item__color) */
.drc-rule__stripe {
  width: 4px;
  height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}
.drc-rule__stripe.critical { background: #ef4444; }
.drc-rule__stripe.warning  { background: #f97316; }
.drc-rule__stripe.notice   { background: #eab308; }

/* toggle switch — unified accent-primary, no per-severity color */
.drc-rule__toggle {
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: var(--bg-surface-active);
  position: relative;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.drc-rule__toggle.on {
  background: var(--accent-primary);
}

.drc-rule__toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  transition: transform var(--transition-fast);
}

.drc-rule__toggle.on .drc-rule__toggle-thumb {
  transform: translateX(14px);
}

.drc-rule__info {
  flex: 1;
  min-width: 0;
}

.drc-rule__name {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drc-rule__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 1px;
}

/* severity plain label — NO pill, just small muted text with color */
.drc-rule__sev-label {
  font-size: 10px;
  font-weight: 600;
}
.drc-rule__sev-label.critical { color: #ef4444; }
.drc-rule__sev-label.warning  { color: #f97316; }
.drc-rule__sev-label.notice   { color: #ca8a04; }

.drc-rule__ref {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── param inputs ─────────────────────────────── */
.drc-rule__params {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 4px 8px 40px;
}

.drc-param {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.drc-param__label {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
}

.drc-param__input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  padding: 0 6px;
  height: 26px;
}

.drc-param__input {
  width: 58px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: right;
  outline: none;
  -moz-appearance: textfield;
}

.drc-param__input::-webkit-outer-spin-button,
.drc-param__input::-webkit-inner-spin-button { -webkit-appearance: none; }

.drc-param__unit {
  font-size: 11px;
  color: var(--text-muted);
}

/* ── empty state ──────────────────────────────── */
.drc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.drc-empty__sub {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

/* ── summary ──────────────────────────────────── */
.drc-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
}

.drc-summary__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 60px;
  padding: 8px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
}

/* only the "違規" stat gets a subtle color when there are failures */
.drc-summary__stat--fail .drc-summary__num {
  color: #ef4444;
}

.drc-summary__num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.drc-summary__label {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

.drc-summary__time {
  width: 100%;
  font-size: 10px;
  color: var(--text-muted);
  text-align: right;
}

/* ── pass message ─────────────────────────────── */
.drc-pass-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

/* ── violation severity group ─────────────────── */
.drc-sev-group {
  padding: 0;
}

/* header matches category-tree__header section-toggle style */
.drc-sev-group__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 6px 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.drc-sev-group__stripe {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}
.drc-sev-group__stripe.critical { background: #ef4444; }
.drc-sev-group__stripe.warning  { background: #f97316; }
.drc-sev-group__stripe.notice   { background: #eab308; }

/* count matches toggle-item__count */
.drc-sev-group__count {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: auto;
  font-weight: 400;
}

/* ── violation row (matches toggle-item layout) ── */
.drc-violation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  user-select: none;
}

.drc-violation:hover {
  background: var(--bg-surface-hover);
}

.drc-violation__stripe {
  width: 4px;
  height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}

.drc-violation__body {
  flex: 1;
  min-width: 0;
}

.drc-violation__rule {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drc-violation__detail {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.drc-violation__focus {
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.drc-violation:hover .drc-violation__focus {
  opacity: 1;
  color: var(--accent-primary);
}

/* ── transitions ──────────────────────────────── */
.backdrop-enter-active,
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from,
.backdrop-leave-to     { opacity: 0; }

.drc-slide-enter-active,
.drc-slide-leave-active { transition: transform 0.25s ease; }
.drc-slide-enter-from,
.drc-slide-leave-to     { transform: translateX(100%); }

/* loading spin */
.spin {
  animation: spin 0.8s linear infinite;
}
</style>
