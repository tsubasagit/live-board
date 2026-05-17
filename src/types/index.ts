export type EventType = 'sports_day' | 'culture_festival' | 'generic'

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
