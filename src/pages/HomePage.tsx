import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { LogOut } from 'lucide-react'
import { DEFAULT_EVENT_ID, isFirebaseConfigured, uidToEventId } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { AthFooter } from './ControlPage'

export default function HomePage() {
  const { user, loading, signIn, signOut } = useAuthStore()
  const eventId = user ? uidToEventId(user.uid) : DEFAULT_EVENT_ID
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const url = `${window.location.origin}${window.location.pathname}#/display?event=${eventId}`
    QRCode.toCanvas(canvasRef.current, url, { width: 220 }).catch((e) => {
      console.error('QR生成失敗:', e)
    })
  }, [eventId])

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      <div className="flex-1 max-w-3xl w-full mx-auto p-8 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">school-live-board</h1>
          <p className="text-slate-500 text-sm md:text-base">
            学校イベントの進行プログラムを全端末リアルタイム同期で表示
          </p>
        </header>

        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-sm text-amber-800">
            ⚠️ Firebase 設定が読み込まれていません。プロジェクトルートに{' '}
            <code className="bg-amber-100 px-1 rounded">.env</code>{' '}
            を作成し、<code className="bg-amber-100 px-1 rounded">VITE_FIREBASE_*</code>{' '}
            を設定してください。
          </div>
        )}

        {!loading && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-3">
            {user ? (
              <>
                <div className="text-sm text-slate-700 min-w-0">
                  <div className="text-xs text-slate-500">ログイン中</div>
                  <div className="font-semibold truncate">
                    {user.displayName || user.email}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    イベントID: <code className="bg-white border border-slate-200 px-1 rounded">{eventId}</code>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 shrink-0"
                >
                  <LogOut size={14} />
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <div className="text-sm text-slate-600">
                  イベントを編集するには Google ログインが必要です（視聴は不要）
                </div>
                <button
                  onClick={signIn}
                  className="bg-[#538bb0] hover:bg-[#3d6f94] text-white px-3 py-1.5 rounded text-sm font-bold shrink-0"
                >
                  ログイン
                </button>
              </>
            )}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/control"
            className="bg-[#538bb0] hover:bg-[#3d6f94] transition-colors rounded-lg p-6 text-center space-y-2 text-white"
          >
            <div className="text-2xl font-bold">🎛 操作画面</div>
            <p className="text-sm text-white/90">
              プログラム編集・現在進行中の切替（教員・実行委員向け）
            </p>
          </Link>
          <Link
            to="/display"
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors rounded-lg p-6 text-center space-y-2 text-slate-800"
          >
            <div className="text-2xl font-bold">📺 表示画面</div>
            <p className="text-sm text-slate-600">
              大画面・スマホ向けフルスクリーン表示
            </p>
          </Link>
        </section>

        <section className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">視聴者用QR</h2>
          <p className="text-sm text-slate-500">
            このQRから視聴者は表示画面にアクセスできます
          </p>
          <div className="flex justify-center bg-white p-3 rounded inline-block mx-auto w-fit border border-slate-200">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-xs text-slate-500 break-all">
            イベントID: <code className="bg-white border border-slate-200 px-1 rounded">{eventId}</code>
          </p>
        </section>
      </div>
      <AthFooter />
    </div>
  )
}
