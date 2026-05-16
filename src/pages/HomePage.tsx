import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { DEFAULT_EVENT_ID, isFirebaseConfigured } from '@/lib/firebase'

export default function HomePage() {
  const [eventId] = useState(DEFAULT_EVENT_ID)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const url = `${window.location.origin}${window.location.pathname}#/display?event=${eventId}`
    QRCode.toCanvas(canvasRef.current, url, { width: 220 }).catch((e) => {
      console.error('QR生成失敗:', e)
    })
  }, [eventId])

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">school-live-board</h1>
          <p className="text-slate-400 text-sm md:text-base">
            学校イベントの進行プログラムを全端末リアルタイム同期で表示
          </p>
        </header>

        {!isFirebaseConfigured && (
          <div className="bg-amber-900/40 border border-amber-600 rounded-lg p-4 text-sm text-amber-100">
            ⚠️ Firebase 設定が読み込まれていません。プロジェクトルートに{' '}
            <code className="bg-amber-950 px-1 rounded">.env.local</code>{' '}
            を作成し、<code className="bg-amber-950 px-1 rounded">VITE_FIREBASE_*</code>{' '}
            を設定してください。
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/control"
            className="bg-accent hover:bg-accent/80 transition-colors rounded-lg p-6 text-center space-y-2"
          >
            <div className="text-2xl font-bold">🎛 操作画面</div>
            <p className="text-sm text-white/80">
              プログラム編集・現在進行中の切替（教員・実行委員向け）
            </p>
          </Link>
          <Link
            to="/display"
            className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-6 text-center space-y-2"
          >
            <div className="text-2xl font-bold">📺 表示画面</div>
            <p className="text-sm text-white/80">
              大画面・スマホ向けフルスクリーン表示
            </p>
          </Link>
        </section>

        <section className="bg-slate-800 rounded-lg p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold">視聴者用QR</h2>
          <p className="text-sm text-slate-400">
            このQRから視聴者は表示画面にアクセスできます
          </p>
          <div className="flex justify-center bg-white p-3 rounded inline-block mx-auto w-fit">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-xs text-slate-500 break-all">
            イベントID: <code className="bg-slate-900 px-1 rounded">{eventId}</code>
          </p>
        </section>

        <footer className="text-center text-xs text-slate-500 pt-8">
          AppTalentHub Inc. ·{' '}
          <a
            href="https://github.com/tsubasagit/school-live-board"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 underline"
          >
            GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}
