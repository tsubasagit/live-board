import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from './firebase'
import type { CurrentState, Program, SchoolEvent, ViewSettings } from '@/types'

export function eventDocRef(eventId: string) {
  return doc(getDb(), 'events', eventId)
}

export function programsCollectionRef(eventId: string) {
  return collection(getDb(), 'events', eventId, 'programs')
}

export function currentStateDocRef(eventId: string) {
  return doc(getDb(), 'events', eventId, 'state', 'current')
}

export function viewSettingsDocRef(eventId: string) {
  return doc(getDb(), 'events', eventId, 'state', 'view')
}

export function subscribeEvent(
  eventId: string,
  onChange: (event: SchoolEvent | null) => void
): Unsubscribe {
  return onSnapshot(eventDocRef(eventId), (snap) => {
    if (!snap.exists()) {
      onChange(null)
      return
    }
    onChange({ id: snap.id, ...(snap.data() as Omit<SchoolEvent, 'id'>) })
  })
}

export function subscribePrograms(
  eventId: string,
  onChange: (programs: Program[]) => void
): Unsubscribe {
  const q = query(programsCollectionRef(eventId), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    const programs = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Program, 'id'>),
    }))
    onChange(programs)
  })
}

export function subscribeCurrent(
  eventId: string,
  onChange: (current: CurrentState | null) => void
): Unsubscribe {
  return onSnapshot(currentStateDocRef(eventId), (snap) => {
    if (!snap.exists()) {
      onChange(null)
      return
    }
    onChange(snap.data() as CurrentState)
  })
}

export async function saveEvent(event: Omit<SchoolEvent, 'createdAt'> & { createdAt?: string }) {
  await setDoc(
    eventDocRef(event.id),
    {
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      eventType: event.eventType,
      startDate: event.startDate,
      ...(event.createdAt ? { createdAt: event.createdAt } : {}),
      ...(event.ownerId ? { ownerId: event.ownerId } : {}),
      ...(typeof event.published === 'boolean' ? { published: event.published } : {}),
      ...(event.pinHash ? { pinHash: event.pinHash } : {}),
    },
    { merge: true }
  )
}

export async function setEventPublished(eventId: string, published: boolean) {
  await updateDoc(eventDocRef(eventId), { published })
}

export async function ensureEventExists(eventId: string, ownerId: string) {
  const ref = eventDocRef(eventId)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    ownerId,
    createdAt: new Date().toISOString(),
    title: '',
    eventType: 'sports_day',
    startDate: new Date().toISOString().slice(0, 10),
    published: false,
  })
}

export async function saveProgram(eventId: string, program: Program) {
  const { id, ...rest } = program
  await setDoc(doc(programsCollectionRef(eventId), id), rest, { merge: true })
}

export async function deleteProgram(eventId: string, programId: string) {
  await deleteDoc(doc(programsCollectionRef(eventId), programId))
}

export async function setCurrentProgram(
  eventId: string,
  programId: string | null,
  updatedBy?: string
) {
  await setDoc(
    currentStateDocRef(eventId),
    {
      currentProgramId: programId,
      updatedAt: new Date().toISOString(),
      ...(updatedBy ? { updatedBy } : {}),
      _serverTime: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function updateProgramStatus(
  eventId: string,
  programId: string,
  status: Program['status']
) {
  await updateDoc(doc(programsCollectionRef(eventId), programId), { status })
}

export function subscribeViewSettings(
  eventId: string,
  onChange: (view: ViewSettings | null) => void
): Unsubscribe {
  return onSnapshot(viewSettingsDocRef(eventId), (snap) => {
    if (!snap.exists()) {
      onChange(null)
      return
    }
    onChange(snap.data() as ViewSettings)
  })
}

export async function saveViewSettings(eventId: string, view: ViewSettings) {
  await setDoc(viewSettingsDocRef(eventId), view, { merge: true })
}

export async function saveProgramsBulk(eventId: string, programs: Program[]) {
  await Promise.all(programs.map((p) => saveProgram(eventId, p)))
}

export async function deleteEventCompletely(eventId: string) {
  const db = getDb()
  const programsSnap = await getDocs(programsCollectionRef(eventId))
  await Promise.all(programsSnap.docs.map((d) => deleteDoc(d.ref)))
  const stateSnap = await getDocs(collection(db, 'events', eventId, 'state'))
  await Promise.all(stateSnap.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(eventDocRef(eventId))
}
