import Phaser from 'phaser';
import { TileType, MAP_CONFIG, getTileSize, getMapOffset, COLORS, DEPTHS } from '../config/GameConfig';

/**
 * ゲームマップの生成・管理クラス
 */
export class GameMap {
  private scene: Phaser.Scene;
  private tileSize: number;
  private mapData: TileType[][];
  private tileGraphics: Phaser.GameObjects.Graphics;
  private offsetX: number;
  private offsetY: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tileSize = getTileSize();
    this.mapData = [];
    this.tileGraphics = this.scene.add.graphics();
    this.tileGraphics.setDepth(DEPTHS.BACKGROUND);

    const offset = getMapOffset();
    this.offsetX = offset.x;
    this.offsetY = offset.y;

    this.generateMap();
  }

  /**
   * マップを生成
   */
  private generateMap(): void {
    // 初期化：すべて空白
    for (let y = 0; y < MAP_CONFIG.HEIGHT; y++) {
      this.mapData[y] = [];
      for (let x = 0; x < MAP_CONFIG.WIDTH; x++) {
        this.mapData[y][x] = TileType.EMPTY;
      }
    }

    // 1. 外周に破壊不可能な壁を配置
    this.placeOuterWalls();

    // 2. 格子状に破壊不可能な壁を配置（1マスおき）
    this.placeGridWalls();

    // 3. ランダムに破壊可能な壁を配置
    this.placeBreakableWalls();
  }

  /**
   * 外周に破壊不可能な壁を配置
   */
  private placeOuterWalls(): void {
    for (let x = 0; x < MAP_CONFIG.WIDTH; x++) {
      this.mapData[0][x] = TileType.WALL; // 上
      this.mapData[MAP_CONFIG.HEIGHT - 1][x] = TileType.WALL; // 下
    }
    for (let y = 0; y < MAP_CONFIG.HEIGHT; y++) {
      this.mapData[y][0] = TileType.WALL; // 左
      this.mapData[y][MAP_CONFIG.WIDTH - 1] = TileType.WALL; // 右
    }
  }

  /**
   * 格子状に破壊不可能な壁を配置
   */
  private placeGridWalls(): void {
    for (let y = 2; y < MAP_CONFIG.HEIGHT - 1; y += 2) {
      for (let x = 2; x < MAP_CONFIG.WIDTH - 1; x += 2) {
        this.mapData[y][x] = TileType.WALL;
      }
    }
  }

  /**
   * ランダムに破壊可能な壁を配置
   */
  private placeBreakableWalls(): void {
    // 配置可能なマスの数を計算
    let emptyTiles = 0;

    for (let y = 0; y < MAP_CONFIG.HEIGHT; y++) {
      for (let x = 0; x < MAP_CONFIG.WIDTH; x++) {
        if (this.mapData[y][x] === TileType.EMPTY) {
          emptyTiles++;
        }
      }
    }

    // 配置する破壊可能な壁の数
    const targetBreakableWalls = Math.floor(emptyTiles * MAP_CONFIG.BREAKABLE_WALL_RATIO);
    let placedWalls = 0;

    // 安全地帯の定義（プレイヤー・敵の初期位置周辺）
    const safeZones = [
      { x: 1, y: 1 }, // 左上（プレイヤー初期位置想定）
      { x: MAP_CONFIG.WIDTH - 2, y: 1 }, // 右上
      { x: 1, y: MAP_CONFIG.HEIGHT - 2 }, // 左下
      { x: MAP_CONFIG.WIDTH - 2, y: MAP_CONFIG.HEIGHT - 2 }, // 右下
    ];

    // ランダムに配置
    const maxAttempts = emptyTiles * 2;
    let attempts = 0;

    while (placedWalls < targetBreakableWalls && attempts < maxAttempts) {
      const x = Phaser.Math.Between(1, MAP_CONFIG.WIDTH - 2);
      const y = Phaser.Math.Between(1, MAP_CONFIG.HEIGHT - 2);

      // 既に壁がある、または安全地帯内の場合はスキップ
      if (this.mapData[y][x] !== TileType.EMPTY || this.isInSafeZone(x, y, safeZones)) {
        attempts++;
        continue;
      }

      this.mapData[y][x] = TileType.BREAKABLE_WALL;
      placedWalls++;
      attempts++;
    }
  }

  /**
   * 指定座標が安全地帯内かチェック
   */
  private isInSafeZone(
    x: number,
    y: number,
    safeZones: { x: number; y: number }[]
  ): boolean {
    for (const zone of safeZones) {
      const distance = Math.abs(x - zone.x) + Math.abs(y - zone.y);
      if (distance <= MAP_CONFIG.SAFE_ZONE_RADIUS) {
        return true;
      }
    }
    return false;
  }

  /**
   * マップを描画（ボンバーマン風）
   */
  render(): void {
    this.tileGraphics.clear();

    for (let y = 0; y < MAP_CONFIG.HEIGHT; y++) {
      for (let x = 0; x < MAP_CONFIG.WIDTH; x++) {
        const tileType = this.mapData[y][x];
        const px = x * this.tileSize + this.offsetX;
        const py = y * this.tileSize + this.offsetY;

        // まず床を描画（チェッカーパターン）
        const isLightTile = (x + y) % 2 === 0;
        this.tileGraphics.fillStyle(isLightTile ? COLORS.FLOOR_LIGHT : COLORS.FLOOR_DARK);
        this.tileGraphics.fillRect(px, py, this.tileSize, this.tileSize);

        // タイルの種類に応じて描画
        switch (tileType) {
          case TileType.WALL:
            this.drawWall(px, py);
            break;
          case TileType.BREAKABLE_WALL:
            this.drawBreakableWall(px, py);
            break;
        }
      }
    }
  }

  /**
   * 破壊不可能な壁を描画（立体感のある灰色ブロック）
   */
  private drawWall(px: number, py: number): void {
    const size = this.tileSize;
    const border = Math.max(2, size * 0.1);

    // ベース色
    this.tileGraphics.fillStyle(COLORS.WALL);
    this.tileGraphics.fillRect(px, py, size, size);

    // ハイライト（上と左）
    this.tileGraphics.fillStyle(COLORS.WALL_LIGHT);
    this.tileGraphics.fillRect(px, py, size, border);
    this.tileGraphics.fillRect(px, py, border, size);

    // 影（下と右）
    this.tileGraphics.fillStyle(COLORS.WALL_DARK);
    this.tileGraphics.fillRect(px, py + size - border, size, border);
    this.tileGraphics.fillRect(px + size - border, py, border, size);
  }

  /**
   * 破壊可能な壁を描画（レンガ風）
   */
  private drawBreakableWall(px: number, py: number): void {
    const size = this.tileSize;
    const border = Math.max(1, size * 0.06);
    const halfSize = size / 2;

    // ベース色
    this.tileGraphics.fillStyle(COLORS.BREAKABLE_WALL);
    this.tileGraphics.fillRect(px, py, size, size);

    // レンガのパターンを描画
    this.tileGraphics.lineStyle(border, COLORS.BREAKABLE_DARK, 1);

    // 水平線（3本）
    this.tileGraphics.beginPath();
    this.tileGraphics.moveTo(px, py + halfSize / 2);
    this.tileGraphics.lineTo(px + size, py + halfSize / 2);
    this.tileGraphics.moveTo(px, py + halfSize);
    this.tileGraphics.lineTo(px + size, py + halfSize);
    this.tileGraphics.moveTo(px, py + halfSize + halfSize / 2);
    this.tileGraphics.lineTo(px + size, py + halfSize + halfSize / 2);
    this.tileGraphics.strokePath();

    // 縦線（互い違い）
    this.tileGraphics.beginPath();
    this.tileGraphics.moveTo(px + halfSize, py);
    this.tileGraphics.lineTo(px + halfSize, py + halfSize / 2);
    this.tileGraphics.moveTo(px + halfSize / 2, py + halfSize / 2);
    this.tileGraphics.lineTo(px + halfSize / 2, py + halfSize);
    this.tileGraphics.moveTo(px + halfSize + halfSize / 2, py + halfSize / 2);
    this.tileGraphics.lineTo(px + halfSize + halfSize / 2, py + halfSize);
    this.tileGraphics.moveTo(px + halfSize, py + halfSize);
    this.tileGraphics.lineTo(px + halfSize, py + halfSize + halfSize / 2);
    this.tileGraphics.moveTo(px + halfSize / 2, py + halfSize + halfSize / 2);
    this.tileGraphics.lineTo(px + halfSize / 2, py + size);
    this.tileGraphics.moveTo(px + halfSize + halfSize / 2, py + halfSize + halfSize / 2);
    this.tileGraphics.lineTo(px + halfSize + halfSize / 2, py + size);
    this.tileGraphics.strokePath();

    // ハイライト（左上）
    this.tileGraphics.fillStyle(COLORS.BREAKABLE_LIGHT);
    this.tileGraphics.fillRect(px, py, size, border);
    this.tileGraphics.fillRect(px, py, border, size);
  }

  /**
   * タイル座標からピクセル座標に変換
   */
  tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * this.tileSize + this.tileSize / 2 + this.offsetX,
      y: tileY * this.tileSize + this.tileSize / 2 + this.offsetY,
    };
  }

  /**
   * ピクセル座標からタイル座標に変換
   */
  pixelToTile(pixelX: number, pixelY: number): { x: number; y: number } {
    return {
      x: Math.floor((pixelX - this.offsetX) / this.tileSize),
      y: Math.floor((pixelY - this.offsetY) / this.tileSize),
    };
  }

  /**
   * 指定座標のタイルタイプを取得
   */
  getTileAt(tileX: number, tileY: number): TileType {
    if (
      tileX < 0 ||
      tileX >= MAP_CONFIG.WIDTH ||
      tileY < 0 ||
      tileY >= MAP_CONFIG.HEIGHT
    ) {
      return TileType.WALL; // 範囲外は壁として扱う
    }
    return this.mapData[tileY][tileX];
  }

  /**
   * 指定座標のタイルタイプを設定
   */
  setTileAt(tileX: number, tileY: number, tileType: TileType): void {
    if (
      tileX < 0 ||
      tileX >= MAP_CONFIG.WIDTH ||
      tileY < 0 ||
      tileY >= MAP_CONFIG.HEIGHT
    ) {
      return;
    }
    this.mapData[tileY][tileX] = tileType;
  }

  /**
   * 指定座標が移動可能かチェック
   */
  isWalkable(tileX: number, tileY: number): boolean {
    const tileType = this.getTileAt(tileX, tileY);
    return tileType === TileType.EMPTY;
  }

  /**
   * マップデータを取得
   */
  getMapData(): TileType[][] {
    return this.mapData;
  }

  /**
   * タイルサイズを取得
   */
  getTileSize(): number {
    return this.tileSize;
  }
}
