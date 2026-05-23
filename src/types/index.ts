export type EventType =
  // デザインテンプレート（現行・新規イベントはこれを使用）
  | 'program_timeline' // プログラム進行型（運動会・式典・セミナー）
  | 'calling_number'   // 番号呼び出し型（クリニック・薬局・自治体）
  | 'queue_counter'    // 順番待ちカウンター型（飲食店・サロン）
  // 旧 値（後方互換のため残置・保存済イベントを表示する際に使用）
  | 'sports_day'
  | 'culture_festival'
  | 'generic'

/** 旧 EventType 値を新しいテンプレート値に正規化する */
export function normalizeEventType(t: EventType): 'program_timeline' | 'calling_number' | 'queue_counter' {
  switch (t) {
    case 'sports_day':
    case 'culture_festival':
    case 'generic':
      return 'program_timeline'
    default:
      return t
  }
}

export type ProgramStatus = 'upcoming' | 'current' | 'done'

export interface SchoolEvent {
  id: string
  title: string
  description?: string
  location?: string
  eventType: EventType
  startDate: string
  createdAt: string
  ownerId?: string
  published?: boolean
  pinHash?: string
}

export interface Program {
  id: string
  order: number
  title: string
  description: string
  scheduledStart: string
  scheduledEnd: string
  status: ProgramStatus
}

export interface CurrentState {
  currentProgramId: string | null
  updatedAt: string
  updatedBy?: string
}

export interface ViewSettings {
  showEventInfo: boolean
  showProgramList: boolean
}
