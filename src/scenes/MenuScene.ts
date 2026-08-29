import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TEX } from '../config/GameConfig';
import { sharpenSceneText } from '../core/TextQuality';
import { LEVEL_1 } from '../data/levels';
import { GameScene } from './GameScene';

export class MenuScene extends Phaser.Scene {
  static readonly KEY = 'MenuScene';
  constructor() { super(MenuScene.KEY); }

  create(): void {
    this.createBackground(); this.createCast(); this.createTitle(); this.createStartButton();
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 38, '同人创作 · 角色与故事归原作者及社群共同记忆所有', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#66869d' }).setOrigin(0.5);
    sharpenSceneText(this);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050b19, 0x10193a, 0x133b4b, 0x091523, 1); bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x62e6ff, 0.07); bg.fillTriangle(80, 0, 410, GAME_HEIGHT, 580, GAME_HEIGHT);
    bg.fillStyle(0xff68a5, 0.06); bg.fillTriangle(1200, 0, 700, GAME_HEIGHT, 980, GAME_HEIGHT);
    bg.lineStyle(2, 0x56dbff, 0.16);
    for (let y = 80; y < GAME_HEIGHT; y += 85) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(GAME_WIDTH, y + 50); bg.strokePath(); }
    bg.fillStyle(0x020610, 0.72); bg.fillRect(0, GAME_HEIGHT - 96, GAME_WIDTH, 96);
    for (let x = 0; x < GAME_WIDTH; x += 27) { bg.fillStyle(x % 81 ? 0x07101e : 0x101b32, 1); bg.fillCircle(x + 12, GAME_HEIGHT - 96 - (x % 4) * 4, 18); }
    for (let i = 0; i < 8; i++) {
      const light = this.add.circle(180 + i * 132, 40, 5, i % 2 ? 0xff6fa8 : 0x62e5ff, 0.85);
      this.tweens.add({ targets: light, alpha: 0.25, scale: 1.6, duration: 700 + i * 90, yoyo: true, repeat: -1 });
    }
  }

  private createCast(): void {
    const left = [TEX.PLANT_JIAXINTANG, TEX.PLANT_BELLA, TEX.PLANT_DIANA, TEX.PLANT_GLADYS];
    left.forEach((texture, index) => {
      const x = 92 + index * 86; const y = 445 + Math.abs(1.5 - index) * 22;
      const glow = this.add.circle(x, y, 47, index % 2 ? 0xff6f9f : 0x58e2ff, 0.1);
      const image = this.add.image(x, y, texture).setScale(1.05).setDepth(3);
      this.tweens.add({ targets: [image, glow], y: y - 9, duration: 1200 + index * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    const enemyGlow = this.add.circle(1110, 422, 115, 0xff4f75, 0.12).setDepth(1);
    const enemy = this.add.image(1110, 422, TEX.ZOMBIE_DRAGON).setScale(1.55).setDepth(3).setTint(0xffd8e2);
    this.tweens.add({ targets: enemy, angle: 2.5, y: enemy.y - 8, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: enemyGlow, scale: 1.18, alpha: 0.04, duration: 900, yoyo: true, repeat: -1 });
    this.add.text(1110, 552, '神区化龙 A87', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ff94ad', fontStyle: 'bold' }).setOrigin(0.5);
  }

  private createTitle(): void {
    this.add.text(GAME_WIDTH / 2, 108, '枝江舞台保卫战', { fontFamily: 'Microsoft YaHei', fontSize: '58px', color: '#f5fdff', fontStyle: 'bold', stroke: '#113652', strokeThickness: 10 }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 171, 'A-SOUL  ×  A87', { fontFamily: 'Arial', fontSize: '22px', color: '#70e8ff', fontStyle: 'bold' }).setOrigin(0.5);
    const rule = this.add.graphics(); rule.lineStyle(2, 0x6de7ff, 0.55); rule.beginPath(); rule.moveTo(452, 205); rule.lineTo(828, 205); rule.strokePath();
    this.add.text(GAME_WIDTH / 2, 231, '邪恶的 A87 想夺走舞台，偶像与粉丝们必须并肩守住灯光。', { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#a9c8d8' }).setOrigin(0.5);

    const feature = this.add.graphics(); feature.fillStyle(0x0c1728, 0.88); feature.fillRoundedRect(438, 278, 404, 86, 16); feature.lineStyle(1, 0x6de7ff, 0.25); feature.strokeRoundedRect(438, 278, 404, 86, 16);
    this.add.text(GAME_WIDTH / 2, 303, '10 张基础角色卡  ·  6 类 A87 敌人', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#e8faff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 339, '变形机制 / 距离攻速 / 定身投掷 / Boss 召唤', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#7da5ba' }).setOrigin(0.5);
  }

  private createStartButton(): void {
    const glow = this.add.rectangle(GAME_WIDTH / 2, 441, 244, 72, 0x5ee7ff, 0.13).setStrokeStyle(2, 0x6decff, 0.45);
    const button = this.add.text(GAME_WIDTH / 2, 441, '开始保卫舞台', { fontFamily: 'Microsoft YaHei', fontSize: '24px', color: '#ffffff', backgroundColor: '#256487', padding: { x: 42, y: 16 }, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    button.on('pointerover', () => { button.setBackgroundColor('#337fa3').setScale(1.035); glow.setAlpha(0.28); });
    button.on('pointerout', () => { button.setBackgroundColor('#256487').setScale(1); glow.setAlpha(1); });
    button.on('pointerdown', () => this.scene.start(GameScene.KEY, { level: LEVEL_1 }));
    this.tweens.add({ targets: glow, scaleX: 1.06, scaleY: 1.12, alpha: 0.05, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(GAME_WIDTH / 2, 505, '点击角色卡 → 点击草坪部署　｜　点击应援球收集资源', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#8bacbe' }).setOrigin(0.5);
  }
}
