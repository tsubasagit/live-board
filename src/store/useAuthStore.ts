import { create } from 'zustand'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'
import { track } from '@/lib/analytics'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  init: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

let initialized = false

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  init: () => {
    if (initialized || !isFirebaseConfigured) {
      if (!isFirebaseConfigured) set({ loading: false })
      return
    }
    initialized = true
    onAuthStateChanged(getFirebaseAuth(), (user) => {
      set({ user, loading: false })
    })
  },

  signIn: async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(getFirebaseAuth(), provider)
      set({ error: null })
      track.signIn()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      set({ error: msg })
    }
  },

  signOut: async () => {
    await fbSignOut(getFirebaseAuth())
    track.signOut()
  },
}))
