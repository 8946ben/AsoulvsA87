import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TEX } from '../config/GameConfig';
import { LEVEL_1 } from '../data/levels';
import { GameScene } from './GameScene';

export class MenuScene extends Phaser.Scene {
  static readonly KEY = 'MenuScene';

  constructor() {
    super(MenuScene.KEY);
  }

  create(): void {
    this.createBackground();

    this.add
      .text(GAME_WIDTH / 2, 150, 'ASOUL vs A87', {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#2e7d32',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 212, '塔防 · 同人原型', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#fff8dc',
      })
      .setOrigin(0.5);

    this.createStartButton();

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 90,
        '玩法：点击顶部卡片选中植物 → 点击草坪种下；点击阳光收集资源。\n撑过所有波次即获胜，僵尸越过小推车线则失败。',
        {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#e8f5e9',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2e7d32, 0x2e7d32, 0x87ceeb, 0x87ceeb, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 底部草坪装饰
    bg.fillStyle(0x3f8f2a, 1);
    bg.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);
  }

  private createStartButton(): void {
    const button = this.add
      .text(GAME_WIDTH / 2, 330, '开始游戏', {
        fontFamily: 'Arial',
        fontSize: '30px',
        color: '#ffffff',
        backgroundColor: '#6d4c41',
        padding: { x: 36, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#8d6e63'));
    button.on('pointerout', () => button.setBackgroundColor('#6d4c41'));
    button.on('pointerdown', () => {
      this.scene.start(GameScene.KEY, { level: LEVEL_1 });
    });

    // 按钮呼吸效果
    this.tweens.add({
      targets: button,
      scale: 1.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 装饰：两侧各摆一个植物与僵尸的剪影
    this.add.image(210, 330, TEX.PLANT_PEASHOOTER).setAlpha(0.9);
    this.add.image(GAME_WIDTH - 210, 330, TEX.ZOMBIE_BASIC).setAlpha(0.9);
  }
}
