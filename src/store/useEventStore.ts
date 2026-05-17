import { create } from 'zustand'
import type { CurrentState, Program, SchoolEvent, ViewSettings } from '@/types'
import {
  subscribeCurrent,
  subscribeEvent,
  subscribePrograms,
  subscribeViewSettings,
} from '@/lib/sync'
import { isFirebaseConfigured } from '@/lib/firebase'

const DEFAULT_VIEW: ViewSettings = { showEventInfo: true, showProgramList: true }

interface EventStoreState {
  eventId: string | null
  event: SchoolEvent | null
  programs: Program[]
  current: CurrentState | null
  view: ViewSettings
  isSubscribed: boolean
  error: string | null
  setEventId: (eventId: string) => void
  subscribe: () => void
  unsubscribe: () => void
}

let unsubFns: Array<() => void> = []

export const useEventStore = create<EventStoreState>((set, get) => ({
  eventId: null,
  event: null,
  programs: [],
  current: null,
  view: DEFAULT_VIEW,
  isSubscribed: false,
  error: null,

  setEventId: (eventId) => {
    if (get().eventId !== eventId) {
      get().unsubscribe()
      set({ eventId, event: null, programs: [], current: null, view: DEFAULT_VIEW })
    }
  },

  subscribe: () => {
    const { eventId, isSubscribed } = get()
    if (!eventId || isSubscribed) return
    if (!isFirebaseConfigured) {
      set({ error: 'Firebase 設定が未読み込みです（.env を確認してください）' })
      return
    }
    try {
      unsubFns.push(subscribeEvent(eventId, (event) => set({ event })))
      unsubFns.push(subscribePrograms(eventId, (programs) => set({ programs })))
      unsubFns.push(subscribeCurrent(eventId, (current) => set({ current })))
      unsubFns.push(
        subscribeViewSettings(eventId, (view) => set({ view: view ?? DEFAULT_VIEW }))
      )
      set({ isSubscribed: true, error: null })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      set({ error: message })
    }
  },

  unsubscribe: () => {
    unsubFns.forEach((fn) => fn())
    unsubFns = []
    set({ isSubscribed: false })
  },
}))

export function currentProgram(programs: Program[], current: CurrentState | null) {
  if (!current?.currentProgramId) return null
  return programs.find((p) => p.id === current.currentProgramId) ?? null
}

export function nextProgram(programs: Program[], current: CurrentState | null) {
  if (!current?.currentProgramId) {
    return programs[0] ?? null
  }
  const idx = programs.findIndex((p) => p.id === current.currentProgramId)
  if (idx < 0 || idx >= programs.length - 1) return null
  return programs[idx + 1] ?? null
}

export function previousProgram(programs: Program[], current: CurrentState | null) {
  if (!current?.currentProgramId) return null
  const idx = programs.findIndex((p) => p.id === current.currentProgramId)
  if (idx <= 0) return null
  return programs[idx - 1] ?? null
}
