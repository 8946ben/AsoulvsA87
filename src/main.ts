import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/GameConfig';
import { installHiDPI } from './core/HiDPI';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { CodexScene } from './scenes/CodexScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ShopScene } from './scenes/ShopScene';
import { LoadoutScene } from './scenes/LoadoutScene';

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
  scene: [BootScene, MenuScene, LevelSelectScene, LoadoutScene, CodexScene, ShopScene, GameScene],
};

const game = new Phaser.Game(config);

// Phaser 3.60+ 已移除 resolution 配置，画布背板固定为逻辑尺寸，大窗口下会被浏览器放大而变糊。
// 这里按窗口/DPI 抬高背板分辨率并同步相机缩放，让画面在超大窗口中依旧清晰锐利。
installHiDPI(game);
