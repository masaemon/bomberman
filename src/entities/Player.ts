import Phaser from 'phaser';
import { PLAYER_CONFIG, COLORS, DEPTHS, getTileSize } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';

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

    // 移動入力をチェック
    const moveLeft = this.cursors.left.isDown || this.wasdKeys.left.isDown;
    const moveRight = this.cursors.right.isDown || this.wasdKeys.right.isDown;
    const moveUp = this.cursors.up.isDown || this.wasdKeys.up.isDown;
    const moveDown = this.cursors.down.isDown || this.wasdKeys.down.isDown;

    // 速度をリセット
    body.setVelocity(0, 0);

    // 移動方向を決定
    let inputX = 0;
    let inputY = 0;

    if (moveLeft) inputX = -1;
    if (moveRight) inputX = 1;
    if (moveUp) inputY = -1;
    if (moveDown) inputY = 1;

    // 移動がなければ終了
    if (inputX === 0 && inputY === 0) return;

    // 斜め移動の場合は速度を正規化
    let speedMultiplier = 1;
    if (inputX !== 0 && inputY !== 0) {
      speedMultiplier = 1 / Math.sqrt(2);
    }

    const deltaTime = this.scene.game.loop.delta / 1000;
    const moveAmount = this.speed * deltaTime;

    // X方向の移動を試行
    if (inputX !== 0) {
      const newX = this.x + inputX * moveAmount * speedMultiplier;
      if (this.canMoveTo(newX, this.y)) {
        this.x = newX;
        body.setVelocityX(inputX * this.speed * speedMultiplier);
      }
    }

    // Y方向の移動を試行（独立して処理）
    if (inputY !== 0) {
      const newY = this.y + inputY * moveAmount * speedMultiplier;
      if (this.canMoveTo(this.x, newY)) {
        this.y = newY;
        body.setVelocityY(inputY * this.speed * speedMultiplier);
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
