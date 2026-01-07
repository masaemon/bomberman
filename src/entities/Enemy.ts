import Phaser from 'phaser';
import { AI_CONFIG, COLORS, DEPTHS, getTileSize } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';
import { SimpleAI } from '../ai/SimpleAI';

/**
 * 敵キャラクタークラス
 */
export class Enemy extends Phaser.GameObjects.Container {
  private gameMap: GameMap;
  private tileSize: number;
  private graphics: Phaser.GameObjects.Graphics;
  private ai: SimpleAI;

  // ステータス
  public speed: number;
  public bombCount: number;
  public bombRange: number;
  public placedBombs: number;
  public isAlive: boolean = true;

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
    this.speed = AI_CONFIG.INITIAL_SPEED;
    this.bombCount = AI_CONFIG.INITIAL_BOMB_COUNT;
    this.bombRange = AI_CONFIG.INITIAL_BOMB_RANGE;
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

    // AIを初期化
    this.ai = new SimpleAI(this, gameMap);
  }

  /**
   * 敵キャラクターを描画（赤いモンスター風）
   */
  private drawCharacter(): void {
    this.graphics.clear();
    const size = this.tileSize * 0.8;
    const halfSize = size / 2;

    // 体（赤い丸）
    this.graphics.fillStyle(COLORS.ENEMY);
    this.graphics.fillCircle(0, 0, halfSize * 0.9);

    // 輪郭
    this.graphics.lineStyle(2, COLORS.ENEMY_DARK, 1);
    this.graphics.strokeCircle(0, 0, halfSize * 0.9);

    // 目（白目）
    const eyeSize = size * 0.15;
    const eyeY = -size * 0.05;
    const eyeX = size * 0.15;
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(-eyeX, eyeY, eyeSize);
    this.graphics.fillCircle(eyeX, eyeY, eyeSize);

    // 瞳孔（黒目）
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(-eyeX + 2, eyeY, eyeSize * 0.5);
    this.graphics.fillCircle(eyeX + 2, eyeY, eyeSize * 0.5);

    // 牙（三角形）
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillTriangle(
      -size * 0.15, size * 0.15,
      -size * 0.08, size * 0.35,
      -size * 0.01, size * 0.15
    );
    this.graphics.fillTriangle(
      size * 0.01, size * 0.15,
      size * 0.08, size * 0.35,
      size * 0.15, size * 0.15
    );
  }

  /**
   * 更新処理
   */
  update(delta: number): void {
    if (!this.isAlive) return;

    // AIを更新
    this.ai.update(delta);

    // 移動処理
    this.handleMovement(delta);
  }

  /**
   * 移動処理
   */
  private handleMovement(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moveDirection = this.ai.getMoveDirection();

    // 移動がなければ停止
    if (moveDirection.x === 0 && moveDirection.y === 0) {
      body.setVelocity(0, 0);
      return;
    }

    const deltaTime = delta / 1000;
    const moveAmount = this.speed * deltaTime;

    // X方向の移動を試行
    if (Math.abs(moveDirection.x) > 0) {
      const newX = this.x + moveDirection.x * moveAmount;
      if (this.canMoveTo(newX, this.y)) {
        this.x = newX;
        body.setVelocityX(moveDirection.x * this.speed);
      }
    }

    // Y方向の移動を試行
    if (Math.abs(moveDirection.y) > 0) {
      const newY = this.y + moveDirection.y * moveAmount;
      if (this.canMoveTo(this.x, newY)) {
        this.y = newY;
        body.setVelocityY(moveDirection.y * this.speed);
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
      { x: newX - halfWidth, y: newY - halfHeight },
      { x: newX + halfWidth, y: newY - halfHeight },
      { x: newX - halfWidth, y: newY + halfHeight },
      { x: newX + halfWidth, y: newY + halfHeight },
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
   * AIにプレイヤー位置を伝える
   */
  setPlayerPosition(tile: { x: number; y: number }): void {
    this.ai.setPlayerPosition(tile);
  }

  /**
   * AIに危険なタイルを伝える
   */
  setDangerousTiles(tiles: Set<string>): void {
    this.ai.setDangerousTiles(tiles);
  }

  /**
   * 爆弾設置リクエストをチェック
   */
  checkBombRequest(): boolean {
    return this.ai.checkBombRequest();
  }

  /**
   * 死亡処理
   */
  die(): void {
    if (!this.isAlive) return;

    this.isAlive = false;

    // 死亡アニメーション（点滅して消える）
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
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
   * 破棄処理
   */
  destroy(fromScene?: boolean): void {
    this.graphics.destroy();
    super.destroy(fromScene);
  }
}

/**
 * 敵の初期配置位置を取得（マップ四隅から3箇所選択）
 */
export function getEnemySpawnPositions(mapWidth: number, mapHeight: number): { x: number; y: number }[] {
  // 四隅の座標（安全地帯を考慮して内側に配置）
  const corners = [
    { x: mapWidth - 2, y: 1 },           // 右上
    { x: 1, y: mapHeight - 2 },          // 左下
    { x: mapWidth - 2, y: mapHeight - 2 }, // 右下
  ];

  return corners;
}
