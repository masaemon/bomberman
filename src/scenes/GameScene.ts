import Phaser from 'phaser';
import { getTileSize } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';
import { Player } from '../entities/Player';

/**
 * メインゲームシーン
 */
export class GameScene extends Phaser.Scene {
  private gameMap!: GameMap;
  private player!: Player;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // 現時点ではアセットなし（後で追加）
  }

  create(): void {
    const tileSize = getTileSize();
    console.log(`Game started with tile size: ${tileSize}px`);

    // マップ生成と描画
    this.gameMap = new GameMap(this);
    this.gameMap.render();

    // プレイヤー配置（左上の安全地帯）
    this.player = new Player(this, 1, 1, this.gameMap);

    // TODO: 敵配置

    // デバッグ情報表示
    this.add.text(10, 10, 'Bomberman Game - Dev Build\nArrow Keys or WASD to move', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
    }).setDepth(1000);
  }

  update(_time: number, _delta: number): void {
    // プレイヤー更新
    if (this.player) {
      this.player.update();
    }
  }
}
