import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { DEFAULT_EVENT_ID, isFirebaseConfigured } from '@/lib/firebase'
import {
  currentProgram,
  nextProgram,
  previousProgram,
  useEventStore,
} from '@/store/useEventStore'
import {
  deleteProgram,
  saveEvent,
  saveProgram,
  setCurrentProgram,
  updateProgramStatus,
} from '@/lib/sync'
import type { EventType, Program } from '@/types'

export default function ControlPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event') ?? DEFAULT_EVENT_ID

  const { event, programs, current, error, setEventId, subscribe } = useEventStore()

  useEffect(() => {
    setEventId(eventId)
    subscribe()
  }, [eventId, setEventId, subscribe])

  const cur = useMemo(() => currentProgram(programs, current), [programs, current])
  const next = useMemo(() => nextProgram(programs, current), [programs, current])
  const prev = useMemo(() => previousProgram(programs, current), [programs, current])

  const handleAdvance = async (direction: 'next' | 'prev') => {
    const target = direction === 'next' ? next : prev
    if (!target) return
    if (cur) {
      await updateProgramStatus(eventId, cur.id, 'done')
    }
    await updateProgramStatus(eventId, target.id, 'current')
    await setCurrentProgram(eventId, target.id)
  }

  const handleJump = async (programId: string) => {
    if (cur && cur.id !== programId) {
      await updateProgramStatus(eventId, cur.id, 'done')
    }
    await updateProgramStatus(eventId, programId, 'current')
    await setCurrentProgram(eventId, programId)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white text-sm">
            ← ホーム
          </Link>
          <h1 className="text-lg font-bold">🎛 操作画面</h1>
          <span className="text-xs text-slate-500">
            event: <code>{eventId}</code>
          </span>
        </div>
        <Link
          to={`/display?event=${eventId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-accent hover:bg-accent/80 px-3 py-1.5 rounded"
        >
          表示画面を開く ↗
        </Link>
      </header>

      {!isFirebaseConfigured && (
        <div className="bg-amber-900/40 border-b border-amber-700 px-4 py-2 text-sm text-amber-100">
          ⚠️ Firebase 未設定。<code>.env.local</code> に VITE_FIREBASE_* を設定してください。
        </div>
      )}
      {error && (
        <div className="bg-red-900/40 border-b border-red-700 px-4 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <EventSettings eventId={eventId} eventTitle={event?.title ?? ''} eventType={event?.eventType ?? 'sports_day'} />

        <section className="bg-slate-800 rounded-lg p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold">進行コントロール</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900 rounded p-3">
              <div className="text-xs text-slate-500 mb-1">前のプログラム</div>
              <div className="text-sm text-slate-300 truncate">
                {prev ? `${prev.order}. ${prev.title}` : '—'}
              </div>
            </div>
            <div className="bg-accent/20 border-2 border-accent rounded p-3">
              <div className="text-xs text-accent mb-1">現在進行中</div>
              <div className="text-base font-bold truncate">
                {cur ? `${cur.order}. ${cur.title}` : '（未選択）'}
              </div>
            </div>
            <div className="bg-slate-900 rounded p-3">
              <div className="text-xs text-slate-500 mb-1">次のプログラム</div>
              <div className="text-sm text-slate-300 truncate">
                {next ? `${next.order}. ${next.title}` : '—'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleAdvance('prev')}
              disabled={!prev}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded font-bold"
            >
              <ChevronLeft size={20} />
              前へ
            </button>
            <button
              onClick={() => handleAdvance('next')}
              disabled={!next}
              className="flex items-center gap-2 bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2 rounded font-bold"
            >
              次へ
              <ChevronRight size={20} />
            </button>
          </div>
        </section>

        <ProgramsList
          eventId={eventId}
          programs={programs}
          currentProgramId={current?.currentProgramId ?? null}
          onJump={handleJump}
        />

        <AddProgramForm eventId={eventId} nextOrder={programs.length + 1} />
      </div>
    </div>
  )
}

function EventSettings({
  eventId,
  eventTitle,
  eventType,
}: {
  eventId: string
  eventTitle: string
  eventType: EventType
}) {
  const [title, setTitle] = useState(eventTitle)
  const [type, setType] = useState<EventType>(eventType)

  useEffect(() => setTitle(eventTitle), [eventTitle])
  useEffect(() => setType(eventType), [eventType])

  const handleSave = async () => {
    await saveEvent({
      id: eventId,
      title: title || '無題のイベント',
      eventType: type,
      startDate: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <section className="bg-slate-800 rounded-lg p-4 md:p-6 space-y-3">
      <h2 className="text-lg font-semibold">イベント設定</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="md:col-span-2 space-y-1">
          <div className="text-xs text-slate-400">タイトル</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: ○○小学校 運動会 2026"
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <div className="text-xs text-slate-400">種別</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
          >
            <option value="sports_day">運動会</option>
            <option value="culture_festival">文化祭</option>
            <option value="generic">汎用</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-accent hover:bg-accent/80 px-4 py-1.5 rounded text-sm font-bold"
        >
          保存
        </button>
      </div>
    </section>
  )
}

function ProgramsList({
  eventId,
  programs,
  currentProgramId,
  onJump,
}: {
  eventId: string
  programs: Program[]
  currentProgramId: string | null
  onJump: (id: string) => void
}) {
  return (
    <section className="bg-slate-800 rounded-lg p-4 md:p-6 space-y-3">
      <h2 className="text-lg font-semibold">プログラム一覧</h2>
      {programs.length === 0 && (
        <p className="text-sm text-slate-400">まだプログラムがありません。下のフォームから追加してください。</p>
      )}
      <ul className="space-y-2">
        {programs.map((p) => {
          const isCurrent = p.id === currentProgramId
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2 rounded ${
                isCurrent ? 'bg-accent/20 border border-accent' : 'bg-slate-900'
              }`}
            >
              <span className="text-slate-500 text-sm w-8 text-right">{p.order}.</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{p.title}</div>
                <div className="text-xs text-slate-400 truncate">
                  {p.location && <>📍 {p.location}</>}
                  {p.scheduledStart && <> · ⏰ {p.scheduledStart}</>}
                </div>
              </div>
              <button
                onClick={() => onJump(p.id)}
                disabled={isCurrent}
                className="text-xs bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded"
              >
                {isCurrent ? '進行中' : 'ここに移動'}
              </button>
              <button
                onClick={() => {
                  if (confirm(`「${p.title}」を削除しますか？`)) {
                    deleteProgram(eventId, p.id)
                  }
                }}
                className="text-slate-400 hover:text-red-400 p-1"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function AddProgramForm({ eventId, nextOrder }: { eventId: string; nextOrder: number }) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [scheduledStart, setScheduledStart] = useState('')
  const [description, setDescription] = useState('')

  const handleAdd = async () => {
    if (!title.trim()) return
    const id = crypto.randomUUID()
    await saveProgram(eventId, {
      id,
      order: nextOrder,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      scheduledStart,
      scheduledEnd: '',
      status: 'upcoming',
    })
    setTitle('')
    setLocation('')
    setScheduledStart('')
    setDescription('')
  }

  return (
    <section className="bg-slate-800 rounded-lg p-4 md:p-6 space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Plus size={18} />
        プログラム追加
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル（例: 100m走 5年生男子）"
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm md:col-span-2"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="場所（例: 校庭・体育館）"
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
        />
        <input
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
          placeholder="予定時刻（例: 10:30）"
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="補足説明（任意）"
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm md:col-span-2"
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          disabled={!title.trim()}
          className="bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm font-bold"
        >
          追加
        </button>
      </div>
    </section>
  )
}
