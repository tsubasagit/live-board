import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_EVENT_ID, isFirebaseConfigured } from '@/lib/firebase'
import { currentProgram, useEventStore } from '@/store/useEventStore'
import { normalizeEventType, type Program, type SchoolEvent } from '@/types'
import { track } from '@/lib/analytics'
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
  if (event && event.published !== true) {
    return (
      <DisplayStatus
        message={`${event.title || 'このイベント'}は現在準備中です。主催者が「公開」にすると表示されます。`}
        tone="info"
      />
    )
  }

  const template = normalizeEventType(event?.eventType ?? 'program_timeline')

  useEffect(() => {
    if (event?.published) track.displayView(template)
  }, [event?.published, template])

  if (template === 'calling_number') {
    return <CallingNumberDisplay event={event} cur={cur} programs={programs} />
  }
  if (template === 'queue_counter') {
    return <QueueCounterDisplay event={event} programs={programs} />
  }
  return (
    <ProgramTimelineDisplay
      event={event}
      cur={cur}
      programs={programs}
      currentProgramId={currentProgramId}
      showEventInfo={view.showEventInfo}
      showProgramList={view.showProgramList}
    />
  )
}

/* ============================================================
 * Pattern A: Program Timeline（現行・デフォルト）
 * ============================================================ */
function ProgramTimelineDisplay({
  event,
  cur,
  programs,
  currentProgramId,
  showEventInfo,
  showProgramList,
}: {
  event: SchoolEvent | null
  cur: Program | null
  programs: Program[]
  currentProgramId: string | null
  showEventInfo: boolean
  showProgramList: boolean
}) {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {showEventInfo && (
        <header className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xl md:text-3xl font-bold text-slate-800 truncate">
                {event?.title ?? 'live-board'}
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
          showProgramList ? 'lg:grid-cols-[1fr_24rem]' : ''
        }`}
      >
        <main className="flex items-center justify-center min-h-[50vh]">
          {cur ? (
            <div className="w-full text-center space-y-6 md:space-y-10 fade-in-up" key={cur.id}>
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

        {showProgramList && (
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

/* ============================================================
 * Pattern B: Calling Number（番号呼び出し型）
 * - プログラムの title を「呼び出し番号」、description を「部屋名」として扱う
 * - 次の3件を NEXT として並べる
 * ============================================================ */
function CallingNumberDisplay({
  event,
  cur,
  programs,
}: {
  event: SchoolEvent | null
  cur: Program | null
  programs: Program[]
}) {
  const called = useMemo(
    () => programs.filter((p) => p.status === 'done').slice(-6),
    [programs]
  )
  const upcoming = useMemo(
    () => programs.filter((p) => p.status === 'upcoming').slice(0, 6),
    [programs]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e2a47] to-[#1e40af] text-white flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between text-sm md:text-base">
        <div className="flex items-center gap-2 font-bold tracking-widest">
          <span className="w-2 h-2 bg-red-500 rounded-full pulse-slow"></span>
          LIVE
        </div>
        <div className="font-bold text-white/85 truncate max-w-[60%]">
          {event?.title ?? 'live-board'}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        {cur ? (
          <div className="space-y-3 md:space-y-6 fade-in-up" key={cur.id}>
            <div className="text-base md:text-2xl text-[#9bc4e2] font-bold tracking-widest">
              ただいまの番号
            </div>
            <div className="text-[18vw] md:text-[14rem] leading-none font-black tracking-tighter">
              {cur.title || '—'}
            </div>
            {cur.description && (
              <div className="text-2xl md:text-5xl font-bold text-[#9bc4e2]">
                {cur.description}
              </div>
            )}
          </div>
        ) : (
          <div className="text-3xl md:text-5xl font-bold pulse-slow text-white/80">
            まもなく呼び出しを開始します
          </div>
        )}
      </main>

      {/* 呼び出し済み・お待ちの番号 2セクション */}
      <section className="px-4 md:px-10 pb-8 md:pb-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-6xl w-full mx-auto">
        {/* 呼び出し済み */}
        <div className="bg-white/8 border border-white/15 rounded-2xl p-5 md:p-7 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="text-sm md:text-base text-white/70 font-bold tracking-widest">
              ✓ 呼び出し済み
            </div>
            <div className="text-xs text-white/40">CALLED</div>
          </div>
          {called.length === 0 ? (
            <div className="text-white/40 text-sm py-4">まだ呼び出し済みの番号はありません</div>
          ) : (
            <div className="flex flex-wrap gap-2 md:gap-3">
              {called.map((p) => (
                <span
                  key={p.id}
                  className="bg-white/10 border border-white/15 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xl md:text-3xl font-black tracking-tight text-white/50 line-through decoration-2"
                >
                  {p.title || '—'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* お待ちの番号 */}
        <div className="bg-white/15 border border-white/30 rounded-2xl p-5 md:p-7 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="text-sm md:text-base text-[#fde047] font-bold tracking-widest">
              ⏳ お待ちの番号
            </div>
            <div className="text-xs text-white/60">WAITING</div>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-white/50 text-sm py-4">お待ちの番号はありません</div>
          ) : (
            <div className="flex flex-wrap gap-2 md:gap-3">
              {upcoming.map((p) => (
                <span
                  key={p.id}
                  className="bg-white/20 border-2 border-white/30 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xl md:text-3xl font-black tracking-tight text-white"
                >
                  {p.title || '—'}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <AthFooter />
    </div>
  )
}

/* ============================================================
 * Pattern C: Queue Counter（順番待ちカウンター型）
 * - 未消化（upcoming）プログラム数を「あと N 組」として表示
 * - 1組あたり 5分 と仮定して待ち時間目安を算出
 * ============================================================ */
function QueueCounterDisplay({
  event,
  programs,
}: {
  event: SchoolEvent | null
  programs: Program[]
}) {
  const waitingCount = useMemo(
    () => programs.filter((p) => p.status === 'upcoming').length,
    [programs]
  )
  const waitMinutes = waitingCount * 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7c2d12] to-[#c2410c] text-white flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between text-sm md:text-base">
        <div className="flex items-center gap-2 font-bold tracking-widest">
          <span className="w-2 h-2 bg-red-300 rounded-full pulse-slow"></span>
          LIVE
        </div>
        <div className="font-bold text-white/90 tracking-widest text-xs md:text-sm">
          {event?.published ? 'OPEN' : 'CLOSED'}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center fade-in-up">
        {event?.title && (
          <div className="text-xl md:text-3xl font-bold text-white/90 tracking-wider mb-6 md:mb-10">
            {event.title}
          </div>
        )}

        <div className="flex items-baseline gap-3 md:gap-6">
          <span className="text-3xl md:text-6xl font-bold">あと</span>
          <span className="text-[28vw] md:text-[18rem] leading-none font-black tracking-tighter text-[#fed7aa]">
            {waitingCount}
          </span>
          <span className="text-3xl md:text-6xl font-bold">組</span>
        </div>

        <div className="mt-4 md:mt-8 text-xl md:text-3xl font-bold text-white/90">
          約 {waitMinutes} 分待ち
        </div>

        {event?.description && (
          <div className="mt-6 md:mt-10 text-base md:text-xl text-white/80 max-w-2xl">
            {event.description}
          </div>
        )}

        <div className="mt-12 md:mt-16 inline-flex items-center gap-3 px-5 md:px-7 py-3 md:py-4 bg-white/15 border border-white/25 rounded-2xl text-sm md:text-lg">
          <span>📱</span>
          <span className="font-bold">このページをブックマークすれば、順番が近づいたら何度でも確認できます</span>
        </div>
      </main>

      <AthFooter />
    </div>
  )
}

/* ============================================================ */

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
