import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { isDeveloperMode } from '../core/DeveloperMode';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { getLevelProgress } from '../core/LevelProgress';
import { ALL_LEVELS, type LevelConfig } from '../data/levels';
import { ZOMBIES } from '../data/zombies';
import { GameScene } from './GameScene';

export class LevelSelectScene extends Phaser.Scene {
  static readonly KEY = 'LevelSelectScene';

  constructor() { super(LevelSelectScene.KEY); }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.createLevelCards();
    this.createNavigation();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
    sharpenSceneText(this);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050a17, 0x101a36, 0x102f40, 0x07131f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x65e7ff, 0.045); bg.fillCircle(80, 120, 250); bg.fillCircle(1200, 650, 300);
    bg.fillStyle(0xff6fa9, 0.035); bg.fillCircle(1160, 70, 220);
    bg.lineStyle(1, 0x67e8ff, 0.06);
    for (let x = 0; x <= GAME_WIDTH; x += 64) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, GAME_HEIGHT); bg.strokePath(); }
    for (let y = 0; y <= GAME_HEIGHT; y += 64) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(GAME_WIDTH, y); bg.strokePath(); }
  }

  private createHeader(): void {
    const developerMode = isDeveloperMode();
    this.add.text(42, 26, '舞台巡演 · 关卡选择', {
      fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#f4fcff', fontStyle: 'bold',
    });
    this.add.text(43, 72, 'ADVENTURE TOUR · 10 STAGES', {
      fontFamily: 'Arial', fontSize: '13px', color: '#6be6ff', fontStyle: 'bold', letterSpacing: 2,
    });
    const progress = getLevelProgress();
    this.add.text(GAME_WIDTH - 42, 34, '已通关 ' + progress.completed + ' / ' + ALL_LEVELS.length, {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#98bccd',
    }).setOrigin(1, 0);
    this.add.text(GAME_WIDTH - 42, 66, developerMode ? 'DEV MODE · 全部关卡已开放' : '通关后解锁下一幕与新角色卡', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: developerMode ? '#ffd86f' : '#5f8091',
    }).setOrigin(1, 0);
  }

  private createLevelCards(): void {
    const progress = getLevelProgress();
    const developerMode = isDeveloperMode();
    const cardW = 228; const cardH = 238; const gapX = 18; const gapY = 18;
    const totalW = cardW * 5 + gapX * 4;
    const startX = (GAME_WIDTH - totalW) / 2;

    ALL_LEVELS.forEach((level, index) => {
      const col = index % 5; const row = Math.floor(index / 5);
      const x = startX + col * (cardW + gapX) + cardW / 2;
      const y = 126 + row * (cardH + gapY) + cardH / 2;
      const locked = !developerMode && level.id > progress.unlocked;
      const completed = level.id <= progress.completed;
      this.createLevelCard(x, y, cardW, cardH, level, locked, completed, developerMode);
    });
  }

  private createLevelCard(x: number, y: number, w: number, h: number, level: LevelConfig, locked: boolean, completed: boolean, developerMode: boolean): void {
    const container = this.add.container(x, y);
    const fill = locked ? 0x101621 : completed ? 0x11272d : 0x101d30;
    const bg = this.add.rectangle(0, 0, w, h, fill, 0.98)
      .setStrokeStyle(2, locked ? 0x344858 : level.accent, locked ? 0.25 : 0.55);
    const strip = this.add.rectangle(-w / 2 + 4, 0, 7, h - 10, locked ? 0x465768 : level.accent, locked ? 0.35 : 0.9);
    const stage = this.add.text(-w / 2 + 18, -h / 2 + 13, 'STAGE ' + String(level.id).padStart(2, '0'), {
      fontFamily: 'Arial', fontSize: '11px', color: locked ? '#566777' : '#78dff5', fontStyle: 'bold',
    });
    const state = this.add.text(w / 2 - 15, -h / 2 + 13, completed ? '✓ 已通关' : locked ? '未解锁' : developerMode ? 'DEV 可挑战' : '挑战中', {
      fontFamily: 'Microsoft YaHei', fontSize: '10px', color: completed ? '#67efc3' : locked ? '#61717e' : '#ffd86f',
    }).setOrigin(1, 0);
    const name = this.add.text(0, -77, level.name.replace(/^第.+?幕 · /, ''), {
      fontFamily: 'Microsoft YaHei', fontSize: '19px', color: locked ? '#6d7b86' : '#f4fbff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const enemyStart = -(level.featuredEnemies.length - 1) * 16;
    const enemies = level.featuredEnemies.map((type, index) => {
      const icon = this.add.image(enemyStart + index * 32, -37, ZOMBIES[type].texture);
      const source = icon.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const scale = Math.min(29 / source.width, 29 / source.height);
      return icon.setScale(scale).setAlpha(locked ? 0.25 : 0.9);
    });

    const stats = this.add.text(0, -6, level.waves.length + ' 波  ·  初始应援 ' + level.startingSun + '  ·  ' + level.availablePlants.length + ' 张卡', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: locked ? '#596975' : '#ffdc82',
    }).setOrigin(0.5);
    const desc = this.add.text(0, 25, level.description, {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: locked ? '#5b6872' : '#b9d2de',
      align: 'center', wordWrap: { width: w - 28 }, lineSpacing: 3,
    }).setOrigin(0.5, 0);
    const reward = this.add.text(0, h / 2 - 30, level.reward, {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: locked ? '#56636d' : '#8cebd1', fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    container.add([bg, strip, stage, state, name, ...enemies, stats, desc, reward]);

    if (locked) {
      container.add(this.add.text(0, 71, 'LOCK', { fontFamily: 'Arial', fontSize: '11px', color: '#75838e', fontStyle: 'bold' }).setOrigin(0.5));
      return;
    }

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.025, duration: 110, ease: 'Quad.easeOut' });
      bg.setStrokeStyle(2, level.accent, 0.95);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 110, ease: 'Quad.easeOut' });
      bg.setStrokeStyle(2, level.accent, 0.55);
    });
    bg.on('pointerdown', () => this.scene.start(GameScene.KEY, { level }));
  }

  private createNavigation(): void {
    const back = sharpenText(this.add.text(42, GAME_HEIGHT - 23, '← 返回主界面  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#e5fbff',
      backgroundColor: '#17344a', padding: { x: 16, y: 9 },
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#285c76'));
    back.on('pointerout', () => back.setBackgroundColor('#17344a'));
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
