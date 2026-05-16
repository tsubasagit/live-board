# CLAUDE.md — school-live-board

## Overview

学校の運動会・文化祭で「今どのプログラムが進行中か」を全端末リアルタイム同期で大画面表示するアプリ。
[tsubasagit/yakyuu-hito](https://github.com/tsubasagit/yakyuu-hito) から構造（操作画面 / 表示画面分離・Zustand状態管理）を流用し、同期レイヤを Firebase Firestore `onSnapshot` に差し替えることで複数端末同時表示を実現する。

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- Zustand（状態管理）
- Firebase Firestore（リアルタイム同期）
- `qrcode` ライブラリ（視聴者誘導用QR）
- GitHub Pages（ホスティング）

## Directory Structure

（プロジェクト初期化後に更新）

## Development

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # 本番ビルド
npm run deploy # GitHub Pages へデプロイ（後日設定）
```

## 構成

- `/` — ホーム（control / display へのリンク・QR表示）
- `/#/control` — 運営者操作画面（PIN認証）
- `/#/display` — 表示画面（透明背景不要・フルスクリーン）

## Rules

- TypeScript を使用する
- コンポーネントは PascalCase
- 日本語UIテキスト
- 表示画面は **フォントサイズ大・高コントラスト**（後方席・直射日光下での視認性優先）
- 同期は必ず Firestore 経由（BroadcastChannel は使わない＝端末をまたぐ要件のため）
- Firebase 設定キーはクライアントに露出する前提 → セキュリティルール側で防御
- write は `events/{eventId}` の `pinHash` を経由した認証チェック（Firestore Functions or rules）

## Firebase 設計メモ

- プロジェクトID: 未確定（`new-project` 完了後に Firebase コンソールで作成）
- 課金プラン: Spark（無料）でスタート
- セキュリティルール基本方針:
  - `events/{eventId}` の read は全員許可
  - write は PINハッシュ照合 or 運営者カスタムクレーム必須
  - 詳細は `firestore.rules` 参照

## リポジトリ

- origin: https://github.com/tsubasagit/school-live-board
- 派生元: https://github.com/tsubasagit/yakyuu-hito

## 仕様書

詳細は `SERVICE_SPEC.md` を参照。
