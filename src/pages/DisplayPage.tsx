import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_EVENT_ID, isFirebaseConfigured } from '@/lib/firebase'
import { currentProgram, useEventStore } from '@/store/useEventStore'
import { AthFooter } from './ControlPage'

export default function DisplayPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event') ?? DEFAULT_EVENT_ID

  const { event, programs, current, view, error, setEventId, subscribe } = useEventStore()

  useEffect(() => {
    setEventId(eventId)
    subscribe()
  }, [eventId, setEventId, subscribe])

  const cur = useMemo(() => currentProgram(programs, current), [programs, current])
  const currentProgramId = current?.currentProgramId ?? null

  if (!isFirebaseConfigured) {
    return <DisplayStatus message="Firebase 未設定です（.env を確認）" tone="warn" />
  }
  if (error) {
    return <DisplayStatus message={error} tone="error" />
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {view.showEventInfo && (
        <header className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xl md:text-3xl font-bold text-slate-800 truncate">
                {event?.title ?? 'school-live-board'}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm md:text-base text-slate-500 mt-1">
                {event?.location && <span>📍 {event.location}</span>}
                {event?.description && <span className="truncate">{event.description}</span>}
              </div>
            </div>
            <div className="text-sm md:text-base text-slate-500 shrink-0">
              プログラム {cur ? `${cur.order} / ${programs.length}` : `- / ${programs.length}`}
            </div>
          </div>
        </header>
      )}

      <div
        className={`flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 gap-6 ${
          view.showProgramList ? 'lg:grid-cols-[1fr_24rem]' : ''
        }`}
      >
        <main className="flex items-center justify-center min-h-[50vh]">
          {cur ? (
            <div
              className="w-full text-center space-y-6 md:space-y-10 fade-in-up"
              key={cur.id}
            >
              <div className="inline-block bg-[#538bb0]/10 border border-[#538bb0] rounded-full px-4 py-1 text-[#538bb0] text-sm md:text-base font-semibold pulse-slow">
                ● 進行中 · プログラム {cur.order}
              </div>
              <h1 className="text-5xl md:text-8xl font-black leading-tight break-words text-slate-800">
                {cur.title}
              </h1>
              {cur.description && (
                <p className="text-xl md:text-3xl text-slate-600">{cur.description}</p>
              )}
              {cur.scheduledStart && (
                <div className="text-lg md:text-2xl text-slate-500 pt-4">
                  ⏰ {cur.scheduledStart}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-2xl md:text-4xl font-bold text-slate-600 pulse-slow">
                {event?.title ? `${event.title} — まもなく開始します` : 'まもなく開始します'}
              </div>
            </div>
          )}
        </main>

        {view.showProgramList && (
        <aside className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-5 space-y-3 self-start">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
            プログラム一覧
          </h2>
          {programs.length === 0 ? (
            <p className="text-sm text-slate-500">プログラム未登録</p>
          ) : (
            <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
              {programs.map((p) => {
                const isCurrent = p.id === currentProgramId
                const isDone = p.status === 'done'
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded ${
                      isCurrent
                        ? 'bg-[#538bb0]/10 border-2 border-[#538bb0]'
                        : isDone
                        ? 'bg-slate-100 border border-slate-200 text-slate-400'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <span
                      className={`text-sm w-8 text-right shrink-0 ${
                        isCurrent ? 'text-[#538bb0] font-bold' : 'text-slate-400'
                      }`}
                    >
                      {p.order}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`truncate ${
                          isCurrent
                            ? 'font-bold text-slate-800'
                            : isDone
                            ? 'line-through'
                            : 'text-slate-700'
                        }`}
                      >
                        {p.title}
                      </div>
                      {p.scheduledStart && (
                        <div className="text-xs text-slate-500 truncate">⏰ {p.scheduledStart}</div>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-[#538bb0] text-white px-2 py-0.5 rounded shrink-0">
                        進行中
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
        )}
      </div>

      <AthFooter />
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
    info: 'bg-white',
    warn: 'bg-amber-50',
    error: 'bg-red-50',
  }[tone]
  const text = {
    info: 'text-slate-700',
    warn: 'text-amber-800',
    error: 'text-red-700',
  }[tone]
  return (
    <div className={`min-h-screen flex flex-col ${bg}`}>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className={`text-2xl md:text-4xl font-bold pulse-slow ${text}`}>{message}</div>
        </div>
      </div>
      <AthFooter />
    </div>
  )
}
