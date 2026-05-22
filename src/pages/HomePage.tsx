import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { isFirebaseConfigured, uidToEventId } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { AthFooter } from './ControlPage'

export default function HomePage() {
  const { user, loading, signIn, signOut } = useAuthStore()
  const eventId = user ? uidToEventId(user.uid) : null

  const base = import.meta.env.BASE_URL
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-[#eef5fa] via-white to-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16 space-y-10 md:space-y-14">
          <header className="text-center space-y-6 md:space-y-8">
            <h1 className="flex justify-center">
              <img
                src={`${base}brand/liveboard-logo.png`}
                alt="LiveBoard"
                className="h-20 md:h-32 w-auto"
              />
            </h1>
            <p className="text-2xl md:text-4xl font-bold text-slate-900 leading-relaxed max-w-3xl mx-auto">
              <span className="text-[#538bb0]">いま、何が進行中か。</span>
              <br className="hidden md:inline" />
              全員のスマホに、同時に届く。
            </p>
            <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-loose">
              運動会・文化祭・薬局の順番待ち・受付。<br className="hidden md:inline" />
              「次へ」を一回押すだけで、大画面・タブレット・スマホがすべて同期します。
            </p>
          </header>

          <img
            src={`${base}og/hero-parents.png`}
            alt="体育館で運動会を観覧する保護者たち。手元のスマホと正面の大型スクリーンに同じ「かけっこ」プログラムが同時に表示されている"
            className="w-full rounded-2xl shadow-lg border border-slate-200"
            loading="eager"
          />
        </div>
      </section>

      {/* 紹介動画 */}
      <section className="bg-white border-t border-slate-200 py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-5 md:px-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="text-sm md:text-base text-[#538bb0] font-bold tracking-widest">
              INTRO MOVIE
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900">
              LiveBoard 紹介動画
            </h2>
          </div>
          <video
            controls
            preload="metadata"
            poster={`${base}videos/liveboard-intro-poster.jpg`}
            className="w-full rounded-2xl shadow-lg border border-slate-200 bg-slate-100"
          >
            <source src={`${base}videos/liveboard-intro.mp4`} type="video/mp4" />
            お使いのブラウザは video タグに対応していません。
          </video>
          <p className="text-sm md:text-base text-slate-500 text-center leading-loose">
            ※ イメージです。動画は生成AIで作成したもので、<br className="hidden md:inline" />
            実際の表示画面のようにするにはカスタマイズが必要です。
          </p>
        </div>
      </section>

      {/* CTA / 認証状態カード */}
      <div className="max-w-3xl w-full mx-auto px-5 md:px-8 py-10 md:py-14 space-y-6">
        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-base text-amber-900">
            ⚠️ Firebase 設定が読み込まれていません。プロジェクトルートに{' '}
            <code className="bg-amber-100 px-1 rounded">.env</code>{' '}
            を作成し、<code className="bg-amber-100 px-1 rounded">VITE_FIREBASE_*</code>{' '}
            を設定してください。
          </div>
        )}

        {!loading &&
          (user && eventId ? (
            <div className="bg-[#538bb0]/5 border-2 border-[#538bb0] rounded-2xl p-6 md:p-8 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-700 min-w-0">
                  <div className="text-xs text-[#538bb0] font-bold tracking-wider">
                    ログイン中
                  </div>
                  <div className="font-bold truncate text-lg">
                    {user.displayName || user.email}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 shrink-0"
                >
                  <LogOut size={16} />
                  ログアウト
                </button>
              </div>
              <Link
                to={`/control?event=${eventId}`}
                className="block w-full bg-[#538bb0] hover:bg-[#3d6f94] text-white px-6 py-5 rounded-xl text-center font-bold text-xl md:text-2xl transition-colors"
              >
                🎛 あなたのイベント操作画面へ
              </Link>
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                操作画面内で「公開」をONにすると、<br className="md:hidden" />
                視聴者用URLとQRコードが発行されます。
              </p>
            </div>
          ) : (
            <div className="bg-[#538bb0]/5 border-2 border-[#538bb0] rounded-2xl p-7 md:p-10 text-center space-y-6">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900">
                無料で、今すぐ始める。
              </h2>
              <p className="text-base md:text-lg text-slate-700 leading-loose max-w-xl mx-auto">
                Google アカウントでログインするだけ。<br />
                あなた専用の編集権限つきイベントが自動作成されます。<br />
                <span className="text-slate-500 text-sm md:text-base">
                  視聴者はログイン不要。配布されたQR/URLからアクセスできます。
                </span>
              </p>
              <button
                onClick={signIn}
                className="bg-[#538bb0] hover:bg-[#3d6f94] text-white px-8 py-5 rounded-xl font-bold text-lg md:text-xl transition-colors"
              >
                Google でログインして始める
              </button>
              <div className="pt-2 text-sm text-slate-500 max-w-xl mx-auto">
                すでにイベント主催者から配布されたURL/QRをお持ちの方は、そのまま開けば視聴できます（ログイン不要）。
              </div>
            </div>
          ))}
      </div>

      {/* アプリの使い方 */}
      <section className="bg-slate-50 border-t border-slate-200 py-16 md:py-28">
        <div className="max-w-6xl mx-auto px-5 md:px-8 space-y-14 md:space-y-20">
          <div className="text-center space-y-5 md:space-y-7">
            <div className="text-sm md:text-base text-[#538bb0] font-bold tracking-widest">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              運営者は1台、視聴者は何台でも。
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-loose max-w-2xl mx-auto">
              「次へ」のボタンを押した瞬間、すべての端末が一斉に同じ画面に変わります。
            </p>
            <img
              src={`${base}og/sync-devices.png`}
              alt="大型テレビ・タブレット・スマートフォンの3デバイスが、すべて同じ進行画面をリアルタイムで同期表示している様子"
              className="w-full max-w-4xl mx-auto rounded-xl border border-slate-200"
              loading="lazy"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12">
            <figure className="space-y-5">
              <img
                src={`${base}screenshots/display-program1.png`}
                alt="表示画面 — 現在進行中のプログラム「かけっこ」を中央に大きく表示。右側にプログラム一覧"
                className="w-full rounded-xl border border-slate-200 shadow-sm"
                loading="lazy"
              />
              <figcaption className="space-y-2">
                <div className="text-xl md:text-2xl font-bold text-slate-900">
                  📺 表示画面（来場者向け）
                </div>
                <p className="text-base md:text-lg text-slate-600 leading-loose">
                  ヘッダーにタイトル・場所・概要、中央に現在進行中のプログラムを大きく表示。
                </p>
              </figcaption>
            </figure>

            <figure className="space-y-5">
              <img
                src={`${base}screenshots/display-program2.png`}
                alt="表示画面 — 「次へ」を押した瞬間、全端末で同時に「リレー」へ切替"
                className="w-full rounded-xl border border-slate-200 shadow-sm"
                loading="lazy"
              />
              <figcaption className="space-y-2">
                <div className="text-xl md:text-2xl font-bold text-slate-900">
                  ⚡ 全端末リアルタイム同期
                </div>
                <p className="text-base md:text-lg text-slate-600 leading-loose">
                  「次へ」を1回押すだけで、大画面・各教室モニタ・保護者のスマホが瞬時に切り替わる。
                </p>
              </figcaption>
            </figure>
          </div>

          <figure className="space-y-5">
            <img
              src={`${base}screenshots/control.png`}
              alt="操作画面 — 表示レイアウト切替、イベント設定、進行コントロール、プログラム一覧、CSV一括登録を1画面に集約"
              className="w-full rounded-xl border border-slate-200 shadow-sm"
              loading="lazy"
            />
            <figcaption className="text-center space-y-2 max-w-3xl mx-auto">
              <div className="text-xl md:text-2xl font-bold text-slate-900">
                🎛 操作画面（運営者向け）
              </div>
              <p className="text-base md:text-lg text-slate-600 leading-loose">
                表示画面のレイアウト切替・イベント設定・進行コントロール・プログラム一覧・CSV一括登録を1画面に集約。スマホからでも片手で操作可能。
              </p>
            </figcaption>
          </figure>

          {/* 特徴3カード — 大きく */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-4">
            <FeatureCard
              title="Googleログインで安全"
              body="自分が作ったイベントは、自分しか編集できません。視聴者はログイン不要。"
            />
            <FeatureCard
              title="CSV一括登録"
              body="プログラムが多くてもCSV貼り付けで一気に登録。サンプルCSVもダウンロード可能。"
            />
            <FeatureCard
              title="完全無料・即利用"
              body="広告なし。Firebase無料枠で運用、500端末程度の同時閲覧なら追加課金不要。"
            />
          </div>
        </div>
      </section>

      {/* 使える場面 */}
      <section className="bg-white border-t border-slate-200 py-16 md:py-28">
        <div className="max-w-6xl mx-auto px-5 md:px-8 space-y-12 md:space-y-16">
          <div className="text-center space-y-5 md:space-y-7">
            <div className="text-sm md:text-base text-[#538bb0] font-bold tracking-widest">
              USE CASES
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              こんな場面で使えます。
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-loose max-w-2xl mx-auto">
              「順番」と「進行中」を全員のスマホに同期する、シンプルな仕組み。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
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

          <div className="text-center text-base text-slate-600 pt-6">
            他にも使えるアイデアがあれば、お気軽に
            <a
              href="https://forms.apptalenthub.co.jp/contact?utm_source=school-live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#538bb0] hover:underline mx-1 font-semibold"
            >
              お問い合わせ
            </a>
            ください。
          </div>
        </div>
      </section>

      {/* 実際の使用シーン（リアル写真サムネ・案A帯デザイン） */}
      <section className="bg-white border-t border-slate-200 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5 md:px-8 space-y-10 md:space-y-14">
          <div className="text-center space-y-4 md:space-y-6">
            <div className="text-sm md:text-base text-[#538bb0] font-bold tracking-widest">
              IN ACTION
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              実際の使用シーン
            </h2>
            <p className="text-base md:text-xl text-slate-600 leading-loose max-w-2xl mx-auto">
              現場で「今、何番」が伝わる瞬間。<br className="hidden md:inline" />
              ４つの業種でのリアルな使われ方をご覧ください。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <SceneCard
              src={`${base}usecases/restaurant.png`}
              category="飲食店"
              headline="行列の「あと何組」が、手元で見える"
              alt="ラーメン店の行列に並ぶ人々と、手前のスマホに表示された「23組目／約50分」の順番待ち画面"
            />
            <SceneCard
              src={`${base}usecases/clinic.png`}
              category="クリニック"
              headline="待合室の番号が、車内・近隣からも分かる"
              alt="クリニックの待合室。壁掛けモニタに「診察中／お待ちの方」の番号一覧が表示され、患者が落ち着いて待機している"
            />
            <SceneCard
              src={`${base}usecases/government.png`}
              category="自治体窓口"
              headline="呼び出し番号を、ロビー全体にライブ表示"
              alt="自治体窓口のロビー。電子掲示板に「お呼び出し番号 105／お待ちの人数 23人」が大きく表示されている"
            />
            <SceneCard
              src={`${base}usecases/sports.png`}
              category="運動会・スポーツ"
              headline="進行プログラムを、保護者全員のスマホへ"
              alt="運動会の校庭で、手に持ったスマホに当日のプログラム一覧と進行状況がリアルタイムで表示されている"
            />
          </div>

          {/* カスタマイズ案内（簡略版・ATH LPへ誘導） */}
          <div className="bg-gradient-to-br from-[#0e2a47] to-[#3d6f94] text-white rounded-2xl p-6 md:p-10 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-8 items-center">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-white/15 text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-bold backdrop-blur-sm">
                  💡 上の写真は業種別カスタマイズ後のイメージです
                </div>
                <h3 className="text-xl md:text-3xl font-black leading-snug">
                  自社専用UIに、買い切り¥30,000〜でカスタム可能。
                </h3>
                <p className="text-sm md:text-base text-white/85 leading-loose">
                  クリニックの番号呼び出し画面、飲食店の順番待ちカウンター、自治体窓口の電子掲示板など、業種別UIへの開発受託を行っています。<strong className="text-white">月額¥0</strong>で運用可能、ソース所有（MITライセンス）。
                </p>
              </div>
              <a
                href="https://apptalenthub.co.jp/lp/liveboard-custom/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-white text-[#0e2a47] hover:bg-slate-100 px-6 md:px-8 py-4 md:py-5 rounded-xl font-bold text-base md:text-lg transition-colors text-center whitespace-nowrap"
              >
                料金・事例を見る →
              </a>
            </div>
          </div>
        </div>
      </section>

      <AthFooter />
    </div>
  )
}

function SceneCard({
  src,
  category,
  headline,
  alt,
}: {
  src: string
  category: string
  headline: string
  alt: string
}) {
  return (
    <figure className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      {/* 左上チップ：live-board ラベル */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
        <div className="text-[10px] md:text-xs font-bold text-[#538bb0] tracking-widest">
          LIVEBOARD
        </div>
      </div>
      {/* 下部濃紺帯：導入事例 / 業種 / 一文要約 */}
      <figcaption className="absolute bottom-0 left-0 right-0 bg-[#0e2a47]/95 backdrop-blur-sm text-white px-5 md:px-6 py-4 md:py-5">
        <div className="text-[11px] md:text-xs font-bold text-[#9bc4e2] tracking-widest mb-1">
          導入事例 ｜ {category}
        </div>
        <div className="text-base md:text-lg font-bold leading-snug">
          {headline}
        </div>
      </figcaption>
    </figure>
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
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-7 space-y-3 hover:border-[#538bb0] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-3xl md:text-4xl" aria-hidden="true">
          {emoji}
        </span>
        <div className="text-lg md:text-xl font-bold text-slate-900">{title}</div>
      </div>
      <div className="text-base md:text-lg text-slate-600 leading-loose">{body}</div>
    </div>
  )
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-7 md:p-9 space-y-3 hover:border-[#538bb0] hover:shadow-md transition-all">
      <div className="text-xl md:text-2xl font-bold text-slate-900">{title}</div>
      <div className="text-base md:text-lg text-slate-600 leading-loose">{body}</div>
    </div>
  )
}
