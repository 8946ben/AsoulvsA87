import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { getCoins } from '../core/Coins';
import { isDeveloperMode } from '../core/DeveloperMode';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { getLevelProgress } from '../core/LevelProgress';
import { ALL_LEVELS, type LevelConfig } from '../data/levels';
import { ZOMBIES } from '../data/zombies';
import { LoadoutScene } from './LoadoutScene';
import { ShopScene } from './ShopScene';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

export class LevelSelectScene extends Phaser.Scene {
  static readonly KEY = 'LevelSelectScene';

  constructor() { super(LevelSelectScene.KEY); }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.createLevelCards();
    this.createNavigation();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('ChapterSelectScene'));
    sharpenSceneText(this);
  }

  private createBackground(): void {
    createFreshBackdrop(this, 'paper');
  }

  private createHeader(): void {
    const developerMode = isDeveloperMode();
    this.add.text(42, 26, '舞台巡演 · 关卡选择', {
      fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#42506d', fontStyle: 'bold',
    });
    this.add.text(43, 72, `ADVENTURE TOUR · ${ALL_LEVELS.length} STAGES`, {
      fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2,
    });
    const progress = getLevelProgress();
    this.add.text(GAME_WIDTH - 42, 34, '已通关 ' + progress.completed + ' / ' + ALL_LEVELS.length, {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#526b7e',
    }).setOrigin(1, 0);
    this.add.text(GAME_WIDTH - 42, 66, developerMode ? 'DEV MODE · 全部关卡已开放' : '通关后解锁下一幕与新角色卡', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: developerMode ? '#b47724' : '#71809a',
    }).setOrigin(1, 0);
  }

  private createLevelCards(): void {
    const progress = getLevelProgress();
    const developerMode = isDeveloperMode();
    const cols = 4;
    const cardW = 286; const cardH = 158; const gapX = 14; const gapY = 12;
    const totalW = cardW * cols + gapX * (cols - 1);
    const startX = (GAME_WIDTH - totalW) / 2;

    ALL_LEVELS.forEach((level, index) => {
      const col = index % cols; const row = Math.floor(index / cols);
      const x = startX + col * (cardW + gapX) + cardW / 2;
      const y = 116 + row * (cardH + gapY) + cardH / 2;
      const locked = !developerMode && level.id > progress.unlocked;
      const completed = level.id <= progress.completed;
      this.createLevelCard(x, y, cardW, cardH, level, locked, completed, developerMode);
    });
  }

  private createLevelCard(x: number, y: number, w: number, h: number, level: LevelConfig, locked: boolean, completed: boolean, developerMode: boolean): void {
    const container = this.add.container(x, y);
    const fill = locked ? FRESH.LOCKED : completed ? 0xe8f7ee : FRESH.PAPER;
    const bg = this.add.rectangle(0, 0, w, h, fill, 0.98)
      .setStrokeStyle(2, locked ? 0xaab8b2 : level.accent, locked ? 0.35 : 0.48);
    const strip = this.add.rectangle(-w / 2 + 4, 0, 7, h - 10, locked ? 0xaab8b2 : level.accent, locked ? 0.42 : 0.78);
    const stage = this.add.text(-w / 2 + 18, -h / 2 + 11, 'STAGE ' + String(level.id).padStart(2, '0'), {
      fontFamily: 'Arial', fontSize: '11px', color: locked ? '#84918d' : '#399ec3', fontStyle: 'bold',
    });
    const state = this.add.text(w / 2 - 15, -h / 2 + 11, completed ? '✓ 已通关' : locked ? '未解锁' : developerMode ? 'DEV 可挑战' : '挑战中', {
      fontFamily: 'Microsoft YaHei', fontSize: '10px', color: completed ? '#31966f' : locked ? '#87938f' : '#c27b2d',
    }).setOrigin(1, 0);
    const name = this.add.text(0, -44, level.name.replace(/^第.+?幕 · /, ''), {
      fontFamily: 'Microsoft YaHei', fontSize: '17px', color: locked ? '#87938f' : '#42506d', fontStyle: 'bold',
    }).setOrigin(0.5);

    const enemyStart = -(level.featuredEnemies.length - 1) * 16;
    const enemies = level.featuredEnemies.map((type, index) => {
      const icon = this.add.image(enemyStart + index * 32, -14, ZOMBIES[type].texture);
      const source = icon.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const scale = Math.min(29 / source.width, 29 / source.height);
      return icon.setScale(scale).setAlpha(locked ? 0.25 : 0.9);
    });

    const stats = this.add.text(0, 12, level.waves.length + ' 波  ·  初始应援 ' + level.startingSun + '  ·  可选 ' + level.availablePlants.length + ' 张', {
      fontFamily: 'Microsoft YaHei', fontSize: '10px', color: locked ? '#87938f' : '#a66b25',
    }).setOrigin(0.5);
    const desc = this.add.text(0, 33, level.description, {
      fontFamily: 'Microsoft YaHei', fontSize: '9px', color: locked ? '#8e9995' : '#5e6f84',
      align: 'center', wordWrap: { width: w - 34, useAdvancedWrap: true }, lineSpacing: 1,
    }).setOrigin(0.5, 0);
    const reward = this.add.text(0, h / 2 - 7, locked ? `🔒 ${level.reward}` : level.reward, {
      fontFamily: 'Microsoft YaHei', fontSize: '10px', color: locked ? '#7f8c87' : '#3a9d7b', fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    container.add([bg, strip, stage, state, name, ...enemies, stats, desc, reward]);

    if (locked) return;

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.025, duration: 110, ease: 'Quad.easeOut' });
      bg.setStrokeStyle(2, level.accent, 0.95);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 110, ease: 'Quad.easeOut' });
      bg.setStrokeStyle(2, level.accent, 0.55);
    });
    bg.on('pointerdown', () => this.scene.start(LoadoutScene.KEY, { level }));
  }

  private createNavigation(): void {
    const back = sharpenText(this.add.text(42, GAME_HEIGHT - 23, '← 返回章节  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d',
      backgroundColor: '#e6f5f4', padding: { x: 16, y: 9 },
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d1eeee'));
    back.on('pointerout', () => back.setBackgroundColor('#e6f5f4'));
    back.on('pointerdown', () => this.scene.start('ChapterSelectScene'));

    const tech = sharpenText(this.add.text(GAME_WIDTH - 42, GAME_HEIGHT - 23, `枝江商店  ·  金币 ${getCoins()}`, {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#8d6221',
      backgroundColor: '#fff1bd', padding: { x: 16, y: 9 }, fontStyle: 'bold',
    })).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    tech.on('pointerover', () => tech.setBackgroundColor('#ffe69a'));
    tech.on('pointerout', () => tech.setBackgroundColor('#fff1bd'));
    tech.on('pointerdown', () => this.scene.start(ShopScene.KEY));
  }
}
