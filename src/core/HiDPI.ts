import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

/**
 * Phaser 3.60+ 移除了 `resolution` 配置，WebGL 画布背板固定为游戏逻辑尺寸（1280×720），
 * 在大窗口/高 DPI 下由浏览器把低分辨率画布拉伸放大，导致文字与图片发糊。
 *
 * 解法：逻辑坐标不变，把背板分辨率抬到窗口所需倍数，并同步缩放相机，让 FIT 变成
 * “缩小高分辨率画布”而不是“放大低分辨率画布”，从而得到清晰画面。
 *
 * 关键公式（源自 Phaser 源码 Camera#preRender 与 WebGLRenderer#resize）：
 * - 相机视口设为背板大小：camera.width = bufW，投影矩阵把 0..bufW 铺满整个缓冲。
 * - camera.zoom = scale，则 displayWidth = bufW/scale = GAME_WIDTH，刚好看到整个世界。
 * - 但缩放时相机默认对准视口中心，会裁掉世界左上角，因此要让 worldView 从 0 开始：
 *      worldView.x = scrollX + bufW/2 - (bufW/scale)/2 = 0
 *      => scrollX = -(GAME_WIDTH*(scale-1))/2
 */

const HIDPI_MAX = 3;

function computeScale(): number {
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  return Math.min(HIDPI_MAX, Math.max(dpr, fit));
}

/**
 * 相机把视口设为背板大小（camera.width = bufW）后，`camera.getWorldPoint` 会把输入当成
 * 背板坐标 [0,bufW] 处理，而 Phaser 的 pointer.x/y 仍是游戏逻辑坐标 [0,GAME_WIDTH]。
 * getWorldPoint 会缩放 camera 矩阵，因此返回 pointer/zoom —— 输入命中点错位。
 *
 * 解法：在 ScaleManager 的 transformX/transformY 里把 pointer 乘以 scale，
 * 让它落到 [0,bufW] 背板空间，与 getWorldPoint 期望一致。游戏逻辑只用 pointer.worldX/worldY，
 * 它们此时会被换算回正确的世界坐标，因此无需改任何业务代码。
 */
let inputScale = 1;

function patchInputTransform(game: Phaser.Game): void {
  const sm = game.scale;
  if ((sm as unknown as { __hidiInputPatched?: boolean }).__hidiInputPatched) {
    return;
  }
  (sm as unknown as { __hidiInputPatched: boolean }).__hidiInputPatched = true;

  const origX = sm.transformX.bind(sm);
  const origY = sm.transformY.bind(sm);

  // 这些方法只被 InputManager#transformPointer 调用，用于把 pageX/pageY 换算成 pointer 坐标。
  sm.transformX = (pageX: number) => origX(pageX) * inputScale;
  sm.transformY = (pageY: number) => origY(pageY) * inputScale;
}

function applyToScene(scene: Phaser.Scene): void {
  const scale = computeScale();
  const bufW = Math.round(GAME_WIDTH * scale);
  const bufH = Math.round(GAME_HEIGHT * scale);
  const scrollX = -(GAME_WIDTH * (scale - 1)) / 2;
  const scrollY = -(GAME_HEIGHT * (scale - 1)) / 2;

  for (const camera of scene.cameras.cameras) {
    camera.setViewport(0, 0, bufW, bufH);
    camera.setZoom(scale);
    camera.setScroll(scrollX, scrollY);
  }
}

export function applyHiDPI(game: Phaser.Game): void {
  const scale = computeScale();
  inputScale = scale;
  const bufW = Math.round(GAME_WIDTH * scale);
  const bufH = Math.round(GAME_HEIGHT * scale);

  const canvas = game.canvas;
  if (canvas.width !== bufW || canvas.height !== bufH) {
    canvas.width = bufW;
    canvas.height = bufH;
  }

  const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer | Phaser.Renderer.Canvas.CanvasRenderer;
  renderer.resize(bufW, bufH);

  for (const scene of game.scene.scenes) {
    applyToScene(scene);
  }
}

/**
 * 监听游戏生命周期：窗口尺寸变化、启动完成时统一重新套用高 DPI 缩放。
 *
 * 注意：Phaser 的 `CREATE` 事件只在每个场景自己的 `sys.events` 上触发（SceneManager#create，
 * `sys.events.emit(Events.CREATE, scene)`），并不会冒泡到 `game.events`。因此在场景切换/重开时，
 * 若监听 `game.events` 将永远收不到回调，相机也就不会重新套用高 DPI。
 *
 * 为什么必须重套：场景 `restart` 会走 CameraManager#shutdown -> #start，把旧相机 destroy 后
 * 重新 `add()` 出一个逻辑尺寸（sys.scale.width=GAME_WIDTH，zoom=1）的全新相机。而渲染 buffer 已被
 * 放大到 bufW。此时一个 1280 宽、未缩放的相机只在 buffer 左侧约 66% 区域绘制世界，画面“变小”。
 * 因此这里逐个订阅每个场景 `sys.events` 的 `CREATE`，保证场景创建/重启/切换后相机都重新缩放。
 */
export function installHiDPI(game: Phaser.Game): void {
  patchInputTransform(game);
  const apply = (): void => applyHiDPI(game);
  game.scale.on(Phaser.Scale.Events.RESIZE, apply);

  const subscribe = (scene: Phaser.Scene): void => {
    const sys = scene.sys as unknown as { __hidiWatching?: boolean; events: Phaser.Events.EventEmitter };
    if (sys.__hidiWatching) return;
    sys.__hidiWatching = true;
    sys.events.on(Phaser.Scenes.Events.CREATE, apply);
  };
  const watchAll = (): void => { for (const scene of game.scene.scenes) subscribe(scene); };

  watchAll();
  game.events.once(Phaser.Core.Events.READY, watchAll);

  apply();
}
