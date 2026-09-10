import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { sharpenSceneText } from '../core/TextQuality';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

export class ModeSelectScene extends Phaser.Scene {
  static readonly KEY = 'ModeSelectScene';
  constructor() { super(ModeSelectScene.KEY); }

  create(): void {
    createFreshBackdrop(this, 'garden');
    this.add.text(GAME_WIDTH / 2, 62, '选择游戏模式', { fontFamily: 'Microsoft YaHei', fontSize: '38px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 108, '每一次守护舞台，都有不同的故事', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#60758a' }).setOrigin(0.5);
    this.createModeCard(355, 365, '闯关模式', 'CAMPAIGN', '按章节推进固定关卡\n解锁角色、金币与融合科技', '进入章节选择', FRESH.BLUE, () => this.scene.start('ChapterSelectScene'));
    this.createModeCard(925, 365, '肉鸽模式', 'ROGUELIKE', '随机路线、招募进阶与收藏品\n失败会结束本次巡演，但每局路线不同', '开始探索', FRESH.PINK, () => this.scene.start('RogueHubScene'));
    const back = this.add.text(52, GAME_HEIGHT - 43, '← 返回主界面  ESC', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#52667d', backgroundColor: '#edf7f5', padding: { x: 16, y: 10 } }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
    sharpenSceneText(this);
  }

  private createModeCard(x: number, y: number, title: string, kicker: string, desc: string, action: string, accent: number, onClick: () => void): void {
    const container = this.add.container(x, y);
    const shadow = this.add.rectangle(8, 10, 440, 420, 0x42506d, 0.12).setStrokeStyle(0);
    const bg = this.add.rectangle(0, 0, 440, 420, FRESH.PAPER, 0.98).setStrokeStyle(3, accent, 0.65).setInteractive({ useHandCursor: true });
    const glow = this.add.circle(0, -80, 98, accent, 0.14);
    const icon = this.add.text(0, -94, kicker === 'CAMPAIGN' ? 'Ⅰ' : '∞', { fontFamily: 'Arial', fontSize: '84px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold' }).setOrigin(0.5);
    const small = this.add.text(0, 10, kicker, { fontFamily: 'Arial', fontSize: '12px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold', letterSpacing: 3 }).setOrigin(0.5);
    const name = this.add.text(0, 48, title, { fontFamily: 'Microsoft YaHei', fontSize: '30px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0.5);
    const body = this.add.text(0, 112, desc, { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#60758a', align: 'center', lineSpacing: 9 }).setOrigin(0.5);
    const button = this.add.text(0, 176, action, { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#ffffff', backgroundColor: Phaser.Display.Color.IntegerToColor(accent).rgba, padding: { x: 28, y: 12 }, fontStyle: 'bold' }).setOrigin(0.5);
    container.add([shadow, bg, glow, icon, small, name, body, button]);
    bg.on('pointerover', () => { container.setScale(1.025); glow.setAlpha(0.26); });
    bg.on('pointerout', () => { container.setScale(1); glow.setAlpha(0.14); });
    bg.on('pointerdown', onClick);
  }
}
