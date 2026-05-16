import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_EVENT_ID, isFirebaseConfigured } from '@/lib/firebase'
import { currentProgram, nextProgram, useEventStore } from '@/store/useEventStore'

export default function DisplayPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event') ?? DEFAULT_EVENT_ID

  const { event, programs, current, error, setEventId, subscribe } = useEventStore()

  useEffect(() => {
    setEventId(eventId)
    subscribe()
  }, [eventId, setEventId, subscribe])

  const cur = useMemo(() => currentProgram(programs, current), [programs, current])
  const next = useMemo(() => nextProgram(programs, current), [programs, current])

  if (!isFirebaseConfigured) {
    return (
      <DisplayStatus message="Firebase 未設定です（.env.local を確認）" tone="warn" />
    )
  }
  if (error) {
    return <DisplayStatus message={error} tone="error" />
  }
  if (!cur) {
    return (
      <DisplayStatus
        message={event?.title ? `${event.title} — まもなく開始します` : 'まもなく開始します'}
        tone="info"
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="text-sm md:text-base text-slate-400 truncate">
          {event?.title ?? 'school-live-board'}
        </div>
        <div className="text-sm text-slate-500">
          プログラム {cur.order} / {programs.length}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-5xl text-center space-y-6 md:space-y-10 fade-in-up" key={cur.id}>
          <div className="inline-block bg-accent/20 border border-accent/40 rounded-full px-4 py-1 text-accent text-sm md:text-base pulse-slow">
            ● 進行中 · プログラム {cur.order}
          </div>
          <h1 className="text-5xl md:text-8xl font-black leading-tight break-words">
            {cur.title}
          </h1>
          {cur.description && (
            <p className="text-xl md:text-3xl text-slate-300">{cur.description}</p>
          )}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-lg md:text-2xl text-slate-400 pt-4">
            {cur.location && <span>📍 {cur.location}</span>}
            {cur.scheduledStart && <span>⏰ {cur.scheduledStart}</span>}
          </div>
        </div>
      </main>

      {next && (
        <footer className="px-6 py-4 md:py-6 border-t border-slate-800 bg-slate-950/60">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="text-xs md:text-sm text-slate-500">次のプログラム</div>
            <div className="text-base md:text-2xl font-bold text-slate-200 truncate">
              {next.order}. {next.title}
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

function DisplayStatus({
  message,
  tone,
}: {
  message: string
  tone: 'info' | 'warn' | 'error'
}) {
  const bg = {
    info: 'bg-slate-900',
    warn: 'bg-amber-900/40',
    error: 'bg-red-900/40',
  }[tone]
  return (
    <div className={`min-h-screen flex items-center justify-center p-8 text-white ${bg}`}>
      <div className="text-center space-y-3">
        <div className="text-2xl md:text-4xl font-bold pulse-slow">{message}</div>
      </div>
    </div>
  )
}
