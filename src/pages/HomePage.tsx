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

  const base = import.meta.env.BASE_URL
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      <section className="bg-gradient-to-b from-[#eef5fa] to-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
          <header className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <img
                src={`${base}brand/rapittokun.png`}
                alt="ラピットくん"
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
              />
              <h1 className="text-3xl md:text-5xl font-bold text-slate-800">live-board</h1>
            </div>
            <p className="text-slate-600 text-base md:text-xl">
              「いま何番／何が進行中か」を<span className="text-[#538bb0] font-semibold">全端末リアルタイム同期</span>で大画面表示
            </p>
          </header>
          <img
            src={`${base}og/hero-parents.png`}
            alt="体育館で運動会を観覧する保護者たち。手元のスマホと正面の大型スクリーンに同じ「かけっこ」プログラムが同時に表示されている"
            className="w-full rounded-lg shadow-md border border-slate-200"
            loading="eager"
          />
        </div>
      </section>

      <div className="flex-1 max-w-3xl w-full mx-auto p-8 space-y-8">

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

      <section className="bg-slate-50 border-t border-slate-200 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">アプリの使い方</h2>
            <p className="text-sm md:text-base text-slate-500">
              運営者は1台で操作、視聴者は何台でも同時に同じ画面が見られます
            </p>
            <img
              src={`${base}og/sync-devices.png`}
              alt="大型テレビ・タブレット・スマートフォンの3デバイスが、すべて同じ進行画面をリアルタイムで同期表示している様子"
              className="w-full max-w-3xl mx-auto rounded-lg border border-slate-200"
              loading="lazy"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <figure className="space-y-3">
              <img
                src={`${base}screenshots/display-program1.png`}
                alt="表示画面 — 現在進行中のプログラム「かけっこ」を中央に大きく表示。右側にプログラム一覧"
                className="w-full rounded-lg border border-slate-200 shadow-sm"
                loading="lazy"
              />
              <figcaption className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">📺 表示画面（来場者向け）</span>
                <br />
                ヘッダーにタイトル・場所・概要、中央に現在進行中のプログラムを大きく表示。
              </figcaption>
            </figure>

            <figure className="space-y-3">
              <img
                src={`${base}screenshots/display-program2.png`}
                alt="表示画面 — 「次へ」を押した瞬間、全端末で同時に「リレー」へ切替"
                className="w-full rounded-lg border border-slate-200 shadow-sm"
                loading="lazy"
              />
              <figcaption className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">⚡ 全端末リアルタイム同期</span>
                <br />
                「次へ」を1回押すだけで、大画面・各教室モニタ・保護者のスマホが瞬時に切り替わる。
              </figcaption>
            </figure>
          </div>

          <figure className="space-y-3">
            <img
              src={`${base}screenshots/control.png`}
              alt="操作画面 — 表示レイアウト切替、イベント設定、進行コントロール、プログラム一覧、CSV一括登録を1画面に集約"
              className="w-full rounded-lg border border-slate-200 shadow-sm"
              loading="lazy"
            />
            <figcaption className="text-sm text-slate-600 text-center">
              <span className="font-semibold text-slate-800">🎛 操作画面（運営者向け）</span>
              <br />
              表示画面のレイアウト切替・イベント設定・進行コントロール・プログラム一覧・CSV一括登録を1画面に集約。スマホからでも片手で操作可能。
            </figcaption>
          </figure>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Googleログインで安全"
              body="自分が作ったイベントは、自分しか編集できません。視聴者はログイン不要。"
            />
            <FeatureCard
              title="CSV一括登録"
              body="プログラムが多くてもCSV貼り付けで一気に登録。サンプルCSVもダウンロード可能。"
            />
            <FeatureCard
              title="無料・サインアップ即利用"
              body="広告なし。Firebase無料枠で運用、500端末程度の同時閲覧なら追加課金不要。"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-200 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">こんな場面で使えます</h2>
            <p className="text-sm md:text-base text-slate-500">
              「順番」と「進行中」を全員のスマホに同期する、シンプルな仕組み
            </p>
            <img
              src={`${base}og/use-cases.png`}
              alt="運動会の体育館スクリーン、薬局の待合室の番号表示、飲食店の順番待ち表示、3シーンが同じUIで並ぶ"
              className="w-full max-w-4xl mx-auto rounded-lg border border-slate-200"
              loading="lazy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UseCaseCard
              emoji="🏃"
              title="運動会・体育祭"
              body="今どの種目か体育館後方からでも分かる。グループLINEで保護者にURLを共有すれば、来賓席・別教室からスマホで進行を確認可能。"
            />
            <UseCaseCard
              emoji="🎭"
              title="文化祭・学園祭"
              body="ステージ進行・出し物の順番を、来場者の保護者・卒業生にスマホで共有。紙のしおりを刷り直さずに変更追従できる。"
            />
            <UseCaseCard
              emoji="💊"
              title="薬局の処方待ち"
              body="「ただいま◯番」を待合室の画面とスマホに同時表示。スタッフが番号を進めると全員のスマホが更新。アナウンス代わりに使える。"
            />
            <UseCaseCard
              emoji="🍜"
              title="飲食店・カフェの順番待ち"
              body="店外待ちのお客様にQRを渡すだけで「あと何組」が見える。スタッフは厨房から1タップで進行管理。プリンタも整理券も不要。"
            />
            <UseCaseCard
              emoji="💇"
              title="美容室・サロンの受付"
              body="次のお客様を呼び出すタイミングを店内モニタとスマホに反映。施術中のお客様や家族同行者にも進行状況が伝わる。"
            />
            <UseCaseCard
              emoji="🏥"
              title="クリニック・歯科の受付"
              body="番号呼び出しシステムの簡易代替。スマホで呼ばれるタイミングが分かるので、車内・近隣で待っているお客様にも便利。"
            />
            <UseCaseCard
              emoji="💍"
              title="結婚式・パーティ"
              body="進行表を司会・親族・新郎新婦で同期。歓談中のゲストも次のプログラム（ケーキ入刀・余興など）をスマホで把握できる。"
            />
            <UseCaseCard
              emoji="🏘"
              title="町内会・PTA・地域行事"
              body="議事の進行や、お祭りステージの順番を会場全体に共有。集会所のテレビとスマホ両方に映せる。"
            />
            <UseCaseCard
              emoji="🎤"
              title="セミナー・社内総会"
              body="アジェンダの進捗を会場・オンライン参加者の両方に同期表示。休憩タイミングや次のセッションが一目で分かる。"
            />
          </div>

          <div className="text-center text-sm text-slate-500 pt-4">
            他にも使えるアイデアがあれば、お気軽に
            <a
              href="https://forms.apptalenthub.co.jp/contact?utm_source=school-live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#538bb0] hover:underline mx-1"
            >
              お問い合わせ
            </a>
            ください。
          </div>
        </div>
      </section>

      <AthFooter />
    </div>
  )
}

function UseCaseCard({
  emoji,
  title,
  body,
}: {
  emoji: string
  title: string
  body: string
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          {emoji}
        </span>
        <div className="text-base font-semibold text-slate-800">{title}</div>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed">{body}</div>
    </div>
  )
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
      <div className="text-base font-semibold text-slate-800">{title}</div>
      <div className="text-sm text-slate-600">{body}</div>
    </div>
  )
}
