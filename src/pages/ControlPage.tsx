import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Eye, EyeOff, Plus, Trash2, Upload } from 'lucide-react'
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
  saveProgramsBulk,
  saveViewSettings,
  setCurrentProgram,
  updateProgramStatus,
} from '@/lib/sync'
import type { EventType, Program, ViewSettings } from '@/types'

export default function ControlPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event') ?? DEFAULT_EVENT_ID

  const { event, programs, current, view, error, setEventId, subscribe } = useEventStore()

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
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-500 hover:text-[#538bb0] text-sm">
            ← ホーム
          </Link>
          <h1 className="text-lg font-bold text-slate-800">🎛 操作画面</h1>
          <span className="text-xs text-slate-400">
            event: <code>{eventId}</code>
          </span>
        </div>
        <Link
          to={`/display?event=${eventId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-[#538bb0] hover:bg-[#3d6f94] text-white px-3 py-1.5 rounded"
        >
          表示画面を開く ↗
        </Link>
      </header>

      {!isFirebaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-sm text-amber-800">
          ⚠️ Firebase 未設定。<code>.env</code> に VITE_FIREBASE_* を設定してください。
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-b border-red-300 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        <DisplayViewPanel eventId={eventId} view={view} />

        <EventSettings
          eventId={eventId}
          eventTitle={event?.title ?? ''}
          eventDescription={event?.description ?? ''}
          eventLocation={event?.location ?? ''}
          eventType={event?.eventType ?? 'sports_day'}
        />

        <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">進行コントロール</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500 mb-1">前のプログラム</div>
              <div className="text-sm text-slate-600 truncate">
                {prev ? `${prev.order}. ${prev.title}` : '—'}
              </div>
            </div>
            <div className="bg-[#538bb0]/10 border-2 border-[#538bb0] rounded p-3">
              <div className="text-xs text-[#538bb0] mb-1 font-semibold">現在進行中</div>
              <div className="text-base font-bold truncate text-slate-800">
                {cur ? `${cur.order}. ${cur.title}` : '（未選択）'}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500 mb-1">次のプログラム</div>
              <div className="text-sm text-slate-600 truncate">
                {next ? `${next.order}. ${next.title}` : '—'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleAdvance('prev')}
              disabled={!prev}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded font-bold"
            >
              <ChevronLeft size={20} />
              前へ
            </button>
            <button
              onClick={() => handleAdvance('next')}
              disabled={!next}
              className="flex items-center gap-2 bg-[#538bb0] hover:bg-[#3d6f94] text-white disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2 rounded font-bold"
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

      <AthFooter />
    </div>
  )
}

function DisplayViewPanel({ eventId, view }: { eventId: string; view: ViewSettings }) {
  const toggle = async (key: keyof ViewSettings) => {
    await saveViewSettings(eventId, { ...view, [key]: !view[key] })
  }
  return (
    <section className="bg-[#538bb0]/5 border-2 border-[#538bb0] rounded-lg p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold text-slate-800 flex items-center gap-2">
          📺 表示画面のレイアウト
        </h2>
        <span className="text-xs text-slate-500">全端末リアルタイム反映</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ViewToggleButton
          label="イベント情報（タイトル・場所・概要）"
          on={view.showEventInfo}
          onClick={() => toggle('showEventInfo')}
        />
        <ViewToggleButton
          label="プログラム一覧（サイドバー）"
          on={view.showProgramList}
          onClick={() => toggle('showProgramList')}
        />
      </div>
    </section>
  )
}

function ViewToggleButton({
  label,
  on,
  onClick,
}: {
  label: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded border-2 transition-colors ${
        on
          ? 'bg-[#538bb0] text-white border-[#538bb0]'
          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="text-sm font-medium text-left flex-1">{label}</span>
      <span className="flex items-center gap-1 text-xs font-bold shrink-0">
        {on ? <Eye size={16} /> : <EyeOff size={16} />}
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}

function EventSettings({
  eventId,
  eventTitle,
  eventDescription,
  eventLocation,
  eventType,
}: {
  eventId: string
  eventTitle: string
  eventDescription: string
  eventLocation: string
  eventType: EventType
}) {
  const [title, setTitle] = useState(eventTitle)
  const [description, setDescription] = useState(eventDescription)
  const [location, setLocation] = useState(eventLocation)
  const [type, setType] = useState<EventType>(eventType)

  useEffect(() => setTitle(eventTitle), [eventTitle])
  useEffect(() => setDescription(eventDescription), [eventDescription])
  useEffect(() => setLocation(eventLocation), [eventLocation])
  useEffect(() => setType(eventType), [eventType])

  const handleSave = async () => {
    await saveEvent({
      id: eventId,
      title: title || '無題のイベント',
      description,
      location,
      eventType: type,
      startDate: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">イベント設定</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="md:col-span-2 space-y-1">
          <div className="text-xs text-slate-500">タイトル</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: ○○小学校 運動会 2026"
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <label className="space-y-1">
          <div className="text-xs text-slate-500">種別</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800"
          >
            <option value="sports_day">運動会</option>
            <option value="culture_festival">文化祭</option>
            <option value="generic">汎用</option>
          </select>
        </label>
        <label className="md:col-span-3 space-y-1">
          <div className="text-xs text-slate-500">場所</div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: ○○小学校 校庭"
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <label className="md:col-span-3 space-y-1">
          <div className="text-xs text-slate-500">概要</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例: 全校児童による春の大運動会。雨天時は体育館で実施。"
            rows={2}
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm resize-y text-slate-800"
          />
        </label>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-[#538bb0] hover:bg-[#3d6f94] text-white px-4 py-1.5 rounded text-sm font-bold"
        >
          保存
        </button>
      </div>
    </section>
  )
}

export function AthFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <div>
          Powered by{' '}
          <a
            href="https://apptalenthub.co.jp?utm_source=school-live"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#538bb0] hover:underline font-semibold"
          >
            AppTalentHub
          </a>
        </div>
        <a
          href="https://forms.apptalenthub.co.jp/contact?utm_source=school-live"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#538bb0] hover:underline"
        >
          お問い合わせ →
        </a>
      </div>
    </footer>
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
    <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">プログラム一覧</h2>
      {programs.length === 0 && (
        <p className="text-sm text-slate-500">まだプログラムがありません。下のフォームから追加してください。</p>
      )}
      <ul className="space-y-2">
        {programs.map((p) => {
          const isCurrent = p.id === currentProgramId
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2 rounded ${
                isCurrent
                  ? 'bg-[#538bb0]/10 border-2 border-[#538bb0]'
                  : 'bg-white border border-slate-200'
              }`}
            >
              <span className="text-slate-400 text-sm w-8 text-right">{p.order}.</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-slate-800">{p.title}</div>
                {p.scheduledStart && (
                  <div className="text-xs text-slate-500 truncate">⏰ {p.scheduledStart}</div>
                )}
              </div>
              <button
                onClick={() => onJump(p.id)}
                disabled={isCurrent}
                className="text-xs bg-[#538bb0] hover:bg-[#3d6f94] text-white disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded"
              >
                {isCurrent ? '進行中' : 'ここに移動'}
              </button>
              <button
                onClick={() => {
                  if (confirm(`「${p.title}」を削除しますか？`)) {
                    deleteProgram(eventId, p.id)
                  }
                }}
                className="text-slate-400 hover:text-red-500 p-1"
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
  const [mode, setMode] = useState<'single' | 'csv'>('single')
  const [title, setTitle] = useState('')
  const [scheduledStart, setScheduledStart] = useState('')
  const [description, setDescription] = useState('')
  const [csv, setCsv] = useState('')
  const [csvStatus, setCsvStatus] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!title.trim()) return
    const id = crypto.randomUUID()
    await saveProgram(eventId, {
      id,
      order: nextOrder,
      title: title.trim(),
      description: description.trim(),
      scheduledStart,
      scheduledEnd: '',
      status: 'upcoming',
    })
    setTitle('')
    setScheduledStart('')
    setDescription('')
  }

  const handleCsvImport = async () => {
    const parsed = parseCsv(csv)
    if (parsed.length === 0) {
      setCsvStatus('有効な行がありません')
      return
    }
    const programs: Program[] = parsed.map((row, i) => ({
      id: crypto.randomUUID(),
      order: nextOrder + i,
      title: row.title,
      description: row.description,
      scheduledStart: row.scheduledStart,
      scheduledEnd: '',
      status: 'upcoming',
    }))
    setCsvStatus(`登録中… (${programs.length}件)`)
    try {
      await saveProgramsBulk(eventId, programs)
      setCsvStatus(`${programs.length}件 追加しました`)
      setCsv('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setCsvStatus(`エラー: ${msg}`)
    }
  }

  return (
    <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
          <Plus size={18} />
          プログラム追加
        </h2>
        <div className="flex bg-white border border-slate-300 rounded overflow-hidden text-sm">
          <button
            onClick={() => setMode('single')}
            className={`px-3 py-1 ${
              mode === 'single' ? 'bg-[#538bb0] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            1件ずつ
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`px-3 py-1 flex items-center gap-1 ${
              mode === 'csv' ? 'bg-[#538bb0] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Upload size={14} />
            CSV一括
          </button>
        </div>
      </div>

      {mode === 'single' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル（例: 100m走 5年生男子）"
              className="bg-white border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2 text-slate-800"
            />
            <input
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              placeholder="予定時刻（例: 10:30）"
              className="bg-white border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2 text-slate-800"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="補足説明（任意）"
              className="bg-white border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2 text-slate-800"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!title.trim()}
              className="bg-[#538bb0] hover:bg-[#3d6f94] text-white disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm font-bold"
            >
              追加
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-xs text-slate-600 space-y-2 bg-white border border-slate-200 rounded p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">CSV形式</div>
              <button
                onClick={downloadSampleCsv}
                className="flex items-center gap-1 text-xs text-[#538bb0] hover:underline"
              >
                <Download size={14} />
                サンプルCSVをダウンロード
              </button>
            </div>
            <div>
              <code>タイトル,予定時刻,補足</code>（1行目はヘッダー、2行目以降がデータ）
            </div>
            <div>※ 予定時刻・補足は省略可。区切りはカンマ or タブ。Excel等で開く場合はUTF-8 BOM付き。</div>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={`タイトル,予定時刻,補足\n開会式,9:00,全校児童整列\n100m走 5年生男子,9:30,\n綱引き 1-3年,10:00,赤白対抗`}
            rows={8}
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono text-slate-800"
          />
          {csvStatus && (
            <div className="text-xs text-slate-600">{csvStatus}</div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleCsvImport}
              disabled={!csv.trim()}
              className="bg-[#538bb0] hover:bg-[#3d6f94] text-white disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1"
            >
              <Upload size={14} />
              一括登録
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function downloadSampleCsv() {
  const rows = [
    'タイトル,予定時刻,補足',
    '開会式,9:00,全校児童整列',
    'ラジオ体操,9:15,',
    '100m走 5年生男子,9:30,',
    '綱引き 1-3年,10:00,赤白対抗',
    '玉入れ 低学年,10:30,',
    '休憩,11:00,',
    '応援合戦,11:15,赤白それぞれ5分',
    '昼食,12:00,',
    '騎馬戦 6年生,13:00,',
    '閉会式,14:30,結果発表・表彰',
  ]
  const bom = '﻿'
  const blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'school-live-board-sample.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function parseCsv(input: string): Array<{ title: string; scheduledStart: string; description: string }> {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length === 0) return []
  const splitLine = (line: string): string[] => {
    const sep = line.includes('\t') ? '\t' : ','
    return line.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, '$1'))
  }
  const first = splitLine(lines[0] ?? '')
  const hasHeader = /タイトル|title/i.test(first[0] ?? '')
  const dataLines = hasHeader ? lines.slice(1) : lines
  return dataLines
    .map((line) => {
      const cols = splitLine(line)
      const title = cols[0] ?? ''
      if (!title) return null
      return {
        title,
        scheduledStart: cols[1] ?? '',
        description: cols[2] ?? '',
      }
    })
    .filter((r): r is { title: string; scheduledStart: string; description: string } => r !== null)
}
