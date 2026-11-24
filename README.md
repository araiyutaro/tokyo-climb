# Tokyo Climb

東京都内および近郊の主要ボルダリングジム（31店舗）の **リアルタイム営業時間・ホールド替え休業・一部壁制限・イベント情報** を一箇所で確認できるスケジュール集約Webアプリです。

## 主な機能

- **今日・営業一覧ビュー**
  - JST基準のリアルタイム営業判定（`営業中` / `まもなく閉店` / `まもなく開店` / `営業時間外` / `定休日` / `ホールド替え休業` / `臨時休業`）
  - 日本の祝日自動判定（`@holiday-jp/holiday_jp`）、曜日別営業時間、深夜跨ぎ（26:00など）、会員24時間・無人営業注記に対応
  - お気に入りジムの上部ピン留め（`localStorage` 保存・ログイン不要）
  - エリア・検索・今開いている・休業除外フィルタ、直近1ヶ月以内のホールド替え予告
  - 各ジムの公式サイト・Instagram・X・Googleマップへのワンタップ導線
- **月間横断カレンダービュー**
  - 全店舗のホールド替え・臨時休業・時短営業・コンペ／イベントを色分け表示
  - エリア・種別・お気に入りのみの絞り込み＋選択日詳細パネル＋月間時系列リスト
- **公式Web自動収集パイプライン**
  - RSS / Atom / HTMLお知らせ / **NOBOROCK専用カレンダー（当月＋翌月）**の定期取得＋日本語日付・ホールド替え分類パーサー
  - `GEMINI_API_KEY` を設定すると、曖昧な告知文やカレンダー画像の Gemini 抽出も有効化（未設定時はルールベースのみで動作）
  - GitHub Actions による6時間ごとの自動データ更新（`.github/workflows/collect-schedules.yml`）
- **SNS・カレンダー予定 簡易取込ツール (`/import`)**
  - Instagram / X の投稿文を貼り付けるだけで日時・ホールド替え種別を自動抽出し、ワンクリックで `data/overrides.json` に登録（カレンダー画像のGemini Vision抽出・JSONコピーにも対応）
- **PWA＆公開対応**
  - Web App Manifest・Apple Touch Icon・OGP画像を完備し、スマホのホーム画面に追加してアプリのように起動可能

## 開発・実行コマンド

```bash
# 開発サーバー起動
npm run dev

# テスト実行 (Vitest)
npm test

# 型チェック
npm run typecheck

# 本番ビルド
npm run build

# 各ジム公式サイトから最新スケジュールを自動収集
npm run collect
```

## SNS告知や手動情報の追加方法

Instagramストーリーや店頭告知など、Webから自動取得できない情報は `data/overrides.json` の `events` 配列に追記することで即座に反映されます（同一 `id` があれば自動収集データより優先されます）。

## 公開（Vercel デプロイ手順）

データベース不要の構成のため、無料枠（Hobby プラン）ですぐに一般公開できます。

1. [Vercel](https://vercel.com/new) に GitHub アカウントでログインし、`araiyutaro/tokyo-climb` を Import
2. Framework Preset が **Next.js** になっていることを確認してそのまま **Deploy**（環境変数なしで動作します）
3. （任意）GitHub リポジトリの `Settings > Secrets and variables > Actions` に `GEMINI_API_KEY` を設定すると、6時間ごとの自動収集時に曖昧な告知文のAI抽出も有効になります
4. GitHub Actions（`.github/workflows/collect-schedules.yml`）が6時間ごとに `data/events.json` を自動更新・コミットし、差分があれば Vercel が自動で再デプロイします
