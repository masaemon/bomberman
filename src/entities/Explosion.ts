import Phaser from 'phaser';
import { BOMB_CONFIG, COLORS, DEPTHS, getTileSize, TileType } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';

/**
 * 爆発エフェクトの単一タイル
 */
interface ExplosionTile {
  x: number;
  y: number;
}

/**
 * 爆発クラス
 */
export class Explosion extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private gameMap: GameMap;
  private tileSize: number;
  private centerX: number;
  private centerY: number;
  private explosionTiles: ExplosionTile[] = [];
  private timer: Phaser.Time.TimerEvent;
  private animTimer: number = 0;

  // 爆発終了時のコールバック
  private onFinishCallback: ((explosion: Explosion) => void) | null = null;
  // 壁破壊時のコールバック
  private onDestroyWallCallback: ((tileX: number, tileY: number) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    gameMap: GameMap,
    range: number
  ) {
    const tileSize = getTileSize();

    super(scene, 0, 0);

    this.gameMap = gameMap;
    this.tileSize = tileSize;
    this.centerX = tileX;
    this.centerY = tileY;

    // グラフィックを作成
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    // 爆発範囲を計算
    this.calculateExplosionTiles(tileX, tileY, range);

    // 爆発を描画
    this.drawExplosion(1);

    // シーンに追加
    scene.add.existing(this);

    // 深度設定
    this.setDepth(DEPTHS.EXPLOSIONS);

    // 爆発終了タイマー
    this.timer = scene.time.addEvent({
      delay: BOMB_CONFIG.EXPLOSION_DURATION,
      callback: this.finish,
      callbackScope: this,
    });
  }

  /**
   * 爆発範囲を計算（十字方向、壁で遮断）
   */
  private calculateExplosionTiles(centerX: number, centerY: number, range: number): void {
    // 中心
    this.explosionTiles.push({ x: centerX, y: centerY });

    // 4方向に爆発を広げる
    const directions = [
      { dx: 0, dy: -1 }, // 上
      { dx: 0, dy: 1 },  // 下
      { dx: -1, dy: 0 }, // 左
      { dx: 1, dy: 0 },  // 右
    ];

    for (const dir of directions) {
      for (let i = 1; i <= range; i++) {
        const tx = centerX + dir.dx * i;
        const ty = centerY + dir.dy * i;

        const tileType = this.gameMap.getTileAt(tx, ty);

        // 破壊不可能な壁で止まる
        if (tileType === TileType.WALL) {
          break;
        }

        // 爆発タイルを追加
        this.explosionTiles.push({ x: tx, y: ty });

        // 破壊可能な壁で止まる（壁自体は破壊される）
        if (tileType === TileType.BREAKABLE_WALL) {
          break;
        }
      }
    }
  }

  /**
   * 爆発を描画
   */
  private drawExplosion(alpha: number): void {
    this.graphics.clear();

    for (const tile of this.explosionTiles) {
      const pos = this.gameMap.tileToPixel(tile.x, tile.y);
      const isCenter = tile.x === this.centerX && tile.y === this.centerY;

      // 中心は黄色、それ以外はオレンジ
      const color = isCenter ? COLORS.EXPLOSION_CENTER : COLORS.EXPLOSION;
      const size = this.tileSize * 0.9;

      // 爆発エフェクト
      this.graphics.fillStyle(color, alpha);
      this.graphics.fillCircle(pos.x, pos.y, size / 2);

      // 外枠
      this.graphics.lineStyle(2, 0xff0000, alpha * 0.8);
      this.graphics.strokeCircle(pos.x, pos.y, size / 2);
    }
  }

  /**
   * 更新処理（アニメーション）
   */
  update(delta: number): void {
    this.animTimer += delta;
    const flicker = 0.7 + Math.sin(this.animTimer * 0.02) * 0.3;
    this.drawExplosion(flicker);
  }

  /**
   * 終了コールバックを設定
   */
  setOnFinish(callback: (explosion: Explosion) => void): void {
    this.onFinishCallback = callback;
  }

  /**
   * 壁破壊コールバックを設定
   */
  setOnDestroyWall(callback: (tileX: number, tileY: number) => void): void {
    this.onDestroyWallCallback = callback;
  }

  /**
   * 爆発終了処理
   */
  private finish(): void {
    // 壁破壊処理
    for (const tile of this.explosionTiles) {
      const tileType = this.gameMap.getTileAt(tile.x, tile.y);
      if (tileType === TileType.BREAKABLE_WALL) {
        if (this.onDestroyWallCallback) {
          this.onDestroyWallCallback(tile.x, tile.y);
        }
      }
    }

    // コールバックを呼び出し
    if (this.onFinishCallback) {
      this.onFinishCallback(this);
    }

    // 自身を破棄
    this.destroy();
  }

  /**
   * 爆発タイルのリストを取得（衝突判定用）
   */
  getExplosionTiles(): ExplosionTile[] {
    return this.explosionTiles;
  }

  /**
   * 指定座標が爆発範囲内かチェック
   */
  isInExplosion(tileX: number, tileY: number): boolean {
    return this.explosionTiles.some(tile => tile.x === tileX && tile.y === tileY);
  }

  /**
   * 破棄処理
   */
  destroy(fromScene?: boolean): void {
    if (this.timer) {
      this.timer.destroy();
    }
    this.graphics.destroy();
    super.destroy(fromScene);
  }
}
