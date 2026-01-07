import Phaser from 'phaser';
import { DEPTHS, getGameSize } from '../config/GameConfig';

/**
 * バーチャルジョイスティック
 * 画面左側をタッチしてスライドで移動方向を指定
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private baseGraphics: Phaser.GameObjects.Graphics;
  private stickGraphics: Phaser.GameObjects.Graphics;

  private isActive: boolean = false;
  private baseX: number = 0;
  private baseY: number = 0;
  private stickX: number = 0;
  private stickY: number = 0;

  private readonly baseRadius: number = 50;
  private readonly stickRadius: number = 25;
  private readonly maxDistance: number = 40;

  // 入力値（-1 〜 1）
  public inputX: number = 0;
  public inputY: number = 0;

  private pointerId: number = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // グラフィックオブジェクト作成
    this.baseGraphics = scene.add.graphics();
    this.stickGraphics = scene.add.graphics();
    this.baseGraphics.setDepth(DEPTHS.UI + 10);
    this.stickGraphics.setDepth(DEPTHS.UI + 11);

    // 初期状態は非表示
    this.hide();

    // タッチイベント設定
    this.setupInput();
  }

  /**
   * タッチ入力を設定
   */
  private setupInput(): void {
    const { width } = getGameSize();
    const leftZoneWidth = width / 2; // 画面左半分がジョイスティックエリア

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 左半分のタッチのみ反応
      if (pointer.x < leftZoneWidth && this.pointerId === -1) {
        this.pointerId = pointer.id;
        this.activate(pointer.x, pointer.y);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.pointerId && this.isActive) {
        this.updateStick(pointer.x, pointer.y);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.pointerId) {
        this.deactivate();
      }
    });

    this.scene.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.pointerId) {
        this.deactivate();
      }
    });
  }

  /**
   * ジョイスティックをアクティブ化
   */
  private activate(x: number, y: number): void {
    this.isActive = true;
    this.baseX = x;
    this.baseY = y;
    this.stickX = x;
    this.stickY = y;
    this.inputX = 0;
    this.inputY = 0;

    this.show();
    this.draw();
  }

  /**
   * ジョイスティックを非アクティブ化
   */
  private deactivate(): void {
    this.isActive = false;
    this.pointerId = -1;
    this.inputX = 0;
    this.inputY = 0;

    this.hide();
  }

  /**
   * スティック位置を更新
   */
  private updateStick(x: number, y: number): void {
    const dx = x - this.baseX;
    const dy = y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.maxDistance) {
      this.stickX = x;
      this.stickY = y;
    } else {
      // 最大距離に制限
      const angle = Math.atan2(dy, dx);
      this.stickX = this.baseX + Math.cos(angle) * this.maxDistance;
      this.stickY = this.baseY + Math.sin(angle) * this.maxDistance;
    }

    // 入力値を計算（-1 〜 1）
    const clampedDistance = Math.min(distance, this.maxDistance);
    if (clampedDistance > 5) { // デッドゾーン
      this.inputX = (this.stickX - this.baseX) / this.maxDistance;
      this.inputY = (this.stickY - this.baseY) / this.maxDistance;
    } else {
      this.inputX = 0;
      this.inputY = 0;
    }

    this.draw();
  }

  /**
   * ジョイスティックを描画
   */
  private draw(): void {
    // ベース（外側の円）
    this.baseGraphics.clear();
    this.baseGraphics.fillStyle(0x000000, 0.3);
    this.baseGraphics.fillCircle(this.baseX, this.baseY, this.baseRadius);
    this.baseGraphics.lineStyle(2, 0xffffff, 0.5);
    this.baseGraphics.strokeCircle(this.baseX, this.baseY, this.baseRadius);

    // スティック（内側の円）
    this.stickGraphics.clear();
    this.stickGraphics.fillStyle(0xffffff, 0.7);
    this.stickGraphics.fillCircle(this.stickX, this.stickY, this.stickRadius);
    this.stickGraphics.lineStyle(2, 0x333333, 0.8);
    this.stickGraphics.strokeCircle(this.stickX, this.stickY, this.stickRadius);
  }

  /**
   * 表示
   */
  private show(): void {
    this.baseGraphics.setVisible(true);
    this.stickGraphics.setVisible(true);
  }

  /**
   * 非表示
   */
  private hide(): void {
    this.baseGraphics.setVisible(false);
    this.stickGraphics.setVisible(false);
  }

  /**
   * アクティブ状態を取得
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * 破棄
   */
  destroy(): void {
    this.baseGraphics.destroy();
    this.stickGraphics.destroy();
  }
}
