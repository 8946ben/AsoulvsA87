import Phaser from 'phaser';
import { RENDER_HEIGHT, RENDER_SCALE, RENDER_WIDTH } from '../config/GameConfig';

/**
 * 将 2560×1440 渲染背板映射到 1280×720 的游戏世界。
 *
 * 画布尺寸在 GameConfig 创建时已经确定，因此 Phaser 的 ScaleManager 和 InputManager
 * 始终使用同一坐标来源。这里只设置相机观察范围，不修改 canvas、renderer 或输入变换。
 */
function applyToScene(scene: Phaser.Scene): void {
  for (const camera of scene.cameras.cameras) {
    camera
      .setViewport(0, 0, RENDER_WIDTH, RENDER_HEIGHT)
      .setOrigin(0, 0)
      .setZoom(RENDER_SCALE)
      .setScroll(0, 0);
  }
}

/** 场景切换或重开会创建新相机，因此每次 CREATE 都重新应用固定的高清相机。 */
export function installHighResolution(game: Phaser.Game): void {
  const subscribe = (scene: Phaser.Scene): void => {
    const sys = scene.sys as unknown as { __highResolutionWatching?: boolean; events: Phaser.Events.EventEmitter };
    if (sys.__highResolutionWatching) return;
    sys.__highResolutionWatching = true;
    sys.events.on(Phaser.Scenes.Events.CREATE, () => applyToScene(scene));
  };

  const watchAll = (): void => {
    for (const scene of game.scene.scenes) subscribe(scene);
  };

  watchAll();
  game.events.once(Phaser.Core.Events.READY, watchAll);
}
