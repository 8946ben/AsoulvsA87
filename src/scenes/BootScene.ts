import Phaser from 'phaser';
import { ASSETS } from '../config/GameConfig';
import { AssetNormalizer } from '../core/AssetNormalizer';
import { TextureFactory } from '../core/TextureFactory';
import { MenuScene } from './MenuScene';

/**
 * 启动场景：准备所有纹理资源。
 *
 * 接入自绘美术时在这里加载即可，key 与 config/GameConfig.ts 的 TEX 保持一致，
 * 加载完的同名纹理会覆盖 TextureFactory 生成的占位图，逻辑层无需任何改动：
 *
 *   this.load.image(TEX.PLANT_SUNFLOWER, 'assets/images/sunflower.png');
 *   this.load.image(TEX.ZOMBIE_BASIC, 'assets/images/zombie_basic.png');
 *   ...
 */
export class BootScene extends Phaser.Scene {
  static readonly KEY = 'BootScene';

  constructor() {
    super(BootScene.KEY);
  }

  preload(): void {
    // 加载真实素材。个别文件缺失不会中断流程——
    // create() 里的 TextureFactory 会为未覆盖的 key 补上占位图。
    for (const [key, path] of Object.entries(ASSETS)) {
      this.load.image(key, path);
    }
  }

  create(): void {
    // 补齐所有尚未被真实素材覆盖的 key，保证没有任何外部资源也能完整运行
    TextureFactory.generateAll(this);

    // 真实素材统一裁白边 + 缩放到目标尺寸，
    // 之后 Zombie / Projectile / Sun / Plant 拿到的都是规范尺寸，无需各自适配
    AssetNormalizer.normalize(this);

    this.scene.start(MenuScene.KEY);
  }
}
