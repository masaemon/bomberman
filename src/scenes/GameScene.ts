import Phaser from 'phaser';
import { getGameSize, getTileSize } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';

/**
 * メインゲームシーン
 */
export class GameScene extends Phaser.Scene {
  private gameMap!: GameMap;

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

    // TODO: プレイヤー配置
    // TODO: 敵配置

    // デバッグ情報表示
    this.add.text(10, 10, 'Bomberman Game - Dev Build', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
    }).setDepth(1000);
  }

  update(time: number, delta: number): void {
    // ゲームループ処理
  }
}
