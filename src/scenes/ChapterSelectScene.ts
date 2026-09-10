import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { getLevelProgress } from '../core/LevelProgress';
import { sharpenSceneText } from '../core/TextQuality';
import { CAMPAIGN_CHAPTERS } from '../data/campaign';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

export class ChapterSelectScene extends Phaser.Scene {
  static readonly KEY = 'ChapterSelectScene';
  constructor() { super(ChapterSelectScene.KEY); }

  create(): void {
    createFreshBackdrop(this, 'paper');
    this.add.text(42, 28, '闯关模式 · 章节选择', { fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(43, 72, 'CAMPAIGN CHAPTERS', { fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2 });
    CAMPAIGN_CHAPTERS.forEach((chapter, index) => {
      const progress = getLevelProgress(); const x = GAME_WIDTH / 2; const y = 325 + index * 230;
      const card = this.add.rectangle(x, y, 920, 190, FRESH.PAPER, 0.98).setStrokeStyle(3, chapter.accent, 0.64).setInteractive({ useHandCursor: true });
      this.add.text(x - 406, y - 64, `CHAPTER ${String(chapter.index).padStart(2, '0')}`, { fontFamily: 'Arial', fontSize: '13px', color: '#3c8ea8', fontStyle: 'bold' });
      this.add.text(x - 406, y - 25, chapter.name, { fontFamily: 'Microsoft YaHei', fontSize: '31px', color: '#42506d', fontStyle: 'bold' });
      this.add.text(x - 406, y + 18, chapter.subtitle, { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#e85f91', fontStyle: 'bold' });
      this.add.text(x - 156, y + 44, chapter.description, { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#60758a', wordWrap: { width: 520 } }).setOrigin(0, 0.5);
      this.add.text(x + 390, y - 48, `${progress.completed} / ${chapter.levels.length}`, { fontFamily: 'Arial', fontSize: '24px', color: '#3c8ea8', fontStyle: 'bold' }).setOrigin(1, 0.5);
      this.add.text(x + 390, y + 48, '进入章节 →', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: '#62cae8', padding: { x: 20, y: 10 }, fontStyle: 'bold' }).setOrigin(1, 0.5);
      card.on('pointerover', () => card.setFillStyle(0xeaf8f3, 1)); card.on('pointerout', () => card.setFillStyle(FRESH.PAPER, 0.98)); card.on('pointerdown', () => this.scene.start('LevelSelectScene'));
    });
    const back = this.add.text(52, GAME_HEIGHT - 43, '← 返回模式选择  ESC', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#52667d', backgroundColor: '#edf7f5', padding: { x: 16, y: 10 } }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('ModeSelectScene'));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('ModeSelectScene'));
    sharpenSceneText(this);
  }
}
