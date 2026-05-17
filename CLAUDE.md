# CLAUDE.md — live-board

## Overview

「いま何番／何が進行中か」を全端末リアルタイム同期で大画面表示するアプリ。学校行事（運動会・文化祭）から薬局・店舗の順番待ち、結婚式の進行表まで横展開を狙う。
操作画面 / 表示画面を分離（Zustand 状態管理）し、Firebase Firestore `onSnapshot` を同期レイヤとして使うことで複数端末同時表示を実現する。

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
- 同期は必ず Firestore 経由（端末をまたぐ要件のため）
- Firebase 設定キーはクライアントに露出する前提 → セキュリティルール側で防御
- write は `events/{eventId}` の `pinHash` を経由した認証チェック（Firestore Functions or rules）

## Firebase 設計メモ

- プロジェクトID: `school-live-board`（Firebase仕様でプロジェクトIDは変更不可。表示名のみ「live-board」に変更可）
- 課金プラン: Spark（無料）でスタート
- セキュリティルール基本方針:
  - `events/{eventId}` の read は全員許可
  - write は `events.ownerId == request.auth.uid` の本人のみ（Google Sign-in）
  - 詳細は `firestore.rules` 参照
- **セットアップ手順**: [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md)

## リポジトリ

- origin: https://github.com/tsubasagit/live-board（旧 school-live-board）

## 仕様書

詳細は `SERVICE_SPEC.md` を参照。
