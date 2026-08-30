import Phaser from 'phaser';
import { RENDER_HEIGHT, RENDER_WIDTH } from './config/GameConfig';
import { installHighResolution } from './core/HighResolution';
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
  width: RENDER_WIDTH,
  height: RENDER_HEIGHT,
  backgroundColor: '#dff7ff',
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

// 只由 Phaser ScaleManager 管理画布显示尺寸和输入坐标。
// FIT 会保持 16:9 逻辑画布并在非 16:9 窗口中自动留边，鼠标映射也随窗口尺寸同步更新。
const game = new Phaser.Game(config);
installHighResolution(game);

// Electron 在最大化、还原或快速拖动窗口时，原生 resize 与父容器布局完成的时机可能不同。
// 下一帧重新读取父容器，不触碰相机、渲染背板或输入变换，避免画布沿用旧尺寸。
let resizeFrame = 0;
const refreshScale = (): void => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    game.scale.refresh();
    game.scale.updateBounds();
  });
};

window.addEventListener('resize', refreshScale);
window.visualViewport?.addEventListener('resize', refreshScale);
const gameRoot = document.getElementById('game-root');
if (gameRoot) new ResizeObserver(refreshScale).observe(gameRoot);
