import Phaser from 'phaser';
import { PLAYER_CONFIG, COLORS, DEPTHS, getTileSize } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';

/**
 * プレイヤーキャラクタークラス
 */
export class Player extends Phaser.GameObjects.Rectangle {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  // private spaceKey!: Phaser.Input.Keyboard.Key; // 爆弾設置用（TICKET-006で実装）
  private gameMap: GameMap;
  private tileSize: number;

  // ステータス
  public speed: number;
  public bombCount: number;
  public bombRange: number;
  public placedBombs: number; // 現在設置されている爆弾数

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, gameMap: GameMap) {
    const tileSize = getTileSize();
    const pos = gameMap.tileToPixel(tileX, tileY);

    // 矩形として描画（仮グラフィック）
    super(scene, pos.x, pos.y, tileSize * 0.8, tileSize * 0.8, COLORS.PLAYER);

    this.gameMap = gameMap;
    this.tileSize = tileSize;

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

    // 当たり判定サイズを調整（少し小さめにして壁との衝突を自然に）
    const collisionSize = tileSize * 0.6;
    body.setSize(collisionSize, collisionSize);

    // 深度設定
    this.setDepth(DEPTHS.PLAYERS);

    // 入力設定
    this.setupInput();
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

    // 移動方向を決定（8方向移動を許可）
    let velocityX = 0;
    let velocityY = 0;

    if (moveLeft) velocityX = -1;
    if (moveRight) velocityX = 1;
    if (moveUp) velocityY = -1;
    if (moveDown) velocityY = 1;

    // 斜め移動の場合は速度を正規化
    if (velocityX !== 0 && velocityY !== 0) {
      const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      velocityX /= magnitude;
      velocityY /= magnitude;
    }

    // 速度を適用
    if (velocityX !== 0 || velocityY !== 0) {
      body.setVelocity(velocityX * this.speed, velocityY * this.speed);
    }

    // 壁との衝突チェック
    this.checkWallCollision();
  }

  /**
   * 壁との衝突をチェック
   */
  private checkWallCollision(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // プレイヤーの四隅の位置をタイル座標で取得
    const halfWidth = body.width / 2;
    const halfHeight = body.height / 2;

    const corners = [
      { x: this.x - halfWidth, y: this.y - halfHeight }, // 左上
      { x: this.x + halfWidth, y: this.y - halfHeight }, // 右上
      { x: this.x - halfWidth, y: this.y + halfHeight }, // 左下
      { x: this.x + halfWidth, y: this.y + halfHeight }, // 右下
    ];

    // いずれかの角が壁に重なっている場合、押し戻す
    for (const corner of corners) {
      const tile = this.gameMap.pixelToTile(corner.x, corner.y);

      if (!this.gameMap.isWalkable(tile.x, tile.y)) {
        // 壁との重なりを解消
        const tileCenter = this.gameMap.tileToPixel(tile.x, tile.y);

        // X方向の押し戻し
        if (Math.abs(corner.x - tileCenter.x) > Math.abs(corner.y - tileCenter.y)) {
          if (corner.x < tileCenter.x) {
            this.x = Math.min(this.x, tileCenter.x - this.tileSize / 2 - halfWidth - 1);
          } else {
            this.x = Math.max(this.x, tileCenter.x + this.tileSize / 2 + halfWidth + 1);
          }
          body.setVelocityX(0);
        }
        // Y方向の押し戻し
        else {
          if (corner.y < tileCenter.y) {
            this.y = Math.min(this.y, tileCenter.y - this.tileSize / 2 - halfHeight - 1);
          } else {
            this.y = Math.max(this.y, tileCenter.y + this.tileSize / 2 + halfHeight + 1);
          }
          body.setVelocityY(0);
        }
      }
    }
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
