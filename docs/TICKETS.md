# Development Tickets

## Phase 1: プロジェクトセットアップ

### ✅ TICKET-001: プロジェクト初期化
**Priority**: High
**Status**: Completed
**Description**: TypeScript + Vite + Phaser環境のセットアップ
- [x] package.json作成
- [x] tsconfig.json設定
- [x] index.html作成
- [x] 基本プロジェクト構造作成

---

## Phase 2: コア機能実装

### TICKET-002: ゲーム設定ファイル作成
**Priority**: High
**Status**: Todo
**Estimate**: 1h
**Description**: ゲーム全体の設定を管理する設定ファイルを作成
- [ ] `src/config/GameConfig.ts`を作成
- [ ] フィールドサイズ設定（デフォルト30×15）
- [ ] タイルサイズ設定
- [ ] プレイヤー初期ステータス
- [ ] AI数・初期ステータス
- [ ] フィールド縮小設定

### TICKET-003: マップ生成システム
**Priority**: High
**Status**: Todo
**Estimate**: 3h
**Description**: ゲームマップの生成・管理システムを実装
- [ ] `src/map/Map.ts`作成
- [ ] タイルの種類定義（空白、壁、破壊可能な壁）
- [ ] マップ生成アルゴリズム
  - [ ] 外周壁の生成
  - [ ] 格子状の固定壁配置
  - [ ] ランダムな破壊可能壁配置（40%）
  - [ ] 初期位置周辺の安全地帯確保
- [ ] タイル座標 ↔ ピクセル座標変換
- [ ] 衝突判定用のマップデータ管理

### TICKET-004: 基本レンダリング
**Priority**: High
**Status**: Todo
**Estimate**: 2h
**Description**: マップとゲームオブジェクトの描画
- [ ] Phaserシーン（GameScene）作成
- [ ] タイルの描画（仮グラフィック使用）
- [ ] カメラ設定
- [ ] グリッド表示（デバッグ用）

### TICKET-005: プレイヤーキャラクター実装
**Priority**: High
**Status**: Todo
**Estimate**: 3h
**Description**: プレイヤーの基本機能を実装
- [ ] `src/entities/Player.ts`作成
- [ ] プレイヤースプライト作成
- [ ] キーボード入力処理（矢印キー、WASD）
- [ ] 移動処理
- [ ] 壁との衝突判定
- [ ] グリッドにスナップする移動

### TICKET-006: 爆弾システム実装
**Priority**: High
**Status**: Todo
**Estimate**: 4h
**Description**: 爆弾の設置・爆発機能を実装
- [ ] `src/entities/Bomb.ts`作成
- [ ] `src/entities/Explosion.ts`作成
- [ ] 爆弾設置処理（スペースキー）
- [ ] 3秒タイマー実装
- [ ] 爆発アニメーション
- [ ] 十字方向の爆風生成
- [ ] 爆風の壁による遮断
- [ ] 爆弾の誘爆処理
- [ ] 同時設置数制限

### TICKET-007: 破壊システム
**Priority**: High
**Status**: Todo
**Estimate**: 2h
**Description**: 爆風による破壊処理
- [ ] 破壊可能な壁の破壊処理
- [ ] マップデータの更新
- [ ] 破壊エフェクト
- [ ] プレイヤー・敵の死亡判定

---

## Phase 3: AI実装

### TICKET-008: 敵キャラクター基本実装
**Priority**: High
**Status**: Todo
**Estimate**: 2h
**Description**: 敵キャラクターの基本機能
- [ ] `src/entities/Enemy.ts`作成
- [ ] 敵スプライト作成
- [ ] 初期配置（マップ四隅から3箇所選択）
- [ ] 移動処理
- [ ] 死亡処理

### TICKET-009: シンプルAI実装
**Priority**: High
**Status**: Todo
**Estimate**: 3h
**Description**: 基本的なAI行動ロジック
- [ ] `src/ai/SimpleAI.ts`作成
- [ ] ランダム移動ロジック
- [ ] 移動可能方向の判定
- [ ] 爆弾設置（10%/秒の確率）
- [ ] 壁との衝突回避

---

## Phase 4: パワーアップ・追加機能

### TICKET-010: パワーアップシステム
**Priority**: Medium
**Status**: Todo
**Estimate**: 3h
**Description**: パワーアップアイテムの実装
- [ ] `src/entities/PowerUp.ts`作成
- [ ] アイテム種類の定義
  - [ ] 爆弾数増加
  - [ ] 爆風範囲拡大
  - [ ] 移動速度アップ
- [ ] 壁破壊時のランダム出現（30%確率）
- [ ] アイテム取得処理
- [ ] ステータス反映

### TICKET-011: フィールド縮小機能
**Priority**: Medium
**Status**: Todo
**Estimate**: 4h
**Description**: 時間経過によるフィールド縮小
- [ ] `src/utils/FieldShrink.ts`作成
- [ ] 60秒タイマー
- [ ] 15秒ごとの縮小処理
- [ ] 縮小エリアの可視化（赤色表示）
- [ ] 縮小エリアの死亡判定
- [ ] カウントダウン表示
- [ ] 警告表示（5秒前）

### TICKET-012: ゲームフロー実装
**Priority**: High
**Status**: Todo
**Estimate**: 2h
**Description**: 勝利・敗北判定とゲームフロー
- [ ] 勝利条件チェック（全敵撃破）
- [ ] 敗北条件チェック（プレイヤー死亡）
- [ ] ゲームオーバー処理
- [ ] リザルト画面表示
- [ ] リトライ機能

---

## Phase 5: UI・UX改善

### TICKET-013: HUD実装
**Priority**: Medium
**Status**: Todo
**Estimate**: 2h
**Description**: ゲーム中の情報表示
- [ ] 残り敵数表示
- [ ] 経過時間表示
- [ ] フィールド縮小カウントダウン
- [ ] プレイヤーステータス表示
  - [ ] 爆弾数
  - [ ] 爆風範囲
  - [ ] 移動速度

### TICKET-014: メニュー・設定画面
**Priority**: Low
**Status**: Todo
**Estimate**: 3h
**Description**: タイトル画面と設定
- [ ] タイトルシーン作成
- [ ] スタートボタン
- [ ] 設定画面
  - [ ] フィールドサイズ変更
  - [ ] AI数変更
  - [ ] 難易度設定

### TICKET-015: エフェクト・アニメーション
**Priority**: Low
**Status**: Todo
**Estimate**: 3h
**Description**: 視覚効果の追加
- [ ] 爆発アニメーション改善
- [ ] キャラクター歩行アニメーション
- [ ] パーティクルエフェクト
- [ ] 死亡エフェクト
- [ ] パワーアップエフェクト

### TICKET-016: サウンド実装
**Priority**: Low
**Status**: Todo
**Estimate**: 2h
**Description**: 効果音・BGMの追加
- [ ] 爆弾設置音
- [ ] 爆発音
- [ ] アイテム取得音
- [ ] 勝利/敗北音
- [ ] BGM（オプション）

---

## Phase 6: 改善・最適化

### TICKET-017: AI改良
**Priority**: Low
**Status**: Todo
**Estimate**: 4h
**Description**: AIをより戦略的に
- [ ] 自爆回避ロジック
- [ ] プレイヤー追跡
- [ ] 安全な場所への移動
- [ ] 壁破壊の優先度判定

### TICKET-018: パフォーマンス最適化
**Priority**: Medium
**Status**: Todo
**Estimate**: 2h
**Description**: ゲームのパフォーマンス改善
- [ ] オブジェクトプーリング
- [ ] 不要なレンダリングの削減
- [ ] メモリリーク対策
- [ ] FPS安定化

### TICKET-019: バランス調整
**Priority**: Medium
**Status**: Todo
**Estimate**: 2h
**Description**: ゲームバランスの調整
- [ ] プレイテスト実施
- [ ] AI強さ調整
- [ ] パワーアップ出現率調整
- [ ] フィールド縮小タイミング調整

---

## 優先順位別サマリー

### High Priority (Phase 2-3)
必須機能。これがないとゲームとして成立しない
- TICKET-002 ~ TICKET-009

### Medium Priority (Phase 4-6)
ゲームを面白くする重要な機能
- TICKET-010, TICKET-011, TICKET-012, TICKET-013, TICKET-018, TICKET-019

### Low Priority (Phase 5)
あると良い追加機能
- TICKET-014, TICKET-015, TICKET-016, TICKET-017
