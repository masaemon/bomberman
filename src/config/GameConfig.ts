/**
 * ゲーム全体の設定を管理
 */

// タイルの種類
export enum TileType {
  EMPTY = 0,
  WALL = 1,           // 破壊不可能な壁
  BREAKABLE_WALL = 2, // 破壊可能な壁
}

// デバイス検出
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window);
};

// マップ設定
export const MAP_CONFIG = {
  WIDTH: 30,  // マス数（横）
  HEIGHT: 15, // マス数（縦）
  BREAKABLE_WALL_RATIO: 0.4, // 破壊可能な壁の割合
  SAFE_ZONE_RADIUS: 2, // 初期位置周辺の安全地帯（マス数）
};

// タイルサイズ（ピクセル）- デバイスに応じて自動調整
export const getTileSize = (): number => {
  if (isMobile()) {
    // モバイル: 画面サイズに合わせて計算
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.7; // UIスペースを確保

    const tileWidth = Math.floor(maxWidth / MAP_CONFIG.WIDTH);
    const tileHeight = Math.floor(maxHeight / MAP_CONFIG.HEIGHT);

    return Math.min(tileWidth, tileHeight, 32); // 最大32px
  }

  // デスクトップ
  return 32;
};

// HUD設定
export const HUD_CONFIG = {
  HEIGHT: 40, // HUDの高さ（ピクセル）
};

// ゲーム画面サイズ
export const getGameSize = () => {
  const tileSize = getTileSize();
  return {
    width: MAP_CONFIG.WIDTH * tileSize,
    height: MAP_CONFIG.HEIGHT * tileSize + HUD_CONFIG.HEIGHT, // HUD分を追加
  };
};

// マップ開始位置（HUDの下から）
export const getMapOffset = () => {
  return {
    x: 0,
    y: HUD_CONFIG.HEIGHT,
  };
};

// プレイヤー設定
export const PLAYER_CONFIG = {
  INITIAL_SPEED: 150,      // 初期移動速度（px/秒）
  INITIAL_BOMB_COUNT: 1,   // 初期爆弾数
  INITIAL_BOMB_RANGE: 2,   // 初期爆風範囲（マス）
  MAX_SPEED: 300,          // 最大移動速度
  MAX_BOMB_COUNT: 8,       // 最大爆弾数
  MAX_BOMB_RANGE: 8,       // 最大爆風範囲
  SPEED_INCREMENT: 30,     // 速度アップ時の増加量
};

// AI設定
export const AI_CONFIG = {
  COUNT: 3,                    // AI数
  BOMB_PLACE_CHANCE: 0.1,      // 爆弾設置確率（10%/秒）
  INITIAL_SPEED: 150,
  INITIAL_BOMB_COUNT: 1,
  INITIAL_BOMB_RANGE: 2,
};

// 爆弾設定
export const BOMB_CONFIG = {
  TIMER: 3000,        // 起爆時間（ミリ秒）
  EXPLOSION_DURATION: 500, // 爆発持続時間（ミリ秒）
};

// パワーアップ設定
export const POWERUP_CONFIG = {
  DROP_CHANCE: 0.3,  // 壁破壊時の出現確率（30%）
  TYPES: {
    BOMB_COUNT: 'bomb_count',
    BOMB_RANGE: 'bomb_range',
    SPEED: 'speed',
  },
};

// フィールド縮小設定
export const FIELD_SHRINK_CONFIG = {
  START_TIME: 60000,   // 開始時間（60秒）
  INTERVAL: 15000,     // 縮小間隔（15秒）
  WARNING_TIME: 5000,  // 警告時間（5秒前）
};

// 色設定（ボンバーマン風）
export const COLORS = {
  // 地面（緑のチェッカーパターン）
  FLOOR_LIGHT: 0x3cb371,     // 明るい緑
  FLOOR_DARK: 0x2e8b57,      // 暗い緑
  // 壁
  WALL: 0x696969,            // 破壊不可能な壁（灰色）
  WALL_LIGHT: 0x808080,      // 壁のハイライト
  WALL_DARK: 0x484848,       // 壁の影
  BREAKABLE_WALL: 0xcd853f,  // 破壊可能な壁（茶色/レンガ）
  BREAKABLE_LIGHT: 0xdeb887, // レンガのハイライト
  BREAKABLE_DARK: 0x8b4513,  // レンガの影
  // キャラクター
  PLAYER: 0xffffff,          // プレイヤー（白）
  PLAYER_FACE: 0x1a1a1a,     // プレイヤーの顔
  ENEMY: 0xff4444,           // 敵（赤）
  ENEMY_DARK: 0xcc0000,      // 敵の影
  // エフェクト
  BOMB: 0x1a1a1a,            // 爆弾（黒）
  BOMB_FUSE: 0xff6600,       // 導火線
  EXPLOSION: 0xff6600,       // 爆発（オレンジ）
  EXPLOSION_CENTER: 0xffff00, // 爆発中心（黄）
  SHRINK_WARNING: 0xff0000,   // 縮小警告
  // UI
  GRID: 0x333333,            // グリッド線
  HUD_BG: 0x2a2a2a,          // HUD背景
  HUD_TEXT: 0xffffff,        // HUDテキスト
  // 互換性のため維持
  EMPTY: 0x3cb371,
};

// 深度（レンダリング順序）
export const DEPTHS = {
  BACKGROUND: 0,
  WALLS: 10,
  ITEMS: 20,
  PLAYERS: 30,
  BOMBS: 25,
  EXPLOSIONS: 40,
  UI: 100,
};
