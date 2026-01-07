import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { getGameSize, isMobile } from './config/GameConfig';

/**
 * Phaserゲーム設定
 */
const createGameConfig = (): Phaser.Types.Core.GameConfig => {
  const { width, height } = getGameSize();

  return {
    type: Phaser.AUTO,
    width,
    height,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // トップダウンビューなので重力なし
        debug: false, // デバッグモード（開発時はtrueに）
      },
    },
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
      touch: isMobile(),
    },
  };
};

// ゲーム開始
window.addEventListener('load', () => {
  const config = createGameConfig();
  new Phaser.Game(config);

  console.log('Bomberman Game initialized');
  console.log('Device:', isMobile() ? 'Mobile' : 'Desktop');
});
