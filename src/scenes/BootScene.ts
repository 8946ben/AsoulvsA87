import Phaser from 'phaser';
import { ASSETS, GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { AssetNormalizer } from '../core/AssetNormalizer';
import { installRelicIconTextures } from '../core/RelicIconTextures';
import { TextureFactory } from '../core/TextureFactory';
import { MenuScene } from './MenuScene';

/**
 * 启动场景：准备所有纹理资源。
 *
 * 接入自绘美术时在这里加载即可，key 与 config/GameConfig.ts 的 TEX 保持一致，
 * 加载完的同名纹理会覆盖 TextureFactory 生成的占位图，逻辑层无需任何改动：
 *
 *   this.load.image(TEX.PLANT_BEIJIXING, 'images/fans-beijixing-v2.png');
 *   this.load.image(TEX.ZOMBIE_BASIC, 'assets/images/zombie_basic.png');
 *   ...
 */
export class BootScene extends Phaser.Scene {
  static readonly KEY = 'BootScene';
  /** 本次 preload 中加载失败的资源数；非零时 create() 不再进入游戏，改为给出重试入口。 */
  private failedFileCount = 0;

  constructor() {
    super(BootScene.KEY);
  }

  preload(): void {
    this.failedFileCount = 0;
    // 加载进度汇报给 index.html 的即显加载层（window.BootLoader）
    this.load.on('progress', (value: number) => window.BootLoader?.progress(value));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, () => { this.failedFileCount += 1; });

    // 加载真实素材。个别文件缺失不会中断流程——
    // create() 里的 TextureFactory 会为未覆盖的 key 补上占位图。
    for (const [key, path] of Object.entries(ASSETS)) {
      this.load.image(key, path);
    }
  }

  create(): void {
    // 素材批量加载失败（服务器不可达、网络抖动等）时不静默降级成占位图，
    // 那样玩家会看到满屏简笔画还以为存档坏了；改为整屏提示并提供重试。
    if (this.failedFileCount > 0) {
      // DOM 加载层盖在画布上（z-index 9999），先撤掉才能点到重试按钮。
      window.BootLoader?.fail('资源加载失败');
      this.showRetryScreen();
      return;
    }

    // 资源全部就绪，撤掉 DOM 加载层，露出游戏画面
    window.BootLoader?.done();

    // 补齐所有尚未被真实素材覆盖的 key，保证没有任何外部资源也能完整运行
    TextureFactory.generateAll(this);

    // 真实素材统一去除连通白底、裁切并缩放到目标尺寸，
    // 之后 Zombie / Projectile / Sun / Plant 拿到的都是规范尺寸，无需各自适配
    AssetNormalizer.normalize(this);

    // 装备图标额外按显示尺寸预分档：源图 1254px，直接压到 15 世界像素只会糊成一团
    installRelicIconTextures(this);

    this.scene.start(MenuScene.KEY);
  }

  /** 资源加载失败的重试界面：不生成任何占位纹理，重试后从缓存快速补齐缺失文件。 */
  private showRetryScreen(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xbcefff, 1);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, '资源加载失败', {
      fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#42506d', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, `${this.failedFileCount} 个资源未能下载，贴图会不完整。请检查网络或本地服务器后重试。`, {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#5f6d86', wordWrap: { width: 640 }, align: 'center',
    }).setOrigin(0.5);
    const retry = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, '重试加载', {
      fontFamily: 'Microsoft YaHei', fontSize: '18px', color: '#ffffff', backgroundColor: '#e85f91',
      padding: { x: 34, y: 13 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setScale(1.05));
    retry.on('pointerout', () => retry.setScale(1));
    retry.on('pointerdown', () => this.scene.restart());
  }
}
