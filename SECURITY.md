# セキュリティ方針 — live-board

公開リポジトリ + クライアント中心アプリの設計上、何が外部から見えて何が見えないかを明確にし、誤って機密情報を含めない運用ルールを定める。

## 何が公開されているか

| 項目 | 公開範囲 | 補足 |
|---|---|---|
| ソースコード（React/TypeScript一式） | 🌐 全世界 | GitHub public repo |
| Firebase Web 設定（apiKey, projectId 等） | 🌐 全世界 | クライアントJSバンドルに埋め込み（**Firebase設計上の前提**。apiKey は秘密ではなくプロジェクト識別子）|
| Firestore `events/{eventId}` 単一取得 | 🌐 全世界 | eventIdを知っている前提でのみ |
| Firestore `events/{eventId}/programs` 一覧 | 🌐 全世界 | eventIdを知っている前提でのみ |
| Firestore `events` コレクション**一覧** | 🚫 拒否 | `firestore.rules` で `allow list: if false` |
| Google ログインユーザーの email / displayName | 🔒 本人のみ | Firebase Auth が管理、Firestoreには保存しない |
| ユーザーが入力した event title / location / description | 🌐 全世界 | publish=true かつ eventIdを知っている前提で誰でも閲覧可能 |

## 何が公開されていないか（確認済）

- ✅ `.env`（Firebase 設定の実体）は `.gitignore` で除外
- ✅ 過去コミット履歴にも `.env` / API キー / 認証情報 の漏洩なし
- ✅ サービスアカウント JSON / `.pem` / `.key` ファイル なし
- ✅ 個人住所 / 電話番号 / 本物のメール（個人Gmail以外） ソースに無し
- ✅ コミットメッセージにも機密情報なし

## コミット作者情報の公開について

| 項目 | 値 | 公開判断 |
|---|---|---|
| commit author name | `tsubasagit` | ✅ 公開OK（GitHubアカウント名・公開前提） |
| commit author email | `tsubasa.pc3@gmail.com` | ✅ 公開OK（GitHub登録メール＝コミット署名と一致、業務メールではない） |

ATH業務メール（`tsubasa.miyazaki@apptalenthub.co.jp`）でコミットしてはいけない。

## イベント所有者UIDの取扱い

- Event ID = `evt-<UID先頭12文字>`（例: `evt-Ky7RfnLkOnRS`）
- 単一event取得時に `ownerId`（完全UID）が JSON で返る
- **影響**: UID は Firebase Auth の識別子。単独では攻撃に使えないが個人特定の手がかりにはなりうる
- **緩和策**: list 禁止により外部スクレイピング不能 → 攻撃者は eventId を別経路で知る必要がある
- **将来検討**: UIDのハッシュをイベントIDに使う（互換性破壊・後方移行必要）

## GitHub 公開時の必須ルール

新規ファイルをコミットする前に以下を必ず確認すること。

### 🔴 絶対にコミットしてはいけないもの

| 種別 | 例 |
|---|---|
| 環境変数ファイル | `.env`, `.env.local`, `.env.production` |
| 認証ファイル | `*.pem`, `*.key`, `*.p12`, `service-account-*.json`, `firebase-adminsdk-*.json` |
| 個人情報 | 実在の住所・電話番号・本物のメールアドレス |
| ATH業務メール | `*@apptalenthub.co.jp` をハードコード（コミット作者にも使わない） |
| Firebase Functions secrets | `firebase functions:secrets:set` で管理する値 |
| API トークン | GitHub PAT、Slack token、その他SaaS APIキー |
| 顧客データ | 学校名・顧客企業名・実在の固有名詞（テスト用ダミーを使う） |

### 🟢 コミットしてOK（公開前提で設計されたもの）

| 種別 | 理由 |
|---|---|
| `.env.example`（値が空のテンプレート） | セットアップ手順用 |
| `firebase.json`, `.firebaserc` | プロジェクトID は秘密ではない |
| `firestore.rules` | セキュリティ層なので公開前提 |
| Firebase Web Config（apiKey含む）が**ビルド成果物に埋め込まれる** | Firebase 設計上の前提（gh-pages の `dist/` 配信時） |

### コミット前チェックリスト

```bash
# 1. 何が staged されているか確認
git status
git diff --staged

# 2. 機密パターンを最終スキャン（コミット前に必ず実行）
git diff --staged | grep -E "AIza[0-9A-Za-z_-]{30,}|ghp_[0-9A-Za-z]{30,}|sk-[a-zA-Z0-9]{20,}|password\s*=|secret\s*=|@apptalenthub\.co\.jp|東京都[一-龯]+市[0-9]"

# 3. 何か出てきたら止める。0件なら commit OK
```

### 自動化（推奨・未導入）

将来的に以下を導入する:
- pre-commit hook: 上記の grep を自動実行（[hookify](https://github.com/...) または `.git/hooks/pre-commit`）
- GitHub Actions: Secret Scanning（Push後検知）
- truffleHog / gitleaks による履歴定期スキャン

## Firestore ルール監査

`firestore.rules` を変更したら必ず:

1. ローカルで挙動を想定（誰が何を読み書きできるか）
2. `firebase deploy --only firestore:rules` で本番反映
3. REST APIで匿名アクセス確認:
   ```bash
   # 一覧禁止確認
   curl -s "https://firestore.googleapis.com/v1/projects/school-live-board/databases/(default)/documents/events" | grep -E "PERMISSION_DENIED|error"
   ```
4. 想定外に取得できる場合はルールを修正

## インシデント対応

万一機密情報をコミットしてしまった場合:

1. **すぐに該当キー/トークンを失効させる**（Firebase Console / GCP IAM 等）
2. `git rm` + コミット では履歴に残るため、`git filter-repo` または BFG Repo-Cleaner で履歴から完全削除
3. `git push --force` で履歴を書き換え（mainブランチのみ・予告なしで他人を巻き込まない）
4. GitHub の Security tab で alert を確認

## 関連ドキュメント

- [firestore.rules](./firestore.rules) — セキュリティルール本体
- [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md) — Firebase セットアップ手順
- [CLAUDE.md](./CLAUDE.md) — 技術メモ
