/* =============================================
   Design Rule Check (DRC) Type Definitions
   Based on Taiwan Building Code (建築技術規則)
   and Fire Service Act (消防法規)
   ============================================= */

export type DrcSeverity = 'critical' | 'warning' | 'notice'

// ---------- Rule Config (editable by user) ----------

export interface DrcRuleParam {
  label: string         // Chinese label
  value: number
  unit: string
  min: number
  max: number
  step: number
}

export interface DrcRuleConfig {
  id: string
  nameZh: string        // Chinese rule name
  descZh: string        // Description
  reference: string     // Taiwan law reference
  category: string      // UI group
  severity: DrcSeverity
  enabled: boolean
  affectedCategories: string[]  // IFC categories to check
  params: Record<string, DrcRuleParam>
}

// ---------- Violation (per element) ----------

export interface DrcViolation {
  ruleId: string
  ruleNameZh: string
  expressID: number
  severity: DrcSeverity
  messageZh: string
  actualValue: number
  requiredValue: number
  unit: string
  // Color to render on the element
  color: string
}

// ---------- Run Result ----------

export interface DrcResult {
  violations: DrcViolation[]
  elementCheckedCount: number
  elementFailCount: number
  runAt: Date
}

// ---------- Default Rule Configs ----------

export const DEFAULT_DRC_RULES: DrcRuleConfig[] = [
  // ── 出入口 & 通道 ─────────────────────────
  {
    id: 'door_width',
    nameZh: '門淨寬',
    descZh: '門扇開啟後門口淨寬不得小於規定值',
    reference: '建築技術規則 §170、無障礙規範 §4.2',
    category: '出入口 & 通道',
    severity: 'critical',
    enabled: true,
    affectedCategories: ['Doors'],
    params: {
      minWidth: { label: '最小淨寬', value: 0.9, unit: 'm', min: 0.5, max: 3.0, step: 0.05 },
    },
  },
  {
    id: 'door_height',
    nameZh: '門淨高',
    descZh: '門口淨高不得小於規定值',
    reference: '建築技術規則 §164',
    category: '出入口 & 通道',
    severity: 'warning',
    enabled: true,
    affectedCategories: ['Doors'],
    params: {
      minHeight: { label: '最小淨高', value: 2.0, unit: 'm', min: 1.5, max: 3.0, step: 0.1 },
    },
  },
  {
    id: 'corridor_width',
    nameZh: '走廊淨寬',
    descZh: '走廊（含避難通道）淨寬需符合使用類別要求',
    reference: '建築技術規則 §92、消防法 §10',
    category: '出入口 & 通道',
    severity: 'critical',
    enabled: true,
    affectedCategories: ['Spaces'],
    params: {
      minWidth: { label: '最小淨寬', value: 1.2, unit: 'm', min: 0.8, max: 3.0, step: 0.1 },
    },
  },
  {
    id: 'stair_width',
    nameZh: '樓梯淨寬',
    descZh: '樓梯淨寬需符合避難逃生要求',
    reference: '建築技術規則 §34、§98',
    category: '出入口 & 通道',
    severity: 'critical',
    enabled: true,
    affectedCategories: ['Stairs'],
    params: {
      minWidth: { label: '最小淨寬', value: 1.2, unit: 'm', min: 0.6, max: 3.0, step: 0.1 },
    },
  },
  // ── 挑高 & 空間 ────────────────────────────
  {
    id: 'room_height',
    nameZh: '居室淨高',
    descZh: '居室（住宅、辦公室等）天花板淨高不得低於規定值',
    reference: '建築技術規則 §164',
    category: '挑高 & 空間',
    severity: 'warning',
    enabled: true,
    affectedCategories: ['Spaces'],
    params: {
      minHeight: { label: '最小淨高', value: 2.1, unit: 'm', min: 1.8, max: 5.0, step: 0.1 },
    },
  },
  {
    id: 'window_sill_ratio',
    nameZh: '窗戶淨高（採光）',
    descZh: '窗戶開口高度需確保足夠採光',
    reference: '建築技術規則 §42（採光面積不得小於樓地板面積 1/8）',
    category: '挑高 & 空間',
    severity: 'notice',
    enabled: true,
    affectedCategories: ['Windows'],
    params: {
      minHeight: { label: '最小開口高', value: 0.9, unit: 'm', min: 0.3, max: 3.0, step: 0.1 },
    },
  },
  {
    id: 'window_width',
    nameZh: '窗戶淨寬（通風）',
    descZh: '窗戶開口寬度需確保足夠通風',
    reference: '建築技術規則 §43（通風面積不得小於樓地板面積 1/16）',
    category: '挑高 & 空間',
    severity: 'notice',
    enabled: true,
    affectedCategories: ['Windows'],
    params: {
      minWidth: { label: '最小開口寬', value: 0.6, unit: 'm', min: 0.2, max: 3.0, step: 0.1 },
    },
  },
  // ── 結構尺寸 ────────────────────────────────
  {
    id: 'slab_thickness',
    nameZh: '樓板厚度',
    descZh: '鋼筋混凝土樓板結構厚度不得小於規定值',
    reference: '建築技術規則 §56（RC 樓板最小厚度 12cm）',
    category: '結構尺寸',
    severity: 'critical',
    enabled: true,
    affectedCategories: ['Slabs'],
    params: {
      minThickness: { label: '最小厚度', value: 0.12, unit: 'm', min: 0.05, max: 0.5, step: 0.01 },
    },
  },
  {
    id: 'column_min_dim',
    nameZh: '柱最小截面尺寸',
    descZh: '結構柱截面最短邊不得小於規定值',
    reference: '建築技術規則 §51（RC 柱最小尺寸 20cm）',
    category: '結構尺寸',
    severity: 'critical',
    enabled: true,
    affectedCategories: ['Columns'],
    params: {
      minDim: { label: '最小截面邊', value: 0.2, unit: 'm', min: 0.1, max: 2.0, step: 0.05 },
    },
  },
  {
    id: 'wall_thickness',
    nameZh: '牆體最小厚度',
    descZh: '承重牆或防火牆厚度需符合最低要求',
    reference: '建築技術規則 §47（防火牆最小厚度 15cm）',
    category: '結構尺寸',
    severity: 'warning',
    enabled: true,
    affectedCategories: ['Walls', 'Curtain Walls'],
    params: {
      minThickness: { label: '最小厚度', value: 0.1, unit: 'm', min: 0.05, max: 0.5, step: 0.01 },
    },
  },
  // ── 消防法規 ────────────────────────────────
  {
    id: 'fire_door_width',
    nameZh: '防火門淨寬（出口）',
    descZh: '避難出口（安全梯、緊急出口）門寬應符合消防規定',
    reference: '各類場所消防安全設備設置標準 §157',
    category: '消防法規',
    severity: 'critical',
    enabled: false,
    affectedCategories: ['Doors'],
    params: {
      minWidth: { label: '最小淨寬', value: 1.2, unit: 'm', min: 0.8, max: 3.0, step: 0.1 },
    },
  },
  {
    id: 'fire_corridor_width',
    nameZh: '避難走廊淨寬',
    descZh: '消防逃生走廊淨寬需確保人員疏散',
    reference: '各類場所消防安全設備設置標準 §19',
    category: '消防法規',
    severity: 'critical',
    enabled: false,
    affectedCategories: ['Spaces'],
    params: {
      minWidth: { label: '最小淨寬', value: 1.8, unit: 'm', min: 1.0, max: 4.0, step: 0.1 },
    },
  },
  // ── 無障礙設計 ──────────────────────────────
  {
    id: 'accessible_door_width',
    nameZh: '無障礙門淨寬',
    descZh: '無障礙空間門口淨寬，需容許輪椅通行',
    reference: '建築物無障礙設施設計規範 §4.2（淨寬 ≥ 80cm）',
    category: '無障礙設計',
    severity: 'warning',
    enabled: false,
    affectedCategories: ['Doors'],
    params: {
      minWidth: { label: '最小淨寬', value: 0.8, unit: 'm', min: 0.6, max: 1.5, step: 0.05 },
    },
  },
  {
    id: 'accessible_corridor_width',
    nameZh: '無障礙走廊淨寬',
    descZh: '無障礙走廊淨寬需容許輪椅迴轉',
    reference: '建築物無障礙設施設計規範 §4.1（淨寬 ≥ 150cm）',
    category: '無障礙設計',
    severity: 'warning',
    enabled: false,
    affectedCategories: ['Spaces'],
    params: {
      minWidth: { label: '最小淨寬', value: 1.5, unit: 'm', min: 0.8, max: 3.0, step: 0.1 },
    },
  },
  // ── 台灣建築技術規則 (Taiwan specific) ──
  {
    id: 'tw_private_road_width',
    nameZh: '台灣-私設通路寬度',
    descZh: '依長度分級：<10m寬2m, <20m寬3m, ≥20m寬5m',
    reference: '建築技術規則 §2',
    category: '台灣建築技術規則',
    severity: 'critical',
    enabled: true,
    affectedCategories: ['Spaces', 'Site'],
    params: {
      minWidthForLong: { label: '長度≥20m最小淨寬', value: 5.0, unit: 'm', min: 2.0, max: 8.0, step: 0.1 },
      minWidthForMid:  { label: '長度10-20m最小淨寬', value: 3.0, unit: 'm', min: 2.0, max: 8.0, step: 0.1 },
      minWidthForShort:{ label: '長度<10m最小淨寬', value: 2.0, unit: 'm', min: 1.0, max: 8.0, step: 0.1 },
    },
  },
  {
    id: 'tw_waterproof_gate_height',
    nameZh: '台灣-防水閘門高度',
    descZh: '地下層出入口防水閘門自基地地面起算應達90公分',
    reference: '建築技術規則 §4-1',
    category: '台灣建築技術規則',
    severity: 'warning',
    enabled: true,
    affectedCategories: ['Accessory', 'Doors'],
    params: {
      minHeight: { label: '最小高度', value: 0.9, unit: 'm', min: 0.3, max: 2.0, step: 0.05 },
    },
  },
  {
    id: 'tw_balcony_depth',
    nameZh: '台灣-陽台/雨遮突出深度',
    descZh: '突出建築物外牆中心線超過一定深度應計入建築面積',
    reference: '建築技術規則 §1 款3',
    category: '台灣建築技術規則',
    severity: 'notice',
    enabled: true,
    affectedCategories: ['Slabs', 'Roofs', 'Accessories'],
    params: {
      maxDepth: { label: '免計入最大深度', value: 2.0, unit: 'm', min: 0.5, max: 5.0, step: 0.1 },
    },
  },
]

export type BuildingUsage = 'residential' | 'educational' | 'commercial'

export const USAGE_RULE_OVERRIDES: Record<BuildingUsage, Record<string, Record<string, number>>> = {
  residential: {
    corridor_width: { minWidth: 1.2 },
    stair_width: { minWidth: 1.2 },
    room_height: { minHeight: 2.1 },
  },
  educational: {
    corridor_width: { minWidth: 1.8 },
    stair_width: { minWidth: 1.4 },
    room_height: { minHeight: 3.0 },
  },
  commercial: {
    corridor_width: { minWidth: 1.6 },
    stair_width: { minWidth: 1.4 },
    room_height: { minHeight: 2.5 },
  }
}
