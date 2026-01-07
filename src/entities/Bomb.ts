import Phaser from 'phaser';
import { BOMB_CONFIG, COLORS, DEPTHS, getTileSize } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';

/**
 * 爆弾クラス
 */
export class Bomb extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private tileSize: number;
  private tileX: number;
  private tileY: number;
  private timer: Phaser.Time.TimerEvent;
  private pulseTimer: number = 0;

  public bombRange: number;
  public isExploded: boolean = false;

  // 爆発時のコールバック
  private onExplodeCallback: ((bomb: Bomb) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    gameMap: GameMap,
    bombRange: number
  ) {
    const tileSize = getTileSize();
    const pos = gameMap.tileToPixel(tileX, tileY);

    super(scene, pos.x, pos.y);

    this.tileSize = tileSize;
    this.tileX = tileX;
    this.tileY = tileY;
    this.bombRange = bombRange;

    // グラフィックを作成
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawBomb(1);

    // シーンに追加
    scene.add.existing(this);

    // 深度設定
    this.setDepth(DEPTHS.BOMBS);

    // 爆発タイマー設定
    this.timer = scene.time.addEvent({
      delay: BOMB_CONFIG.TIMER,
      callback: this.explode,
      callbackScope: this,
    });
  }

  /**
   * 爆弾を描画（パルスアニメーション対応）
   */
  private drawBomb(scale: number): void {
    this.graphics.clear();
    const size = this.tileSize * 0.7 * scale;
    const halfSize = size / 2;

    // 爆弾本体（黒い円）
    this.graphics.fillStyle(COLORS.BOMB);
    this.graphics.fillCircle(0, 0, halfSize);

    // ハイライト（光沢）
    this.graphics.fillStyle(0x444444);
    this.graphics.fillCircle(-halfSize * 0.3, -halfSize * 0.3, halfSize * 0.25);

    // 導火線
    this.graphics.lineStyle(3, COLORS.BOMB_FUSE, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(0, -halfSize * 0.8);
    this.graphics.lineTo(halfSize * 0.3, -halfSize * 1.2);
    this.graphics.strokePath();

    // 導火線の火花
    const sparkSize = halfSize * 0.15;
    this.graphics.fillStyle(0xffff00);
    this.graphics.fillCircle(halfSize * 0.3, -halfSize * 1.2, sparkSize);
    this.graphics.fillStyle(0xff6600);
    this.graphics.fillCircle(halfSize * 0.35, -halfSize * 1.25, sparkSize * 0.7);
  }

  /**
   * 更新処理（パルスアニメーション）
   */
  update(delta: number): void {
    if (this.isExploded) return;

    this.pulseTimer += delta;
    const pulse = 1 + Math.sin(this.pulseTimer * 0.01) * 0.1;
    this.drawBomb(pulse);
  }

  /**
   * 爆発コールバックを設定
   */
  setOnExplode(callback: (bomb: Bomb) => void): void {
    this.onExplodeCallback = callback;
  }

  /**
   * 爆発処理
   */
  explode(): void {
    if (this.isExploded) return;
    this.isExploded = true;

    // タイマーをキャンセル
    if (this.timer) {
      this.timer.destroy();
    }

    // コールバックを呼び出し
    if (this.onExplodeCallback) {
      this.onExplodeCallback(this);
    }

    // 自身を破棄
    this.destroy();
  }

  /**
   * 誘爆処理（他の爆発に巻き込まれた場合）
   */
  chainExplode(): void {
    this.explode();
  }

  /**
   * タイル座標を取得
   */
  getTilePosition(): { x: number; y: number } {
    return { x: this.tileX, y: this.tileY };
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
