import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { pickQuizRound, type QuizQuestion } from '../core/Quiz';
import { awardDrawTickets } from '../core/Relics';
import { RelicDrawScene } from './RelicDrawScene';
import { sharpenSceneText } from '../core/TextQuality';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

const QUESTION_MS = 15000;
const ROUND_SIZE = 10;
const PASS_COUNT = 8;

/**
 * 枝江答题：每轮 10 题（3~5 道 A-SOUL + 其余常识/AI），每题 15 秒。
 * 答错或超时会展示正确答案；答对 8 题及以上奖励 1 张抽卡券。
 */
export class QuizScene extends Phaser.Scene {
  static readonly KEY = 'QuizScene';
  private questions: QuizQuestion[] = [];
  private index = 0;
  private correctCount = 0;
  private remainingMs = QUESTION_MS;
  private phase: 'asking' | 'revealing' | 'summary' = 'asking';
  private layer!: Phaser.GameObjects.Container;
  private progressText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Text[] = [];

  constructor() { super(QuizScene.KEY); }

  create(): void {
    createFreshBackdrop(this, 'garden');
    this.questions = pickQuizRound(ROUND_SIZE);
    this.index = 0; this.correctCount = 0; this.phase = 'asking'; this.remainingMs = QUESTION_MS;
    this.optionButtons = [];
    this.createHeader();
    this.layer = this.add.container(0, 0);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('RelicDrawScene'));
    this.showQuestion();
    sharpenSceneText(this);
  }

  private createHeader(): void {
    this.add.text(42, 24, '枝江答题', { fontFamily: 'Microsoft YaHei', fontSize: '30px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(43, 64, 'ZHIJIANG QUIZ TIME', { fontFamily: 'Arial', fontSize: '12px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2 });
    this.add.text(42, 92, `每题 ${QUESTION_MS / 1000} 秒 · 一轮 ${ROUND_SIZE} 题 · 答对 ${PASS_COUNT} 题奖励 1 张抽卡券`, { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#60758a' });
    this.progressText = this.add.text(GAME_WIDTH - 42, 30, '', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' }).setOrigin(1, 0);
    this.scoreText = this.add.text(GAME_WIDTH - 42, 60, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#348c72', fontStyle: 'bold' }).setOrigin(1, 0);
    this.timerText = this.add.text(GAME_WIDTH - 42, 88, '', { fontFamily: 'Arial', fontSize: '14px', color: '#a66b25', fontStyle: 'bold' }).setOrigin(1, 0);
    this.timerBar = this.add.graphics();
  }

  private showQuestion(): void {
    this.layer.removeAll(true);
    this.optionButtons = [];
    this.remainingMs = QUESTION_MS;
    this.phase = 'asking';
    const question = this.questions[this.index];
    this.progressText.setText(`第 ${this.index + 1} / ${this.questions.length} 题`);
    this.scoreText.setText(`已答对 ${this.correctCount} 题`);

    const card = this.add.rectangle(GAME_WIDTH / 2, 224, 1100, 150, FRESH.PAPER, 0.97)
      .setStrokeStyle(2, FRESH.BLUE, 0.4);
    this.questionText = this.add.text(GAME_WIDTH / 2, 224, question.q, {
      fontFamily: 'Microsoft YaHei', fontSize: '23px', color: '#42506d', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 1020, useAdvancedWrap: true }, lineSpacing: 8,
    }).setOrigin(0.5);
    this.layer.add([card, this.questionText]);

    const letters = ['A', 'B', 'C', 'D'];
    question.options.forEach((option, i) => {
      const col = i % 2; const row = Math.floor(i / 2);
      const x = 356 + col * 570; const y = 350 + row * 130;
      const button = this.add.text(x, y, `${letters[i]}．${option}`, {
        fontFamily: 'Microsoft YaHei', fontSize: '19px', color: '#42506d',
        backgroundColor: '#fffffb', padding: { x: 26, y: 20 }, fontStyle: 'bold',
        wordWrap: { width: 500, useAdvancedWrap: true },
      }).setOrigin(0.5);
      button.setStroke('#bfe0d8', 1);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerover', () => { if (this.phase === 'asking') button.setBackgroundColor('#e8f5f2'); });
      button.on('pointerout', () => { if (this.phase === 'asking') button.setBackgroundColor('#fffffb'); });
      button.on('pointerdown', () => this.answer(i));
      this.layer.add(button);
      this.optionButtons.push(button);
    });
    sharpenSceneText(this);
  }

  update(_time: number, delta: number): void {
    if (this.phase !== 'asking') return;
    this.remainingMs -= delta;
    const ratio = Phaser.Math.Clamp(this.remainingMs / QUESTION_MS, 0, 1);
    this.timerText.setText(`${(Math.max(0, this.remainingMs) / 1000).toFixed(1)} 秒`);
    this.timerBar.clear();
    this.timerBar.fillStyle(0xd8e6e2, 0.9); this.timerBar.fillRoundedRect(180, 130, 920, 10, 5);
    this.timerBar.fillStyle(ratio > 0.4 ? 0x58bd92 : ratio > 0.18 ? 0xffc95d : 0xff5b77, 1);
    this.timerBar.fillRoundedRect(180, 130, 920 * ratio, 10, 5);
    if (this.remainingMs <= 0) this.answer(-1);
  }

  /** choice 为 -1 表示超时未作答；错误与超时都会揭示正确答案。 */
  private answer(choice: number): void {
    if (this.phase !== 'asking') return;
    this.phase = 'revealing';
    const question = this.questions[this.index];
    const correct = choice === question.answer;
    if (correct) this.correctCount += 1;
    this.scoreText.setText(`已答对 ${this.correctCount} 题`);

    this.optionButtons.forEach((button, i) => {
      button.disableInteractive();
      if (i === question.answer) {
        button.setBackgroundColor('#d9f4e6').setStroke('#58bd92', 3);
      } else if (i === choice) {
        button.setBackgroundColor('#ffe0e6').setStroke('#e85f91', 3);
      } else {
        button.setAlpha(0.55);
      }
    });

    const bannerText = correct ? '回答正确！' : choice < 0 ? '时间到！' : '回答错误';
    const bannerColor = correct ? '#348c72' : '#d7527c';
    const banner = this.add.text(GAME_WIDTH / 2, 596, correct ? bannerText : `${bannerText}　正确答案：${'ABCD'[question.answer]}．${question.options[question.answer]}`, {
      fontFamily: 'Microsoft YaHei', fontSize: '17px', color: bannerColor, backgroundColor: '#fffaf1', padding: { x: 22, y: 10 }, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);
    if (correct) this.cameras.main.flash(160, 214, 244, 226, false);

    this.time.delayedCall(correct ? 850 : 1900, () => {
      banner.destroy();
      this.index += 1;
      if (this.index >= this.questions.length) this.showSummary(); else this.showQuestion();
    });
  }

  private showSummary(): void {
    this.phase = 'summary';
    this.layer.removeAll(true);
    this.timerBar.clear();
    this.timerText.setText('');
    this.progressText.setText('答题结束');
    const passed = this.correctCount >= PASS_COUNT;
    if (passed) awardDrawTickets(1);

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, FRESH.INK, 0.42);
    const card = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 640, 380, passed ? 0xe8f8ef : 0xffeef3, 0.99)
      .setStrokeStyle(3, passed ? FRESH.MINT : FRESH.PINK, 0.82);
    const kicker = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 128, passed ? 'QUIZ CLEARED' : 'ALMOST THERE', { fontFamily: 'Arial', fontSize: '14px', color: passed ? '#2f9a75' : '#d7557d', fontStyle: 'bold', letterSpacing: 4 }).setOrigin(0.5);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 78, passed ? '答对啦，舞台为你闪耀！' : '差一点点，再接再厉！', { fontFamily: 'Microsoft YaHei', fontSize: '28px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0.5);
    const stats = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, `本轮答对 ${this.correctCount} / ${this.questions.length} 题（需 ${PASS_COUNT} 题）`, { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#5e6f84' }).setOrigin(0.5);
    const reward = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 26, passed ? '🎟 获得 1 张抽卡券！' : '🎟 未达到 8 题，本轮没有奖励', { fontFamily: 'Microsoft YaHei', fontSize: '18px', color: passed ? '#2f9a75' : '#9aa8a4', fontStyle: 'bold' }).setOrigin(0.5);
    const again = this.makeButton(GAME_WIDTH / 2 - 130, GAME_HEIGHT / 2 + 104, '再来一轮', () => this.scene.restart(), '#4eb3cf');
    const back = this.makeButton(GAME_WIDTH / 2 + 130, GAME_HEIGHT / 2 + 104, '返回抽卡转盘', () => this.scene.start(RelicDrawScene.KEY), '#e85f91');
    this.layer.add([overlay, card, kicker, title, stats, reward, again, back]);
    sharpenSceneText(this);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, color: string): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: color, padding: { x: 20, y: 11 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', onClick);
    return button;
  }
}
