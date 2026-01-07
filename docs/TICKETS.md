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

### ✅ TICKET-002: ゲーム設定ファイル作成
**Priority**: High
**Status**: Completed
**Estimate**: 1.5h
**Description**: ゲーム全体の設定を管理する設定ファイルを作成
- [x] `src/config/GameConfig.ts`を作成
- [x] デバイス検出機能（モバイル/デスクトップ）
- [x] フィールドサイズ設定（30×15、全デバイス共通）
- [x] タイルサイズ設定（デバイス別に自動調整）
- [x] プレイヤー初期ステータス
- [x] AI数・初期ステータス
- [x] フィールド縮小設定

### ✅ TICKET-003: マップ生成システム
**Priority**: High
**Status**: Completed
**Estimate**: 3h
**Description**: ゲームマップの生成・管理システムを実装
- [x] `src/map/GameMap.ts`作成
- [x] タイルの種類定義（空白、壁、破壊可能な壁）
- [x] マップ生成アルゴリズム
  - [x] 外周壁の生成
  - [x] 格子状の固定壁配置
  - [x] ランダムな破壊可能壁配置（40%）
  - [x] 初期位置周辺の安全地帯確保
- [x] タイル座標 ↔ ピクセル座標変換
- [x] 衝突判定用のマップデータ管理

### ✅ TICKET-004: 基本レンダリング
**Priority**: High
**Status**: Completed
**Estimate**: 2.5h
**Description**: マップとゲームオブジェクトの描画
- [x] Phaserシーン（GameScene）作成
- [x] レスポンシブ対応（画面サイズに応じた自動スケーリング）
- [x] タイルの描画（仮グラフィック使用）
- [x] カメラ設定（デフォルト）
- [x] グリッド表示（デバッグ用）

### ✅ TICKET-005: プレイヤーキャラクター実装
**Priority**: High
**Status**: Completed
**Estimate**: 3h
**Description**: プレイヤーの基本機能を実装
- [x] `src/entities/Player.ts`作成
- [x] プレイヤースプライト作成（ボンバーマン風の白い丸型キャラクター）
- [x] キーボード入力処理（矢印キー、WASD）
- [x] 移動処理（8方向移動、速度正規化）
- [x] 壁との衝突判定（X/Y独立処理で斜め移動時のハマり防止）
- [x] Arcade Physics統合
- [x] バーチャルジョイスティック対応（モバイル）

### ✅ TICKET-006: 爆弾システム実装
**Priority**: High
**Status**: Completed
**Estimate**: 4h
**Description**: 爆弾の設置・爆発機能を実装
- [x] `src/entities/Bomb.ts`作成
- [x] `src/entities/Explosion.ts`作成
- [x] 爆弾設置処理（スペースキー）
- [x] 3秒タイマー実装
- [x] 爆発アニメーション（パルス＆フリッカー）
- [x] 十字方向の爆風生成
- [x] 爆風の壁による遮断
- [x] 爆弾の誘爆処理
- [x] 同時設置数制限

### ✅ TICKET-007: 破壊システム
**Priority**: High
**Status**: Completed
**Estimate**: 2h
**Description**: 爆風による破壊処理
- [x] 破壊可能な壁の破壊処理
- [x] マップデータの更新
- [x] 破壊エフェクト（壁が消えて空白になる）
- [x] プレイヤー死亡判定（爆発範囲チェック）
- [x] ゲームオーバー画面表示
- [x] リトライ機能（スペースキー/タップ）

---

## Phase 3: AI実装

### ✅ TICKET-008: 敵キャラクター基本実装
**Priority**: High
**Status**: Completed
**Estimate**: 2h
**Description**: 敵キャラクターの基本機能
- [x] `src/entities/Enemy.ts`作成
- [x] 敵スプライト作成（赤いモンスター風キャラクター）
- [x] 初期配置（マップ右上、左下、右下の3箇所）
- [x] 移動処理（ランダム方向、壁回避）
- [x] 死亡処理（爆発に巻き込まれると消滅）
- [x] 勝利判定（全敵撃破でYOU WIN!表示）

### ✅ TICKET-009: シンプルAI実装
**Priority**: High
**Status**: Completed
**Estimate**: 3h
**Description**: 基本的なAI行動ロジック
- [x] `src/ai/SimpleAI.ts`作成
- [x] 状態ベースのAI（ROAMING/CHASING/FLEEING）
- [x] プレイヤー追跡ロジック
- [x] 移動可能方向の判定
- [x] 戦略的な爆弾設置（プレイヤーが爆発範囲内にいる時）
- [x] 壁との衝突回避
- [x] 爆弾・爆発範囲からの逃避
- [x] 安全経路の計算

**Note**: モバイル対応チケット（TICKET-009-1〜009-3）をPhase 3.5として追加

---

## Phase 3.5: モバイル対応

### ✅ TICKET-009-1: 仮想コントローラー実装
**Priority**: High
**Status**: Completed
**Estimate**: 3h
**Description**: モバイル用のバーチャルジョイスティック
- [x] `src/ui/VirtualJoystick.ts`作成
- [x] バーチャルジョイスティック（画面左半分）
  - [x] タッチ位置にジョイスティック出現
  - [x] スライドで方向指定（アナログ入力）
  - [x] タッチイベント処理
  - [x] 視覚フィードバック
  - [x] 半透明スタイル
- [ ] 爆弾ボタン（画面右下）※TICKET-006で実装予定
- [x] デスクトップでは非表示

### ✅ TICKET-009-2: タッチ操作統合
**Priority**: High
**Status**: Completed
**Estimate**: 2h
**Description**: タッチ操作とゲームロジックの統合
- [x] バーチャルジョイスティックからの入力をゲームに反映
- [ ] マルチタッチ対応（移動と爆弾設置を同時）※TICKET-006で実装予定
- [x] タッチ入力とキーボード入力の共存
- [x] 誤タッチ防止処理（左半分のみジョイスティック反応）

### TICKET-009-3: モバイル最適化
**Priority**: Medium
**Status**: Todo
**Estimate**: 2h
**Description**: モバイルデバイス向けの最適化
- [ ] パフォーマンス最適化（30fps以上維持）
- [ ] バッテリー消費削減
- [ ] エフェクトの軽量化（モバイルのみ）
- [ ] メモリ使用量削減

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
