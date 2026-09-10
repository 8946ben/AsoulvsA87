import Phaser from 'phaser';
import { RENDER_HEIGHT, RENDER_WIDTH } from './config/GameConfig';
import { installHighResolution } from './core/HighResolution';
import { AdmissionGate } from './core/AdmissionGate';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { CodexScene } from './scenes/CodexScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ShopScene } from './scenes/ShopScene';
import { LoadoutScene } from './scenes/LoadoutScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { ChapterSelectScene } from './scenes/ChapterSelectScene';
import { RogueHubScene } from './scenes/RogueHubScene';
import { RogueSetupScene } from './scenes/RogueSetupScene';
import { RogueMapScene } from './scenes/RogueMapScene';
import { RogueRecruitScene } from './scenes/RogueRecruitScene';
import { RogueEventScene } from './scenes/RogueEventScene';
import { RogueRewardScene } from './scenes/RogueRewardScene';
import { RogueSummaryScene } from './scenes/RogueSummaryScene';

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
  scene: [
    BootScene, MenuScene, ModeSelectScene, ChapterSelectScene, LevelSelectScene, LoadoutScene,
    CodexScene, ShopScene, RogueHubScene, RogueSetupScene, RogueMapScene, RogueRecruitScene,
    RogueEventScene, RogueRewardScene, RogueSummaryScene, GameScene,
  ],
};

// 启动流程：先领入场票（限流，失败放行），再创建 Phaser 实例。
// 桌面版（Electron 走 file://）没有 api 后端，领票自动放行，行为不变。
async function startGame(): Promise<void> {
  window.BootLoader?.phase('正在连接入场服务…');
  await AdmissionGate.enter((text) => window.BootLoader?.phase(text));
  window.BootLoader?.phase('正在加载资源…');

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
}

void startGame();
