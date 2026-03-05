/* =============================================
   IFC Type Definitions & Constants
   ============================================= */

// ---------- Interfaces ----------

export interface CategoryInfo {
  name: string
  icon: string
  visible: boolean
  count: number
  color: string
}

export interface PropertyGroup {
  name: string
  properties: PropertyItem[]
}

export interface PropertyItem {
  name: string
  value: string | number | boolean
}

export interface ModelStats {
  fileName: string
  fileSize: number
  totalElements: number
  categoriesCount: number
}

export interface StoreyInfo {
  name: string
  elevation: number
  visible: boolean
  count: number
}

// ---------- IFC Type Constants ----------
// Numeric IFC type IDs (stable across web-ifc versions)

export const IFC_TYPES = {
  IFCWALL: 2391406946,
  IFCWALLSTANDARDCASE: 3512223829,
  IFCSLAB: 1529196076,
  IFCCOLUMN: 843113511,
  IFCBEAM: 753842376,
  IFCDOOR: 395920057,
  IFCWINDOW: 3304561284,
  IFCSTAIR: 331165859,
  IFCSTAIRFLIGHT: 4252922144,
  IFCROOF: 2016517767,
  IFCRAILING: 2262370178,
  IFCFURNISHINGELEMENT: 263784265,
  IFCFLOWSEGMENT: 987401354,
  IFCFLOWTERMINAL: 2058353004,
  IFCFLOWFITTING: 4278956645,
  IFCPLATE: 3171933400,
  IFCCURTAINWALL: 844613155,
  IFCMEMBER: 1073191201,
  IFCFOOTING: 900683007,
  IFCSPACE: 3856911033,
  IFCOPENINGELEMENT: 3588315303,
  IFCBUILDINGELEMENTPROXY: 1095909175,
  IFCPROXY: 3219374653,
  IFCCOVERING: 1973544240,
  IFCRELDEFINESBYPROPERTIES: 4186316022,
  IFCPROPERTYSET: 1451395588,
  IFCPROPERTYSINGLEVALUE: 3650150729,
  IFCBUILDINGSTOREY: 3124254112,
  IFCRELCONTAINEDINSPATIALSTRUCTURE: 3242617779,
} as const

// ---------- Category Mapping ----------
// Maps user-friendly category names to IFC type IDs

export const IFC_CATEGORY_MAP: Record<string, number[]> = {
  'Walls':          [IFC_TYPES.IFCWALL, IFC_TYPES.IFCWALLSTANDARDCASE],
  'Curtain Walls':  [IFC_TYPES.IFCCURTAINWALL],
  'Slabs':          [IFC_TYPES.IFCSLAB],
  'Columns':        [IFC_TYPES.IFCCOLUMN],
  'Beams':          [IFC_TYPES.IFCBEAM],
  'Doors':          [IFC_TYPES.IFCDOOR],
  'Windows':        [IFC_TYPES.IFCWINDOW],
  'Stairs':         [IFC_TYPES.IFCSTAIR, IFC_TYPES.IFCSTAIRFLIGHT],
  'Roofs':          [IFC_TYPES.IFCROOF],
  'Railings':       [IFC_TYPES.IFCRAILING],
  'Furniture':      [IFC_TYPES.IFCFURNISHINGELEMENT],
  'Pipes':          [IFC_TYPES.IFCFLOWSEGMENT, IFC_TYPES.IFCFLOWTERMINAL, IFC_TYPES.IFCFLOWFITTING],
  'Plates':         [IFC_TYPES.IFCPLATE],
  'Members':        [IFC_TYPES.IFCMEMBER],
  'Footings':       [IFC_TYPES.IFCFOOTING],
  'Coverings':      [IFC_TYPES.IFCCOVERING],
  'Spaces':         [IFC_TYPES.IFCSPACE],
  'Other':          [IFC_TYPES.IFCBUILDINGELEMENTPROXY, IFC_TYPES.IFCPROXY],
}

// ---------- Category Colors ----------

export const CATEGORY_COLORS: Record<string, string> = {
  'Walls':          '#a78bfa',
  'Curtain Walls':  '#c084fc',
  'Slabs':          '#60a5fa',
  'Columns':        '#f87171',
  'Beams':          '#fb923c',
  'Doors':          '#34d399',
  'Windows':        '#22d3ee',
  'Stairs':         '#fbbf24',
  'Roofs':          '#f472b6',
  'Railings':       '#a3e635',
  'Furniture':      '#c084fc',
  'Pipes':          '#2dd4bf',
  'Plates':         '#818cf8',
  'Members':        '#fb7185',
  'Footings':       '#d4d4d8',
  'Coverings':      '#a5b4fc',
  'Spaces':         '#6ee7b7',
  'Other':          '#94a3b8',
}

// ---------- Category Icons (MDI SVG paths) ----------
// Using @mdi/js icon paths

import {
  mdiWall,
  mdiDoorOpen,
  mdiWindowClosedVariant,
  mdiStairs,
  mdiPillar,
  mdiLayers,
  mdiHomeRoof,
  mdiFence,
  mdiSofaSingle,
  mdiPipe,
  mdiRectangleOutline,
  mdiMinus,
  mdiCubeOutline,
  mdiShapeOutline,
  mdiViewGrid,
  mdiArrowCollapseDown,
  mdiSquareOutline,
  mdiViewDashboardVariant,
} from '@mdi/js'

export const CATEGORY_ICONS: Record<string, string> = {
  'Walls':          mdiWall,
  'Curtain Walls':  mdiViewGrid,
  'Slabs':          mdiLayers,
  'Columns':        mdiPillar,
  'Beams':          mdiMinus,
  'Doors':          mdiDoorOpen,
  'Windows':        mdiWindowClosedVariant,
  'Stairs':         mdiStairs,
  'Roofs':          mdiHomeRoof,
  'Railings':       mdiFence,
  'Furniture':      mdiSofaSingle,
  'Pipes':          mdiPipe,
  'Plates':         mdiRectangleOutline,
  'Members':        mdiViewDashboardVariant,
  'Footings':       mdiArrowCollapseDown,
  'Coverings':      mdiSquareOutline,
  'Spaces':         mdiCubeOutline,
  'Other':          mdiShapeOutline,
}

// ---------- IFC Type Name Mapping ----------

export const IFC_TYPE_NAMES: Record<number, string> = {
  [IFC_TYPES.IFCWALL]: 'IfcWall',
  [IFC_TYPES.IFCWALLSTANDARDCASE]: 'IfcWallStandardCase',
  [IFC_TYPES.IFCSLAB]: 'IfcSlab',
  [IFC_TYPES.IFCCOLUMN]: 'IfcColumn',
  [IFC_TYPES.IFCBEAM]: 'IfcBeam',
  [IFC_TYPES.IFCDOOR]: 'IfcDoor',
  [IFC_TYPES.IFCWINDOW]: 'IfcWindow',
  [IFC_TYPES.IFCSTAIR]: 'IfcStair',
  [IFC_TYPES.IFCSTAIRFLIGHT]: 'IfcStairFlight',
  [IFC_TYPES.IFCROOF]: 'IfcRoof',
  [IFC_TYPES.IFCRAILING]: 'IfcRailing',
  [IFC_TYPES.IFCFURNISHINGELEMENT]: 'IfcFurnishingElement',
  [IFC_TYPES.IFCFLOWSEGMENT]: 'IfcFlowSegment',
  [IFC_TYPES.IFCFLOWTERMINAL]: 'IfcFlowTerminal',
  [IFC_TYPES.IFCFLOWFITTING]: 'IfcFlowFitting',
  [IFC_TYPES.IFCPLATE]: 'IfcPlate',
  [IFC_TYPES.IFCCURTAINWALL]: 'IfcCurtainWall',
  [IFC_TYPES.IFCMEMBER]: 'IfcMember',
  [IFC_TYPES.IFCFOOTING]: 'IfcFooting',
  [IFC_TYPES.IFCSPACE]: 'IfcSpace',
  [IFC_TYPES.IFCOPENINGELEMENT]: 'IfcOpeningElement',
  [IFC_TYPES.IFCBUILDINGELEMENTPROXY]: 'IfcBuildingElementProxy',
  [IFC_TYPES.IFCPROXY]: 'IfcProxy',
  [IFC_TYPES.IFCCOVERING]: 'IfcCovering',
}
