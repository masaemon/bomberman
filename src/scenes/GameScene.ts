import Phaser from 'phaser';
import { getTileSize, getGameSize, HUD_CONFIG, COLORS, DEPTHS, isMobile, TileType } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';
import { Player } from '../entities/Player';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { Bomb } from '../entities/Bomb';
import { Explosion } from '../entities/Explosion';

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

    // TODO: 敵配置
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
    // プレイヤー更新
    if (this.player) {
      this.player.update();

      // 爆弾設置リクエストをチェック
      if (this.player.checkBombRequest()) {
        this.placeBomb();
      }
    }

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
