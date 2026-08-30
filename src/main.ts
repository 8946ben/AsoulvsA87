import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { CodexScene } from './scenes/CodexScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  render: {
    // 对齐物理像素，同时保留立绘和矢量纹理的平滑边缘。
    antialias: true,
    roundPixels: true,
  },
  scene: [BootScene, MenuScene, LevelSelectScene, CodexScene, GameScene],
};

new Phaser.Game(config);
