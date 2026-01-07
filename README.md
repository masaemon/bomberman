# Bomberman Game

ブラウザで動作する2Dボンバーマンゲーム（TypeScript + Phaser）

## 🎮 遊び方

プレイヤーを操作して爆弾を設置し、AIを倒すゲームです。

**デスクトップ:**
- **移動**: 矢印キー または WASD
- **爆弾設置**: スペースキー

**モバイル:**
- **移動**: 仮想十字キー（画面左下）
- **爆弾設置**: 爆弾ボタン（画面右下）

## 🚀 デプロイ

このプロジェクトはGitHub Pagesで自動デプロイされます。

**デプロイURL**: https://masaemon.github.io/bomberman/

mainブランチにプッシュすると自動的にビルド＆デプロイされます。

## 🛠️ 開発

### セットアップ
```bash
npm install
```

### 開発サーバー起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

## 📚 ドキュメント

- [仕様書](docs/SPECIFICATION.md)
- [開発チケット](docs/TICKETS.md)
- [AI開発コンテキスト](CLAUDE.md)

## 🎯 主な機能

- シングルプレイヤー（1 vs AI 3体）
- カスタマイズ可能なフィールドサイズ（デフォルト: 30×15）
- パワーアップアイテム（爆弾数、爆風範囲、移動速度）
- フィールド縮小機能（60秒後から開始）
- レスポンシブ対応（PC・スマホ両対応）
- タッチ操作対応（仮想コントローラー）

## 🔧 技術スタック

- TypeScript
- Vite
- Phaser 3