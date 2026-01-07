import Phaser from 'phaser';
import { getTileSize, getGameSize, HUD_CONFIG, COLORS, DEPTHS, isMobile, TileType, MAP_CONFIG } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';
import { Player } from '../entities/Player';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { Bomb } from '../entities/Bomb';
import { Explosion } from '../entities/Explosion';
import { Enemy, getEnemySpawnPositions } from '../entities/Enemy';

/**
 * メインゲームシーン
 */
export class GameScene extends Phaser.Scene {
  private gameMap!: GameMap;
  private player!: Player;
  private joystick: VirtualJoystick | null = null;

  // 爆弾・爆発管理
  private bombs: Bomb[] = [];
  private explosions: Explosion[] = [];

  // 敵管理
  private enemies: Enemy[] = [];

  // ゲーム状態
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // 現時点ではアセットなし（後で追加）
  }

  create(): void {
    const tileSize = getTileSize();
    console.log(`Game started with tile size: ${tileSize}px`);

    // HUDエリアを描画
    this.createHUD();

    // マップ生成と描画
    this.gameMap = new GameMap(this);
    this.gameMap.render();

    // プレイヤー配置（左上の安全地帯）
    this.player = new Player(this, 1, 1, this.gameMap);

    // モバイルの場合はバーチャルジョイスティックを作成
    if (isMobile()) {
      this.joystick = new VirtualJoystick(this);
      this.player.setJoystick(this.joystick);
    }

    // 敵配置
    this.spawnEnemies();
  }

  /**
   * 敵をスポーン
   */
  private spawnEnemies(): void {
    const spawnPositions = getEnemySpawnPositions(MAP_CONFIG.WIDTH, MAP_CONFIG.HEIGHT);

    for (const pos of spawnPositions) {
      const enemy = new Enemy(this, pos.x, pos.y, this.gameMap);
      this.enemies.push(enemy);
    }
  }

  /**
   * HUDエリアを作成
   */
  private createHUD(): void {
    const { width } = getGameSize();
    const hudHeight = HUD_CONFIG.HEIGHT;

    // HUD背景
    const hudBg = this.add.graphics();
    hudBg.fillStyle(COLORS.HUD_BG, 1);
    hudBg.fillRect(0, 0, width, hudHeight);
    hudBg.setDepth(DEPTHS.UI);

    // ゲームタイトル
    this.add.text(10, hudHeight / 2, 'BOMBERMAN', {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI + 1);

    // 操作説明（デバイスに応じて変更）
    const controlText = isMobile() ? 'Touch left side to move' : 'Arrow Keys / WASD to move';
    this.add.text(width - 10, hudHeight / 2, controlText, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setOrigin(1, 0.5).setDepth(DEPTHS.UI + 1);
  }

  update(_time: number, delta: number): void {
    // ゲームオーバー時は更新しない
    if (this.isGameOver) return;

    // 危険なタイルを計算
    const dangerousTiles = this.calculateDangerousTiles();

    // 爆弾位置を計算
    const bombTiles = this.getBombTiles();

    // プレイヤー更新
    if (this.player) {
      // プレイヤーに爆弾位置を伝える
      this.player.setBombTiles(bombTiles);

      this.player.update();

      // 爆弾設置リクエストをチェック
      if (this.player.checkBombRequest()) {
        this.placeBomb();
      }

      // プレイヤーの爆発判定
      this.checkPlayerExplosion();
    }

    // 敵更新
    const playerTile = this.player.getTilePosition();
    for (const enemy of this.enemies) {
      if (enemy.isAlive) {
        // AIにプレイヤー位置、危険タイル、爆弾位置を伝える
        enemy.setPlayerPosition(playerTile);
        enemy.setDangerousTiles(dangerousTiles);
        enemy.setBombTiles(bombTiles);
        enemy.update(delta);

        // 敵の爆弾設置リクエストをチェック
        if (enemy.checkBombRequest()) {
          this.placeEnemyBomb(enemy);
        }
      }
    }

    // 敵の爆発判定
    this.checkEnemyExplosions();

    // 勝利判定
    this.checkVictory();

    // 爆弾更新
    for (const bomb of this.bombs) {
      bomb.update(delta);
    }

    // 爆発更新
    for (const explosion of this.explosions) {
      explosion.update(delta);
    }
  }

  /**
   * 危険なタイル（爆弾・爆発範囲）を計算
   */
  private calculateDangerousTiles(): Set<string> {
    const dangerous = new Set<string>();

    // 爆弾の位置と予測爆発範囲
    for (const bomb of this.bombs) {
      const pos = bomb.getTilePosition();
      dangerous.add(`${pos.x},${pos.y}`);

      // 4方向の爆発範囲を予測
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const dir of directions) {
        for (let i = 1; i <= bomb.bombRange; i++) {
          const tx = pos.x + dir.dx * i;
          const ty = pos.y + dir.dy * i;

          const tileType = this.gameMap.getTileAt(tx, ty);
          if (tileType === TileType.WALL) break;

          dangerous.add(`${tx},${ty}`);

          if (tileType === TileType.BREAKABLE_WALL) break;
        }
      }
    }

    // 現在の爆発範囲
    for (const explosion of this.explosions) {
      const tiles = explosion.getExplosionTiles();
      for (const tile of tiles) {
        dangerous.add(`${tile.x},${tile.y}`);
      }
    }

    return dangerous;
  }

  /**
   * 爆弾のタイル位置を取得
   */
  private getBombTiles(): Set<string> {
    const tiles = new Set<string>();
    for (const bomb of this.bombs) {
      const pos = bomb.getTilePosition();
      tiles.add(`${pos.x},${pos.y}`);
    }
    return tiles;
  }

  /**
   * プレイヤーが爆発に巻き込まれたかチェック
   */
  private checkPlayerExplosion(): void {
    const playerTile = this.player.getTilePosition();

    for (const explosion of this.explosions) {
      if (explosion.isInExplosion(playerTile.x, playerTile.y)) {
        this.onPlayerDeath();
        return;
      }
    }
  }

  /**
   * 敵が爆発に巻き込まれたかチェック
   */
  private checkEnemyExplosions(): void {
    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const enemyTile = enemy.getTilePosition();

      for (const explosion of this.explosions) {
        if (explosion.isInExplosion(enemyTile.x, enemyTile.y)) {
          enemy.die();
          break;
        }
      }
    }
  }

  /**
   * 勝利判定（全敵撃破）
   */
  private checkVictory(): void {
    const aliveEnemies = this.enemies.filter(e => e.isAlive);

    if (aliveEnemies.length === 0) {
      this.onVictory();
    }
  }

  /**
   * 勝利処理
   */
  private onVictory(): void {
    this.isGameOver = true;

    const { width, height } = getGameSize();
    const centerX = width / 2;
    const centerY = height / 2;

    // 背景オーバーレイ
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(DEPTHS.UI + 50);

    // 勝利テキスト
    this.add.text(centerX, centerY - 30, 'YOU WIN!', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#00ff00',
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 51);

    // リトライテキスト
    const retryMessage = isMobile() ? 'Tap to Play Again' : 'Press SPACE to Play Again';
    this.add.text(centerX, centerY + 30, retryMessage, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 51);

    // リトライ入力を設定
    this.setupRetryInput();
  }

  /**
   * プレイヤー死亡処理
   */
  private onPlayerDeath(): void {
    this.isGameOver = true;

    // プレイヤーを非表示
    this.player.setVisible(false);

    // ゲームオーバー表示
    const { width, height } = getGameSize();
    const centerX = width / 2;
    const centerY = height / 2;

    // 背景オーバーレイ
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(DEPTHS.UI + 50);

    // ゲームオーバーテキスト
    this.add.text(centerX, centerY - 30, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff0000',
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 51);

    // リトライテキスト
    const retryMessage = isMobile() ? 'Tap to Retry' : 'Press SPACE to Retry';
    this.add.text(centerX, centerY + 30, retryMessage, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 51);

    // リトライ入力を設定
    this.setupRetryInput();
  }

  /**
   * リトライ入力を設定
   */
  private setupRetryInput(): void {
    // スペースキーでリトライ
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.restartGame();
    });

    // タッチでリトライ
    this.input.once('pointerdown', () => {
      this.restartGame();
    });
  }

  /**
   * ゲームをリスタート
   */
  private restartGame(): void {
    this.scene.restart();
  }

  /**
   * 爆弾を設置
   */
  private placeBomb(): void {
    const tilePos = this.player.getTilePosition();

    // 同じ位置に既に爆弾があるかチェック
    const bombExists = this.bombs.some(
      bomb => {
        const pos = bomb.getTilePosition();
        return pos.x === tilePos.x && pos.y === tilePos.y;
      }
    );

    if (bombExists) return;

    // 爆弾を作成
    const bomb = new Bomb(
      this,
      tilePos.x,
      tilePos.y,
      this.gameMap,
      this.player.bombRange
    );

    // 爆発時のコールバック
    bomb.setOnExplode((explodedBomb) => {
      this.onBombExplode(explodedBomb);
    });

    this.bombs.push(bomb);
    this.player.onBombPlaced();

    // プレイヤーがこの爆弾をすり抜けられるように登録
    this.player.registerPassableBomb(tilePos.x, tilePos.y);
  }

  /**
   * 敵が爆弾を設置
   */
  private placeEnemyBomb(enemy: Enemy): void {
    const tilePos = enemy.getTilePosition();

    // 同じ位置に既に爆弾があるかチェック
    const bombExists = this.bombs.some(
      bomb => {
        const pos = bomb.getTilePosition();
        return pos.x === tilePos.x && pos.y === tilePos.y;
      }
    );

    if (bombExists) return;

    // 爆弾を作成
    const bomb = new Bomb(
      this,
      tilePos.x,
      tilePos.y,
      this.gameMap,
      enemy.bombRange
    );

    // 爆発時のコールバック
    bomb.setOnExplode((explodedBomb) => {
      this.onEnemyBombExplode(explodedBomb, enemy);
    });

    this.bombs.push(bomb);
    enemy.onBombPlaced();

    // 敵がこの爆弾をすり抜けられるように登録
    enemy.registerPassableBomb(tilePos.x, tilePos.y);
  }

  /**
   * 敵の爆弾爆発時の処理
   */
  private onEnemyBombExplode(bomb: Bomb, enemy: Enemy): void {
    const tilePos = bomb.getTilePosition();

    // 爆弾リストから削除
    this.bombs = this.bombs.filter(b => b !== bomb);

    // 爆発を作成
    const explosion = new Explosion(
      this,
      tilePos.x,
      tilePos.y,
      this.gameMap,
      bomb.bombRange
    );

    // 壁破壊時のコールバック
    explosion.setOnDestroyWall((tileX, tileY) => {
      this.destroyWall(tileX, tileY);
    });

    // 爆発終了時のコールバック
    explosion.setOnFinish((finishedExplosion) => {
      this.explosions = this.explosions.filter(e => e !== finishedExplosion);
    });

    this.explosions.push(explosion);

    // 敵に爆発を通知
    if (enemy.isAlive) {
      enemy.onBombExploded();
    }

    // 誘爆チェック
    this.checkChainExplosion(explosion);
  }

  /**
   * 爆弾爆発時の処理
   */
  private onBombExplode(bomb: Bomb): void {
    const tilePos = bomb.getTilePosition();

    // 爆弾リストから削除
    this.bombs = this.bombs.filter(b => b !== bomb);

    // 爆発を作成
    const explosion = new Explosion(
      this,
      tilePos.x,
      tilePos.y,
      this.gameMap,
      bomb.bombRange
    );

    // 壁破壊時のコールバック
    explosion.setOnDestroyWall((tileX, tileY) => {
      this.destroyWall(tileX, tileY);
    });

    // 爆発終了時のコールバック
    explosion.setOnFinish((finishedExplosion) => {
      this.explosions = this.explosions.filter(e => e !== finishedExplosion);
    });

    this.explosions.push(explosion);

    // プレイヤーに爆発を通知
    this.player.onBombExploded();

    // 誘爆チェック
    this.checkChainExplosion(explosion);
  }

  /**
   * 誘爆チェック
   */
  private checkChainExplosion(explosion: Explosion): void {
    const explosionTiles = explosion.getExplosionTiles();

    for (const bomb of [...this.bombs]) {
      const bombPos = bomb.getTilePosition();
      if (explosionTiles.some(tile => tile.x === bombPos.x && tile.y === bombPos.y)) {
        bomb.chainExplode();
      }
    }
  }

  /**
   * 壁を破壊
   */
  private destroyWall(tileX: number, tileY: number): void {
    this.gameMap.setTileAt(tileX, tileY, TileType.EMPTY);
    this.gameMap.render();
    // TODO: パワーアップアイテムのドロップ（TICKET-010で実装）
  }
}
