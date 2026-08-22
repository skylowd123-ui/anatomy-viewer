export const SYSTEMS = [
  'skeletal', 'muscular', 'circulatory', 'respiratory', 'digestive',
  'nervous', 'urinary', 'reproductive', 'lymphatic', 'endocrine'
] as const

export type SystemId = typeof SYSTEMS[number]

export interface Structure {
  id: string
  displayName: string
  system: SystemId
  filePath: string
  defaultColor: string
  defaultOpacity: number
}

export type LayerState = Record<SystemId, { visible: boolean; opacity: number }>
export type LoadState = { loaded: number; total: number; active: boolean }
