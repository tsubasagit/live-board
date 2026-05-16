# Firebase セットアップ手順

school-live-board を動かすための Firebase プロジェクト作成と `.env.local` 設定の手順。

## 0. 前提

- Google アカウントで Firebase コンソールにログイン可能
- ATH の Firebase 請求先は **「マスター3」アカウント** に統合済み（2026-04-19）。新規プロジェクトも同アカウントに紐付ける
- Spark（無料）プランで開始。運動会1日 + 視聴者500端末程度なら無料枠で完結する想定

## 1. Firebase プロジェクトを作成

### コンソール経由（推奨・初回向け）

1. https://console.firebase.google.com/ を開く
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `school-live-board`（または `school-live-board-prod` 等）
   - プロジェクトIDは自動生成（例: `school-live-board-12345`）。後で `.env.local` の `VITE_FIREBASE_PROJECT_ID` に入れる
4. Google アナリティクス: **無効** で OK（学校行事用なので不要）
5. 「プロジェクトを作成」→ 完了まで30秒ほど待つ

### CLI 経由（2件目以降向け）

```bash
npm install -g firebase-tools
firebase login
firebase projects:create school-live-board-prod --display-name "school-live-board"
```

## 2. Firestore Database を有効化

1. 左メニュー「ビルド」→「Firestore Database」
2. 「データベースの作成」をクリック
3. **本番環境モードで開始**を選択（テストモードは30日で全公開になるため使わない）
4. ロケーション: **`asia-northeast1`（東京）** を選択
   - 国内利用なら東京リージョンがレイテンシ最小
5. 「有効にする」→ 完了

## 3. Web アプリを登録して設定キーを取得

1. プロジェクト設定（左上の歯車）→「全般」タブ
2. 「マイアプリ」セクションで `</>` Web アイコンをクリック
3. アプリのニックネーム: `school-live-board-web`
4. **Firebase Hosting は設定しない**（GitHub Pages を使うため）
5. 「アプリを登録」→ 設定オブジェクトが表示される

表示される設定はこんな形：

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "school-live-board-12345.firebaseapp.com",
  projectId: "school-live-board-12345",
  storageBucket: "school-live-board-12345.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc..."
}
```

この値を次のステップで `.env.local` にコピーする。

## 4. `.env.local` を作成

プロジェクトルート（`package.json` がある場所）に `.env.local` を作成：

```bash
cp .env.example .env.local
```

`.env.local` を開いて、Firebase コンソールから取得した値で埋める：

```dotenv
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=school-live-board-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=school-live-board-12345
VITE_FIREBASE_STORAGE_BUCKET=school-live-board-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc...
VITE_DEFAULT_EVENT_ID=demo-event
```

### `.env.local` の取り扱い

- `.gitignore` で除外済み → コミットされない
- `apiKey` はクライアントに露出する前提で設計されているため、**Web SDK の apiKey は秘密ではない**。セキュリティは `firestore.rules` で担保する
- ただし `.env.local` 自体は誤コミット防止のため絶対に git に入れない

## 5. Firestore セキュリティルールをデプロイ

リポジトリ同梱の `firestore.rules` を Firebase 側に適用する。

### CLI でデプロイ

```bash
npm install -g firebase-tools   # 未インストールの場合のみ
firebase login                   # 未ログインの場合のみ
firebase use --add               # プロジェクトを選択（school-live-board-12345）
firebase deploy --only firestore:rules
```

初回は `.firebaserc` と `firebase.json` の作成を求められる。最小構成：

`.firebaserc`:
```json
{ "projects": { "default": "school-live-board-12345" } }
```

`firebase.json`:
```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### コンソールから貼り付けでもOK

1. Firestore Database →「ルール」タブ
2. リポジトリの `firestore.rules` の中身をそのまま貼り付け
3. 「公開」をクリック

## 6. 動作確認

```bash
npm run dev
```

ブラウザで http://localhost:5173 を開く：

1. ホーム画面に「⚠️ Firebase 設定が読み込まれていません」が **表示されないこと**
2. 「🎛 操作画面」→ イベント設定保存 → プログラムを1件追加
3. 別タブで「📺 表示画面」を開く → 追加したプログラムを「ここに移動」→ 両タブが同じ表示に切り替わる
4. スマホで同じ URL の `#/display?event=demo-event` を開いてもPC操作と同期して切り替わる

## 7. デプロイ前の必須対応

現状の `firestore.rules` は **誰でも write 可** の状態（`allow write: if true`）。
パイロット公開前に以下のどちらかに差し替える：

| 方式 | 説明 |
|---|---|
| 運営者PIN（推奨） | `events/{eventId}` に `pinHash` を保存し、書き込み時に Cloud Functions で照合 |
| Firebase Auth (匿名 + Custom Claims) | 運営者だけにカスタムクレーム付与、ルール側で `request.auth.token.admin == true` を要求 |

詳細は `SERVICE_SPEC.md` セクション7（ビジネスルール）参照。

## トラブルシューティング

### `Firebase 設定が未読み込みです` エラー
- `.env.local` の `VITE_FIREBASE_PROJECT_ID` が空。Firebase コンソールから再取得
- `npm run dev` を一度止めて再起動（Vite は起動時に環境変数を読む）

### `Missing or insufficient permissions.` エラー
- セキュリティルールがデプロイされていない → 手順 5 を再実行
- コレクション名がコードとルールでズレていないか確認

### 同期が反映されない
- ブラウザのコンソールに `WebChannelConnection` の警告が出ていないか確認
- 学校の Wi-Fi が `*.firestore.googleapis.com` をブロックしていないか
- 開発環境では Chrome の「Service Worker を更新時に新規」のチェックを外す

## 関連

- `firestore.rules` — セキュリティルール本体
- `src/lib/firebase.ts` — Firebase SDK 初期化
- `src/lib/sync.ts` — `onSnapshot` 購読と書き込みAPI
- ATH 共通: 請求先は「マスター3」アカウントに統合（2026-04-19 以降）
