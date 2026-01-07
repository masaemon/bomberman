import Phaser from 'phaser';
import { PLAYER_CONFIG, COLORS, DEPTHS, getTileSize } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';
import { VirtualJoystick } from '../ui/VirtualJoystick';

/**
 * プレイヤーキャラクタークラス（ボンバーマン風）
 */
export class Player extends Phaser.GameObjects.Container {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private gameMap: GameMap;
  private tileSize: number;
  private graphics: Phaser.GameObjects.Graphics;
  private joystick: VirtualJoystick | null = null;

  // ステータス
  public speed: number;
  public bombCount: number;
  public bombRange: number;
  public placedBombs: number;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, gameMap: GameMap) {
    const tileSize = getTileSize();
    const pos = gameMap.tileToPixel(tileX, tileY);

    super(scene, pos.x, pos.y);

    this.gameMap = gameMap;
    this.tileSize = tileSize;

    // グラフィックを作成
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawCharacter();

    // ステータス初期化
    this.speed = PLAYER_CONFIG.INITIAL_SPEED;
    this.bombCount = PLAYER_CONFIG.INITIAL_BOMB_COUNT;
    this.bombRange = PLAYER_CONFIG.INITIAL_BOMB_RANGE;
    this.placedBombs = 0;

    // シーンに追加
    scene.add.existing(this);

    // 物理エンジンを有効化
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    // 当たり判定サイズを調整
    const collisionSize = tileSize * 0.6;
    body.setSize(collisionSize, collisionSize);
    body.setOffset(-collisionSize / 2, -collisionSize / 2);

    // 深度設定
    this.setDepth(DEPTHS.PLAYERS);

    // 入力設定
    this.setupInput();
  }

  /**
   * ボンバーマン風キャラクターを描画
   */
  private drawCharacter(): void {
    this.graphics.clear();
    const size = this.tileSize * 0.8;
    const halfSize = size / 2;

    // 体（白い丸）
    this.graphics.fillStyle(COLORS.PLAYER);
    this.graphics.fillCircle(0, 0, halfSize * 0.9);

    // 輪郭
    this.graphics.lineStyle(2, 0x333333, 1);
    this.graphics.strokeCircle(0, 0, halfSize * 0.9);

    // 目
    const eyeSize = size * 0.12;
    const eyeY = -size * 0.1;
    const eyeX = size * 0.15;
    this.graphics.fillStyle(COLORS.PLAYER_FACE);
    this.graphics.fillCircle(-eyeX, eyeY, eyeSize);
    this.graphics.fillCircle(eyeX, eyeY, eyeSize);

    // 口
    this.graphics.lineStyle(2, COLORS.PLAYER_FACE, 1);
    this.graphics.beginPath();
    this.graphics.arc(0, size * 0.05, size * 0.15, 0.2, Math.PI - 0.2);
    this.graphics.strokePath();

    // 頭のアンテナ（ボンバーマンらしさ）
    this.graphics.fillStyle(0xff6600);
    this.graphics.fillCircle(0, -halfSize * 0.95, size * 0.08);
  }

  /**
   * キーボード入力の設定
   */
  private setupInput(): void {
    const keyboard = this.scene.input.keyboard;

    if (!keyboard) return;

    // 矢印キー
    this.cursors = keyboard.createCursorKeys();

    // WASDキー
    this.wasdKeys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // スペースキー（爆弾設置用）- TICKET-006で実装
    // this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  /**
   * バーチャルジョイスティックを設定
   */
  setJoystick(joystick: VirtualJoystick): void {
    this.joystick = joystick;
  }

  /**
   * 更新処理
   */
  update(): void {
    this.handleMovement();
  }

  /**
   * 移動処理
   * X方向とY方向を独立して処理することで斜め入力時のハマりを防止
   */
  private handleMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 速度をリセット
    body.setVelocity(0, 0);

    // 入力値を取得
    let inputX = 0;
    let inputY = 0;

    // ジョイスティック入力を優先
    if (this.joystick && this.joystick.getIsActive()) {
      inputX = this.joystick.inputX;
      inputY = this.joystick.inputY;
    } else {
      // キーボード入力
      const moveLeft = this.cursors?.left?.isDown || this.wasdKeys?.left?.isDown;
      const moveRight = this.cursors?.right?.isDown || this.wasdKeys?.right?.isDown;
      const moveUp = this.cursors?.up?.isDown || this.wasdKeys?.up?.isDown;
      const moveDown = this.cursors?.down?.isDown || this.wasdKeys?.down?.isDown;

      if (moveLeft) inputX = -1;
      if (moveRight) inputX = 1;
      if (moveUp) inputY = -1;
      if (moveDown) inputY = 1;
    }

    // 移動がなければ終了
    if (Math.abs(inputX) < 0.1 && Math.abs(inputY) < 0.1) return;

    // 速度の大きさを計算（ジョイスティックはアナログ入力）
    const magnitude = Math.sqrt(inputX * inputX + inputY * inputY);
    let normalizedX = inputX;
    let normalizedY = inputY;

    // 正規化（大きさが1を超えないように）
    if (magnitude > 1) {
      normalizedX = inputX / magnitude;
      normalizedY = inputY / magnitude;
    }

    const deltaTime = this.scene.game.loop.delta / 1000;
    const moveAmount = this.speed * deltaTime;

    // X方向の移動を試行
    if (Math.abs(normalizedX) > 0.1) {
      const newX = this.x + normalizedX * moveAmount;
      if (this.canMoveTo(newX, this.y)) {
        this.x = newX;
        body.setVelocityX(normalizedX * this.speed);
      }
    }

    // Y方向の移動を試行（独立して処理）
    if (Math.abs(normalizedY) > 0.1) {
      const newY = this.y + normalizedY * moveAmount;
      if (this.canMoveTo(this.x, newY)) {
        this.y = newY;
        body.setVelocityY(normalizedY * this.speed);
      }
    }
  }

  /**
   * 指定位置に移動可能かチェック
   */
  private canMoveTo(newX: number, newY: number): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const halfWidth = body.width / 2;
    const halfHeight = body.height / 2;

    // 四隅をチェック
    const corners = [
      { x: newX - halfWidth, y: newY - halfHeight }, // 左上
      { x: newX + halfWidth, y: newY - halfHeight }, // 右上
      { x: newX - halfWidth, y: newY + halfHeight }, // 左下
      { x: newX + halfWidth, y: newY + halfHeight }, // 右下
    ];

    for (const corner of corners) {
      const tile = this.gameMap.pixelToTile(corner.x, corner.y);
      if (!this.gameMap.isWalkable(tile.x, tile.y)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 現在のタイル座標を取得
   */
  getTilePosition(): { x: number; y: number } {
    return this.gameMap.pixelToTile(this.x, this.y);
  }

  /**
   * 爆弾設置可能かチェック
   */
  canPlaceBomb(): boolean {
    return this.placedBombs < this.bombCount;
  }

  /**
   * 爆弾設置時に呼ばれる
   */
  onBombPlaced(): void {
    this.placedBombs++;
  }

  /**
   * 爆弾爆発時に呼ばれる
   */
  onBombExploded(): void {
    this.placedBombs = Math.max(0, this.placedBombs - 1);
  }

  /**
   * パワーアップ取得
   */
  powerUp(type: 'bomb_count' | 'bomb_range' | 'speed'): void {
    switch (type) {
      case 'bomb_count':
        this.bombCount = Math.min(this.bombCount + 1, PLAYER_CONFIG.MAX_BOMB_COUNT);
        break;
      case 'bomb_range':
        this.bombRange = Math.min(this.bombRange + 1, PLAYER_CONFIG.MAX_BOMB_RANGE);
        break;
      case 'speed':
        this.speed = Math.min(this.speed + PLAYER_CONFIG.SPEED_INCREMENT, PLAYER_CONFIG.MAX_SPEED);
        break;
    }
  }
}
