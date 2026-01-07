import Phaser from 'phaser';
import { TileType, MAP_CONFIG, getTileSize, COLORS, DEPTHS } from '../config/GameConfig';

/**
 * ゲームマップの生成・管理クラス
 */
export class GameMap {
  private scene: Phaser.Scene;
  private tileSize: number;
  private mapData: TileType[][];
  private tileGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tileSize = getTileSize();
    this.mapData = [];
    this.tileGraphics = this.scene.add.graphics();
    this.tileGraphics.setDepth(DEPTHS.BACKGROUND);

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
    const totalTiles = MAP_CONFIG.WIDTH * MAP_CONFIG.HEIGHT;
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
   * マップを描画
   */
  render(): void {
    this.tileGraphics.clear();

    for (let y = 0; y < MAP_CONFIG.HEIGHT; y++) {
      for (let x = 0; x < MAP_CONFIG.WIDTH; x++) {
        const tileType = this.mapData[y][x];
        let color: number;

        switch (tileType) {
          case TileType.WALL:
            color = COLORS.WALL;
            break;
          case TileType.BREAKABLE_WALL:
            color = COLORS.BREAKABLE_WALL;
            break;
          default:
            color = COLORS.EMPTY;
            break;
        }

        // タイルを描画
        this.tileGraphics.fillStyle(color);
        this.tileGraphics.fillRect(
          x * this.tileSize,
          y * this.tileSize,
          this.tileSize,
          this.tileSize
        );

        // グリッド線を描画（デバッグ用）
        this.tileGraphics.lineStyle(1, COLORS.GRID, 0.3);
        this.tileGraphics.strokeRect(
          x * this.tileSize,
          y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }
  }

  /**
   * タイル座標からピクセル座標に変換
   */
  tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * this.tileSize + this.tileSize / 2,
      y: tileY * this.tileSize + this.tileSize / 2,
    };
  }

  /**
   * ピクセル座標からタイル座標に変換
   */
  pixelToTile(pixelX: number, pixelY: number): { x: number; y: number } {
    return {
      x: Math.floor(pixelX / this.tileSize),
      y: Math.floor(pixelY / this.tileSize),
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
