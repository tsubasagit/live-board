import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, Download, Eye, EyeOff, LogOut, Plus, Trash2, Upload } from 'lucide-react'
import QRCode from 'qrcode'
import { isFirebaseConfigured, uidToEventId } from '@/lib/firebase'
import {
  currentProgram,
  nextProgram,
  previousProgram,
  useEventStore,
} from '@/store/useEventStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  deleteEventCompletely,
  deleteProgram,
  ensureEventExists,
  saveEvent,
  saveProgram,
  saveProgramsBulk,
  saveViewSettings,
  setCurrentProgram,
  setEventPublished,
  updateProgramStatus,
} from '@/lib/sync'
import { normalizeEventType, type EventType, type Program, type SchoolEvent, type ViewSettings } from '@/types'
import { track } from '@/lib/analytics'

export default function ControlPage() {
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, error: authError, signIn, signOut } = useAuthStore()

  const eventId = searchParams.get('event') ?? (user ? uidToEventId(user.uid) : '')

  const { event, programs, current, view, error, setEventId, subscribe } = useEventStore()

  useEffect(() => {
    if (!user || !eventId) return
    ensureEventExists(eventId, user.uid).catch(() => {})
  }, [user, eventId])

  useEffect(() => {
    if (!eventId) return
    setEventId(eventId)
    subscribe()
  }, [eventId, setEventId, subscribe])

  const cur = useMemo(() => currentProgram(programs, current), [programs, current])
  const next = useMemo(() => nextProgram(programs, current), [programs, current])
  const prev = useMemo(() => previousProgram(programs, current), [programs, current])

  // サンプル投入ボタンの状態（必ず早期return の前に宣言する）
  const [seedState, setSeedState] = useState<'idle' | 'loading' | 'done'>('idle')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-500">
        読み込み中…
      </div>
    )
  }

  if (!user) {
    return <LoginGate signIn={signIn} error={authError} />
  }

  const isOwner = !event?.ownerId || event.ownerId === user.uid

  const handleAdvance = async (direction: 'next' | 'prev') => {
    const target = direction === 'next' ? next : prev
    if (!target) return
    if (cur) {
      await updateProgramStatus(eventId, cur.id, 'done')
    }
    await updateProgramStatus(eventId, target.id, 'current')
    await setCurrentProgram(eventId, target.id)
    track.programAdvance(direction)
  }

  const handleJump = async (programId: string) => {
    if (cur && cur.id !== programId) {
      await updateProgramStatus(eventId, cur.id, 'done')
    }
    await updateProgramStatus(eventId, programId, 'current')
    await setCurrentProgram(eventId, programId)
    track.programJump()
  }

  const handleLoadSample = async (
    template: 'program_timeline' | 'calling_number'
  ) => {
    const ok = window.confirm(
      template === 'program_timeline'
        ? '「プログラム進行型」のサンプル（運動会・6プログラム）を登録します。\n\n・テンプレートを「プログラム進行型」に変更します\n・既存のプログラムに追記します（既存は消えません）\n\n続行しますか？'
        : '「番号呼び出し型」のサンプル（薬局・6番号）を登録します。\n\n・テンプレートを「番号呼び出し型」に変更します\n・既存のプログラムに追記します（既存は消えません）\n\n続行しますか？'
    )
    if (!ok) return
    setSeedState('loading')
    try {
      // 1. イベントタイプを切替＆タイトルを上書き
      const presetTitle =
        template === 'program_timeline'
          ? event?.title || 'サンプル運動会 2026'
          : event?.title || 'サンプル薬局 受付'
      const presetLocation =
        template === 'program_timeline'
          ? event?.location || '○○小学校 校庭'
          : event?.location || '○○薬局 待合スペース'
      const presetDescription =
        template === 'program_timeline'
          ? event?.description || '全校児童による春の運動会。応援よろしくお願いします。'
          : event?.description || '受付番号が表示されたら窓口までお越しください。'
      await saveEvent({
        id: eventId,
        title: presetTitle,
        description: presetDescription,
        location: presetLocation,
        eventType: template,
        startDate: new Date().toISOString().slice(0, 10),
      })

      // 2. サンプルプログラム生成
      const baseOrder = programs.length + 1
      const samples =
        template === 'program_timeline'
          ? [
              { title: '開会式', description: '校長挨拶・選手宣誓', scheduledStart: '09:30' },
              { title: 'ラジオ体操', description: '全校児童', scheduledStart: '10:00' },
              { title: 'かけっこ', description: '1年生', scheduledStart: '10:30' },
              { title: '玉入れ', description: '2〜3年生', scheduledStart: '11:00' },
              { title: 'リレー', description: '5〜6年生 代表', scheduledStart: '11:30' },
              { title: '閉会式', description: '結果発表・表彰', scheduledStart: '12:00' },
            ]
          : [
              { title: '101', description: '受付1', scheduledStart: '' },
              { title: '102', description: '受付1', scheduledStart: '' },
              { title: '103', description: '受付2', scheduledStart: '' },
              { title: '104', description: '受付2', scheduledStart: '' },
              { title: '105', description: '相談カウンター', scheduledStart: '' },
              { title: '106', description: '相談カウンター', scheduledStart: '' },
            ]

      const programsToInsert: Program[] = samples.map((s, i) => ({
        id: `sample-${template}-${Date.now()}-${i}`,
        order: baseOrder + i,
        title: s.title,
        description: s.description,
        scheduledStart: s.scheduledStart,
        scheduledEnd: '',
        status: 'upcoming',
      }))
      await saveProgramsBulk(eventId, programsToInsert)

      track.programAdd('single', programsToInsert.length)
      track.templateChange(template)
      setSeedState('done')
      window.setTimeout(() => setSeedState('idle'), 2400)
    } catch (e) {
      console.error('loadSample failed', e)
      window.alert('サンプル投入に失敗しました。再試行してください。')
      setSeedState('idle')
    }
  }

  const base = import.meta.env.BASE_URL
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/" className="flex items-center gap-2 shrink-0" title="ホームへ">
            <img
              src={`${base}brand/liveboard-logo.png`}
              alt="LiveBoard"
              className="h-8 md:h-9 w-auto"
            />
          </Link>
          <span className="text-slate-300 hidden md:inline">/</span>
          <h1 className="text-base md:text-lg font-bold text-slate-800">🎛 操作画面</h1>
          <span className="text-xs text-slate-400">
            event: <code>{eventId}</code>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 truncate max-w-[12rem]">
            {user.displayName || user.email}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
            title="ログアウト"
          >
            <LogOut size={14} />
            ログアウト
          </button>
          <Link
            to={`/display?event=${eventId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-[#538bb0] hover:bg-[#3d6f94] text-white px-3 py-1.5 rounded"
          >
            表示画面を開く ↗
          </Link>
        </div>
      </header>

      {!isFirebaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-sm text-amber-800">
          ⚠️ Firebase 未設定。<code>.env</code> に VITE_FIREBASE_* を設定してください。
        </div>
      )}
      {!isOwner && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-sm text-amber-800">
          ⚠️ このイベントの所有者は別のアカウントです。閲覧のみ可能（編集できません）。
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-b border-red-300 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        <SharePanel eventId={eventId} event={event} canEdit={isOwner} />

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

          {/* サンプルデータ自動投入 */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div>
                <div className="text-sm font-bold text-slate-700">
                  🚀 デモ用サンプルデータ
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  テンプレートを切り替えて、すぐに動作確認できる初期データを投入します
                </div>
              </div>
              {seedState === 'done' && (
                <span className="text-sm text-green-700 font-bold animate-pulse">
                  ✓ サンプルを追加しました
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleLoadSample('program_timeline')}
                disabled={seedState === 'loading'}
                className="text-left bg-white hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-500 disabled:opacity-50 disabled:cursor-wait rounded-lg p-3 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-slate-800">
                    📋 プログラム進行型
                  </div>
                  <div className="text-xs text-emerald-600 font-bold">
                    運動会・式典向け
                  </div>
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  開会式・かけっこ・玉入れ・リレー・閉会式 など 6プログラム
                </div>
              </button>
              <button
                onClick={() => handleLoadSample('calling_number')}
                disabled={seedState === 'loading'}
                className="text-left bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 disabled:opacity-50 disabled:cursor-wait rounded-lg p-3 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-slate-800">
                    🔔 番号呼び出し型
                  </div>
                  <div className="text-xs text-blue-600 font-bold">
                    薬局・クリニック向け
                  </div>
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  101〜106 の受付番号 + 部屋名（受付1/2・相談カウンター）
                </div>
              </button>
            </div>
          </div>
        </section>

        <ProgramsList
          eventId={eventId}
          programs={programs}
          currentProgramId={current?.currentProgramId ?? null}
          onJump={handleJump}
          template={normalizeEventType(event?.eventType ?? 'program_timeline')}
        />

        <AddProgramForm eventId={eventId} nextOrder={programs.length + 1} />

        <DangerZone eventId={eventId} eventTitle={event?.title ?? ''} />
      </div>

      <AthFooter />
    </div>
  )
}

function DangerZone({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const handleDelete = async () => {
    const label = eventTitle || eventId
    const confirmed = window.confirm(
      `「${label}」を完全に削除します。\n\n` +
        '・全プログラム\n・イベント設定（タイトル/場所/概要）\n・進行中の状態\n・表示画面のレイアウト設定\n\n' +
        'すべて消えて元に戻せません。本当に削除しますか？'
    )
    if (!confirmed) return
    const phrase = window.prompt(
      `最終確認: イベントIDをそのまま入力してください\n（${eventId}）`
    )
    if (phrase !== eventId) {
      if (phrase !== null) window.alert('入力が一致しません。中止しました。')
      return
    }
    setBusy(true)
    try {
      await deleteEventCompletely(eventId)
      setDone(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      window.alert(`削除に失敗しました: ${msg}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-red-50 border-2 border-red-300 rounded-lg p-4 md:p-6 space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-red-700">
        <AlertTriangle size={18} />
        危険な操作
      </h2>
      <p className="text-sm text-red-700">
        このイベント（<code className="bg-white px-1 rounded border border-red-200">{eventId}</code>）に紐づくデータをすべて削除し、まっさらな状態から作り直します。
      </p>
      {done ? (
        <div className="bg-white border border-red-200 rounded p-3 text-sm text-slate-700">
          削除しました。ページを再読み込みすると新規イベントとして登録できます。
          <div className="mt-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#538bb0] hover:bg-[#3d6f94] text-white px-3 py-1.5 rounded text-sm font-bold"
            >
              再読み込み
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          disabled={busy}
          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
        >
          <Trash2 size={16} />
          {busy ? '削除中…' : 'このイベントを完全に削除'}
        </button>
      )}
    </section>
  )
}

function SharePanel({
  eventId,
  event,
  canEdit,
}: {
  eventId: string
  event: SchoolEvent | null
  canEdit: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const published = event?.published === true
  const viewerUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#/display?event=${eventId}`
      : ''

  useEffect(() => {
    if (!published || !canvasRef.current || !viewerUrl) return
    QRCode.toCanvas(canvasRef.current, viewerUrl, { width: 200, margin: 1 }).catch(() => {})
  }, [published, viewerUrl])

  const togglePublish = async (next: boolean) => {
    setBusy(true)
    try {
      await setEventPublished(eventId, next)
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(viewerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      className={`rounded-lg p-4 md:p-6 border-2 ${
        published ? 'bg-[#538bb0]/5 border-[#538bb0]' : 'bg-slate-50 border-slate-300'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            {published ? '🟢' : '⚪'} 視聴者への共有
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            公開すると、誰でも視聴できるURLとQRコードが発行されます
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => togglePublish(!published)}
            disabled={busy}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm shrink-0 disabled:opacity-50 ${
              published
                ? 'bg-white border-2 border-red-300 text-red-600 hover:bg-red-50'
                : 'bg-[#538bb0] hover:bg-[#3d6f94] text-white'
            }`}
          >
            {busy ? '...' : published ? '🔒 非公開にする' : '📡 公開する'}
          </button>
        )}
      </div>

      {published ? (
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 items-start">
          <div className="bg-white p-3 rounded border border-slate-200 inline-block mx-auto">
            <canvas ref={canvasRef} />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">視聴者用URL（QRから自動アクセスされます）</div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={viewerUrl}
                  className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className="bg-[#538bb0] hover:bg-[#3d6f94] text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1 shrink-0"
                >
                  <Copy size={14} />
                  {copied ? 'コピーOK' : 'コピー'}
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded p-3 space-y-1">
              <div className="font-semibold">📣 視聴者への共有方法</div>
              <div>① 上のURLをLINE/メールで保護者・関係者に送る</div>
              <div>② または、会場入口・配布物にこのQRコードを印刷</div>
              <div>③ 視聴者はログイン不要・誰でも閲覧可能</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded p-4 text-center text-sm text-slate-600 space-y-2">
          <div className="text-3xl">🔒</div>
          <div>
            このイベントは現在<strong>非公開</strong>です。<br />
            プログラム登録などの準備が整ったら、上の「<strong>📡 公開する</strong>」ボタンを押してください。
          </div>
        </div>
      )}
    </section>
  )
}

function LoginGate({
  signIn,
  error,
}: {
  signIn: () => Promise<void>
  error: string | null
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full bg-slate-50 border border-slate-200 rounded-lg p-6 md:p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">🎛 操作画面ログイン</h1>
        <p className="text-sm text-slate-600">
          イベントを編集するにはログインしてください。あなたが作成したイベントは、あなたしか編集できません。
        </p>
        <button
          onClick={signIn}
          className="w-full bg-[#538bb0] hover:bg-[#3d6f94] text-white px-4 py-3 rounded font-bold"
        >
          Google でログイン
        </button>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="text-xs text-slate-500 pt-2">
          視聴者向けの表示画面はログイン不要で誰でも見られます。
        </div>
      </div>
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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => setTitle(eventTitle), [eventTitle])
  useEffect(() => setDescription(eventDescription), [eventDescription])
  useEffect(() => setLocation(eventLocation), [eventLocation])
  useEffect(() => setType(eventType), [eventType])

  const handleSave = async () => {
    setSaveState('saving')
    try {
      await saveEvent({
        id: eventId,
        title: title || '無題のイベント',
        description,
        location,
        eventType: type,
        startDate: new Date().toISOString().slice(0, 10),
      })
      track.eventSave(normalizeEventType(type))
      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 2400)
    } catch (e) {
      console.error('saveEvent failed', e)
      setSaveState('error')
      window.setTimeout(() => setSaveState('idle'), 3500)
    }
  }

  return (
    <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">イベント設定</h2>
      <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
        🔓 公開すると、ここに入力した内容はURLを知っている人なら誰でも閲覧できます。<strong>個人住所・電話番号などは入力しないでください。</strong>
      </div>
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
          <div className="text-xs text-slate-500">
            デザインテンプレート
            <span className="text-slate-400 ml-1">（表示画面の見せ方）</span>
          </div>
          <select
            value={normalizeEventType(type)}
            onChange={(e) => setType(e.target.value as EventType)}
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800"
          >
            <option value="program_timeline">
              プログラム進行型（運動会・式典・セミナー）
            </option>
            <option value="calling_number">
              番号呼び出し型（クリニック・薬局・自治体）
            </option>
            <option value="queue_counter">
              順番待ちカウンター型（飲食店・サロン）
            </option>
          </select>
        </label>
        <label className="md:col-span-3 space-y-1">
          <div className="text-xs text-slate-500">場所（個人住所NG・施設名のみ推奨）</div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: ○○小学校 校庭（番地は書かない）"
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
      <div className="flex items-center justify-end gap-3">
        {saveState === 'saved' && (
          <span className="text-sm text-green-700 font-bold animate-pulse">
            ✓ 保存しました
          </span>
        )}
        {saveState === 'error' && (
          <span className="text-sm text-red-600 font-bold">
            ⚠️ 保存に失敗しました。再試行してください
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className={`px-5 py-2 rounded text-sm font-bold text-white transition-all duration-200 min-w-[120px] ${
            saveState === 'saving'
              ? 'bg-slate-400 cursor-wait'
              : saveState === 'saved'
              ? 'bg-green-600 hover:bg-green-700 scale-105 shadow-lg shadow-green-200'
              : saveState === 'error'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[#538bb0] hover:bg-[#3d6f94]'
          }`}
        >
          {saveState === 'saving' && '保存中…'}
          {saveState === 'saved' && '✓ 保存完了'}
          {saveState === 'error' && '再試行'}
          {saveState === 'idle' && '保存'}
        </button>
      </div>
    </section>
  )
}

export function AthFooter() {
  const base = import.meta.env.BASE_URL
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <a
          href="https://apptalenthub.co.jp?utm_source=school-live"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src={`${base}brand/ath-mark.png`}
            alt=""
            aria-hidden="true"
            className="w-6 h-6 shrink-0"
          />
          <span className="text-slate-600">
            Powered by{' '}
            <span className="text-[#538bb0] font-semibold">AppTalentHub</span>
          </span>
          <img
            src={`${base}brand/rapittokun.png`}
            alt="ラピットくん"
            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
          />
        </a>
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
  template,
}: {
  eventId: string
  programs: Program[]
  currentProgramId: string | null
  onJump: (id: string) => void
  template?: 'program_timeline' | 'calling_number' | 'queue_counter'
}) {
  // calling_number テンプレ時は status 別の3セクション表示
  if (template === 'calling_number') {
    const called = programs.filter((p) => p.status === 'done')
    const current = programs.find((p) => p.id === currentProgramId) ?? null
    const upcoming = programs.filter((p) => p.status === 'upcoming')

    return (
      <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">番号管理（薬局・クリニック等）</h2>
          <span className="text-xs text-slate-500">
            計 {programs.length} 件
          </span>
        </div>
        {programs.length === 0 && (
          <p className="text-sm text-slate-500">
            まだ番号が登録されていません。下のフォームから「101」「102」…のように番号を追加してください。
          </p>
        )}

        {/* 進行中（呼び出し中の番号） */}
        {current && (
          <div className="bg-[#538bb0]/10 border-2 border-[#538bb0] rounded-lg p-4">
            <div className="text-xs font-bold text-[#538bb0] tracking-widest mb-2">
              ● 呼び出し中
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-3xl md:text-4xl font-black text-slate-800">
                {current.title || '—'}
              </div>
              {current.description && (
                <div className="text-base text-slate-600 truncate">{current.description}</div>
              )}
              <button
                onClick={() => {
                  if (confirm(`「${current.title}」を削除しますか？`)) {
                    deleteProgram(eventId, current.id)
                  }
                }}
                className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* お待ちの番号 */}
        <div className="bg-white border border-amber-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-700 tracking-widest">
              ⏳ お待ちの番号（クリックで呼び出し）
            </div>
            <span className="text-xs text-slate-500">{upcoming.length} 件</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">お待ちの番号はありません</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {upcoming.map((p) => (
                <NumberChip
                  key={p.id}
                  label={p.title || '—'}
                  sub={p.description}
                  onClick={() => onJump(p.id)}
                  onDelete={() => {
                    if (confirm(`「${p.title}」を削除しますか？`)) {
                      deleteProgram(eventId, p.id)
                    }
                  }}
                  variant="upcoming"
                />
              ))}
            </div>
          )}
        </div>

        {/* 呼び出し済み */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 tracking-widest">
              ✓ 呼び出し済み（クリックで再呼び出し）
            </div>
            <span className="text-xs text-slate-500">{called.length} 件</span>
          </div>
          {called.length === 0 ? (
            <p className="text-sm text-slate-400">まだ呼び出し済みの番号はありません</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {called.map((p) => (
                <NumberChip
                  key={p.id}
                  label={p.title || '—'}
                  sub={p.description}
                  onClick={() => onJump(p.id)}
                  onDelete={() => {
                    if (confirm(`「${p.title}」を削除しますか？`)) {
                      deleteProgram(eventId, p.id)
                    }
                  }}
                  variant="called"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  // 既存：プログラム順表示（program_timeline / queue_counter）
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

function NumberChip({
  label,
  sub,
  onClick,
  onDelete,
  variant,
}: {
  label: string
  sub?: string
  onClick: () => void
  onDelete: () => void
  variant: 'upcoming' | 'called'
}) {
  const base =
    variant === 'upcoming'
      ? 'bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 hover:border-amber-400 text-slate-800'
      : 'bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-500 line-through decoration-2'
  return (
    <div className={`relative group rounded-lg overflow-hidden ${base} transition-colors`}>
      <button
        onClick={onClick}
        className="px-4 py-2 pr-9 text-2xl md:text-3xl font-black tracking-tight text-left"
        title={variant === 'upcoming' ? 'クリックで呼び出し' : 'クリックで再呼び出し'}
      >
        {label}
        {sub && (
          <span className="ml-2 text-xs font-normal text-slate-500 no-underline align-middle">
            {sub}
          </span>
        )}
      </button>
      <button
        onClick={onDelete}
        className="absolute top-1 right-1 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="削除"
      >
        <Trash2 size={12} />
      </button>
    </div>
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
  a.download = 'live-board-sample.csv'
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
