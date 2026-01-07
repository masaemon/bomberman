import Phaser from 'phaser';
import { getTileSize, getGameSize, HUD_CONFIG, COLORS, DEPTHS, isMobile } from '../config/GameConfig';
import { GameMap } from '../map/GameMap';
import { Player } from '../entities/Player';
import { VirtualJoystick } from '../ui/VirtualJoystick';

/**
 * メインゲームシーン
 */
export class GameScene extends Phaser.Scene {
  private gameMap!: GameMap;
  private player!: Player;
  private joystick: VirtualJoystick | null = null;

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

  update(_time: number, _delta: number): void {
    // プレイヤー更新
    if (this.player) {
      this.player.update();
    }
  }
}
