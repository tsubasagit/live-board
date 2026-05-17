# school-live-board

学校の運動会・文化祭で「今どのプログラムが進行中か」を全端末リアルタイム同期で大画面表示するアプリ。

体育館の大型スクリーン・各教室モニタ・来場した保護者のスマホが、全員同じ画面を見られる。

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

## License

MIT
