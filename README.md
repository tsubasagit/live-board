<p align="center">
  <img src="./docs/screenshots/liveboard-logo.png" alt="LiveBoard" width="520" />
</p>

# live-board

「いま何番／何が進行中か」を全端末リアルタイム同期で大画面表示するアプリ。

会場の大型スクリーン・受付モニタ・来場者のスマホが、全員同じ画面を見られる。

公開URL: **https://tsubasagit.github.io/live-board/**

## 紹介動画

▶️ **[LiveBoard 紹介動画を見る（54秒・mp4）](https://tsubasagit.github.io/live-board/videos/liveboard-intro.mp4)**

※ イメージです。動画は生成AIで作成したもので、実際の表示画面のようにするにはカスタマイズが必要です。

## 使える場面

<p align="center">
  <img src="./docs/screenshots/use-cases-9.png" alt="使える場面 — 9シーン" width="600" />
</p>

- 🏃 運動会・体育祭・文化祭（保護者・別教室にスマホで進行共有）
- 💊 薬局の処方待ち（「ただいま◯番」を待合とスマホに同時表示）
- 🍜 飲食店・カフェの順番待ち（QRで「あと何組」が見える）
- 💇 美容室・歯科クリニックの呼び出し
- 💍 結婚式・パーティの進行表（司会・親族・ゲスト共有）
- 🏘 町内会・PTA・お祭りのステージ進行
- 🎤 セミナー・社内総会のアジェンダ進捗

## スクリーンショット

### 表示画面（来場者向け・大画面）
タイトル/場所/概要をヘッダーに、現在進行中のプログラムを中央に大きく表示。右側にプログラム一覧（現在地ハイライト・完了は打消し線）。運営者が「次へ」を押した瞬間、全端末で同時に切り替わる。

![表示画面 — プログラム1進行中](./docs/screenshots/display-program1.png)

![表示画面 — プログラム2へ切替](./docs/screenshots/display-program2.png)

### 操作画面（運営者向け）
上段の「表示画面のレイアウト」で大画面側の見せ方をリアルタイム制御（イベント情報・プログラム一覧の表示/非表示）。下にイベント設定、進行コントロール（前へ/次へ）、プログラム一覧、CSV一括登録、危険な操作（イベント削除）まで1画面に集約。

![操作画面](./docs/screenshots/control.png)

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- Zustand
- Firebase Firestore
- GitHub Pages

## 構成

| 画面 | パス | 対象 |
|---|---|---|
| ホーム | `/` | 全員（QR・リンク表示） |
| 操作画面 | `/#/control` | 運営者（PIN認証） |
| 表示画面 | `/#/display` | 視聴者（フルスクリーン） |

## 開発

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # 本番ビルド
```

## ドキュメント

- 仕様: [SERVICE_SPEC.md](./SERVICE_SPEC.md)
- 技術メモ: [CLAUDE.md](./CLAUDE.md)
- Firebase セットアップ: [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md)
- セキュリティ方針 + コミット前チェックリスト: [SECURITY.md](./SECURITY.md)

## カスタマイズ開発・受託

LiveBoard は **標準UI のまま無料**で利用可能です（MITライセンス）。

業種別UI（クリニックの番号呼び出し・飲食店の順番待ち・自治体窓口の電子掲示板など）への**カスタマイズ開発**は、AppTalentHub にて **¥30,000〜** で承っています。月額ランニング ¥0、ソースコードはお客様所有。

### 👉 料金プラン・事例・3年総額比較

**[apptalenthub.co.jp/lp/liveboard-custom/](https://apptalenthub.co.jp/lp/liveboard-custom/)** で詳しくご案内しています。

- 3プラン（ライト ¥30,000 〜 / スタンダード ¥100,000 〜 / フル ¥500,000 〜）
- 既存SaaSとの3年総額比較（最大 約60万円削減）
- 業種別カスタマイズ事例
- 無料相談・お見積もりフォーム

ご自身で改修されたい方は、本リポジトリを fork して自由にお使いください（MITライセンス）。

## License

MIT
