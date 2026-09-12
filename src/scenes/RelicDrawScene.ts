import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { getStardust, spendStardust } from '../core/Collection';
import {
  consumeDrawTicket, drawRandomRelic, getDrawTickets, getOwnedRelics, getRelicHolder,
  RARITY_DRAW_WEIGHT, RARITY_DUPLICATE_REFUND, RELIC_DRAW_STARDUST_COST,
  type RelicDrawResult,
} from '../core/Relics';
import { describeRelicEffects, RARITY_COLOR, RARITY_LABEL, RELICS, RELIC_ORDER, type RelicConfig, type RelicRarity } from '../data/relics';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';
import { createRelicIcon } from '../ui/RelicIcon';
import { type ParentSceneData, openChildScene, returnToParentScene } from '../core/SceneNavigation';

const WHEEL_X = 400;
const WHEEL_Y = 396;
const WHEEL_R = 216;
const SECTOR = 360 / RELIC_ORDER.length;
/** 稀有度比较序：S 最高。 */
const RARITY_RANK: Record<RelicRarity, number> = { s: 0, a: 1, b: 2, c: 3, d: 4 };
const RARITY_ORDER: RelicRarity[] = ['s', 'a', 'b', 'c', 'd'];

/**
 * 枝江装备抽卡转盘：放回抽取——每次都从完整奖池按概率随机，
 * 优先消耗答题券，不足时消耗星愿徽记；重复获得的藏品自动兑换星愿徽记。
 * 答题入口也在此场景，QuizScene 结算后返回这里。
 */
export class RelicDrawScene extends Phaser.Scene {
  static readonly KEY = 'RelicDrawScene';
  private wheel!: Phaser.GameObjects.Container;
  private resultLayer!: Phaser.GameObjects.Container;
  private stardustText!: Phaser.GameObjects.Text;
  private ticketText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private drawOnceButton!: Phaser.GameObjects.Text;
  private drawTenButton!: Phaser.GameObjects.Text;
  private poolMarks: Phaser.GameObjects.Text[] = [];
  private spinning = false;
  private returnScene?: string;

  constructor() { super(RelicDrawScene.KEY); }

  init(data: ParentSceneData): void { this.returnScene = data?.returnScene; }

  create(): void {
    createFreshBackdrop(this, 'sunny');
    this.spinning = false;
    this.createHeader();
    this.createWheel();
    this.createPanel();
    this.createDrawButtons();
    this.resultLayer = this.add.container(0, 0).setDepth(300);
    this.createBackButton();
    this.refresh();
    this.input.keyboard?.on('keydown-ESC', () => returnToParentScene(this, this.returnScene));
    sharpenSceneText(this);
  }

  private createHeader(): void {
    this.add.text(42, 26, '枝江装备 · 抽卡转盘', { fontFamily: 'Microsoft YaHei', fontSize: '32px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(43, 70, 'ZHIJIANG RELIC ROULETTE', { fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2 });
    this.add.text(42, 100, '每次抽取优先消耗答题券，不足时消耗 3 ✦；重复藏品自动兑换星愿徽记。', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#60758a' });
    this.stardustText = this.add.text(GAME_WIDTH - 42, 32, '', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#a66b25', fontStyle: 'bold' }).setOrigin(1, 0);
    this.ticketText = this.add.text(GAME_WIDTH - 42, 62, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#348c72', fontStyle: 'bold' }).setOrigin(1, 0);
    this.progressText = this.add.text(GAME_WIDTH - 42, 92, '', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#52667d', fontStyle: 'bold' }).setOrigin(1, 0);
    const rule = this.add.graphics(); rule.lineStyle(2, FRESH.BLUE, 0.28); rule.beginPath(); rule.moveTo(34, 122); rule.lineTo(GAME_WIDTH - 34, 122); rule.strokePath();
  }

  private createWheel(): void {
    // 指针固定在转盘正上方，转盘旋转后停在中奖扇区。
    const pointer = this.add.triangle(WHEEL_X, WHEEL_Y - WHEEL_R - 16, 0, 26, 16, 0, -16, 0, 0xe85f91, 1)
      .setStrokeStyle(3, 0xffffff, 0.9).setDepth(160);
    this.wheel = this.add.container(WHEEL_X, WHEEL_Y).setDepth(150);
    const sectors = this.add.graphics();
    this.wheel.add(sectors);
    RELIC_ORDER.forEach((id, index) => {
      const relic = RELICS[id];
      const start = Phaser.Math.DegToRad(-90 + index * SECTOR);
      const end = start + Phaser.Math.DegToRad(SECTOR);
      sectors.fillStyle(index % 2 === 0 ? 0xfffffb : 0xfff3df, 0.96);
      sectors.slice(0, 0, WHEEL_R, start, end, false); sectors.fillPath();
      sectors.lineStyle(2, RARITY_COLOR[relic.rarity], 0.42);
      sectors.slice(0, 0, WHEEL_R, start, end, false); sectors.strokePath();
      const mid = start + Phaser.Math.DegToRad(SECTOR / 2);
      const glyphR = WHEEL_R * 0.72;
      const glyph = createRelicIcon(this, relic, Math.cos(mid) * glyphR, Math.sin(mid) * glyphR, 26, 26)
        .setRotation(mid + Math.PI / 2);
      this.wheel.add(glyph);
    });
    // 外圈与中心装饰。
    const rim = this.add.graphics();
    rim.lineStyle(6, FRESH.PINK_DARK, 0.85);
    rim.strokeCircle(WHEEL_X, WHEEL_Y, WHEEL_R + 4);
    rim.fillStyle(0xfffaed, 1); rim.fillCircle(WHEEL_X, WHEEL_Y, 58);
    rim.lineStyle(3, FRESH.PINK_DARK, 0.7); rim.strokeCircle(WHEEL_X, WHEEL_Y, 58);
    this.add.text(WHEEL_X, WHEEL_Y - 8, '枝江', { fontFamily: 'Microsoft YaHei', fontSize: '20px', color: '#e85f91', fontStyle: 'bold' }).setOrigin(0.5).setDepth(151);
    this.add.text(WHEEL_X, WHEEL_Y + 16, '藏品转盘', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a' }).setOrigin(0.5).setDepth(151);
    void pointer;
  }

  /** 抽取按钮固定在转盘正下方。 */
  private createDrawButtons(): void {
    this.drawOnceButton = this.makeAction('抽取一次', '#e85f91', () => this.tryDraw(1));
    this.drawOnceButton.setPosition(WHEEL_X - 112, 672);
    this.drawTenButton = this.makeAction('抽取10次', '#4eb3cf', () => this.tryDraw(10));
    this.drawTenButton.setPosition(WHEEL_X + 112, 672);
  }

  private createPanel(): void {
    const panelX = 705; const panelY = 408;
    this.add.rectangle(panelX + 267, panelY, 534, 548, FRESH.PAPER, 0.96).setStrokeStyle(2, FRESH.MINT, 0.42);

    this.add.text(732, 142, '抽取说明', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(732, 172, '优先消耗答题券，不足时消耗 3 ✦ 星愿徽记。', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#60758a' });
    this.add.text(732, 194, '每件藏品仅可入库一次，重复获得自动兑换星愿徽记。', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#60758a' });
    const quizButton = this.makeAction('去答题赢抽奖券（10 题对 8 题）', '#58bd92', () => openChildScene(this, 'QuizScene'));
    quizButton.setPosition(panelX + 267, 236).setFontSize('13px');

    this.add.text(732, 280, '奖池概率', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    RARITY_ORDER.forEach((rarity, index) => {
      const y = 312 + index * 33;
      const accent = RARITY_COLOR[rarity];
      this.add.rectangle(740, y, 10, 10, accent, 0.9).setOrigin(0, 0.5);
      this.add.text(760, y, RARITY_LABEL[rarity], { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.add.text(842, y, `${RARITY_DRAW_WEIGHT[rarity]}%`, { fontFamily: 'Arial', fontSize: '14px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.add.text(1230, y, `重复兑换 ${RARITY_DUPLICATE_REFUND[rarity]} ✦`, { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#a66b25' }).setOrigin(1, 0.5);
    });

    this.add.text(732, 488, '我的藏品', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    RELIC_ORDER.forEach((id, index) => {
      const relic = RELICS[id];
      const col = index % 2; const row = Math.floor(index / 2);
      const x = 722 + col * 258; const y = 518 + row * 21;
      const glyph = createRelicIcon(this, relic, x + 8, y, 16, 16);
      const name = this.add.text(x + 30, y, relic.name, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#42506d' }).setOrigin(0, 0.5);
      const mark = this.add.text(x + 246, y, '', { fontFamily: 'Microsoft YaHei', fontSize: '10px', fontStyle: 'bold' }).setOrigin(1, 0.5);
      this.poolMarks.push(mark);
      void glyph; void name;
    });
  }

  private makeAction(label: string, color: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(0, 0, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#ffffff', backgroundColor: color, padding: { x: 22, y: 12 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', onClick);
    return button;
  }

  private createBackButton(): void {
    const back = sharpenText(this.add.text(42, GAME_HEIGHT - 24, '← 返回上级页面  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', backgroundColor: '#e6f5f4', padding: { x: 15, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d1eeee'));
    back.on('pointerout', () => back.setBackgroundColor('#e6f5f4'));
    back.on('pointerdown', () => returnToParentScene(this, this.returnScene));
  }

  private refresh(): void {
    const stardust = getStardust();
    const tickets = getDrawTickets();
    const owned = getOwnedRelics();
    this.stardustText.setText(`✦ 星愿徽记  ${Number.isFinite(stardust) ? stardust : '∞'}`);
    this.ticketText.setText(`🎟 答题券  ${Number.isFinite(tickets) ? tickets : '∞'}`);
    this.progressText.setText(`藏品收录  ${owned.length} / ${RELIC_ORDER.length}`);
    // 放回抽取永远不会被禁用；仅在两种货币都不足一次时降低按钮存在感。
    const affordable = (Number.isFinite(tickets) ? tickets >= 1 : true) || (Number.isFinite(stardust) ? stardust >= RELIC_DRAW_STARDUST_COST : true);
    this.drawOnceButton.setAlpha(affordable ? 1 : 0.5);
    this.drawTenButton.setAlpha(affordable ? 1 : 0.5);
    RELIC_ORDER.forEach((id, index) => {
      const isOwned = owned.includes(id);
      const holder = getRelicHolder(id);
      this.poolMarks[index]?.setText(isOwned ? (holder ? '装配' : '已入库') : '未获得')
        .setColor(isOwned ? (holder ? '#d7527c' : '#348c72') : '#9aa8a4');
    });
    sharpenSceneText(this);
  }

  /** 单次抽取的付费：优先答题券，不足时消耗星愿徽记。 */
  private payOneDraw(): boolean {
    if (consumeDrawTicket()) return true;
    return spendStardust(RELIC_DRAW_STARDUST_COST);
  }

  private tryDraw(count: 1 | 10): void {
    if (this.spinning) return;
    const results: RelicDrawResult[] = [];
    for (let i = 0; i < count; i++) {
      if (!this.payOneDraw()) {
        if (results.length === 0) this.showToast('答题券与星愿徽记都不足啦', 0xff6585);
        break;
      }
      results.push(drawRandomRelic());
    }
    if (results.length === 0) { this.refresh(); return; }
    this.spinning = true;
    this.refresh();
    // 连抽时转盘停在稀有度最高的一件上。
    const best = results.reduce((a, b) => RARITY_RANK[b.relic.rarity] < RARITY_RANK[a.relic.rarity] ? b : a);
    this.spinTo(best.relic, () => {
      this.spinning = false;
      this.cameras.main.flash(200, 255, 233, 200, false);
      this.showResults(results);
    });
  }

  /** 转盘正向旋转数圈后停在中奖扇区（扇区中心对准顶部指针）。 */
  private spinTo(relic: RelicConfig, onDone: () => void): void {
    const index = RELIC_ORDER.indexOf(relic.id);
    const desired = Phaser.Math.DegToRad(-(index * SECTOR + SECTOR / 2));
    const turns = Math.PI * 2;
    let delta = desired - (this.wheel.rotation % turns);
    while (delta <= 0.05) delta += turns;
    const target = this.wheel.rotation + turns * (5 + Math.floor(Math.random() * 2)) + delta;
    this.tweens.add({
      targets: this.wheel,
      rotation: target,
      duration: 4300,
      ease: 'Cubic.easeOut',
      onComplete: onDone,
    });
  }

  private showResults(results: RelicDrawResult[]): void {
    this.resultLayer.removeAll(true);
    if (results.length === 1) {
      const result = results[0];
      const accent = RARITY_COLOR[result.relic.rarity];
      const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, FRESH.INK, 0.5).setInteractive();
      const card = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 460, 330, 0xfffffb, 0.99)
        .setStrokeStyle(3, accent, 0.85);
      const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118,
        result.duplicate ? `重复藏品 · 兑换 +${result.refund} ✦` : '恭喜收录新藏品！',
        { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: result.duplicate ? '#a66b25' : '#e85f91', fontStyle: 'bold' }).setOrigin(0.5);
      const glyph = createRelicIcon(this, result.relic, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 34, 88, 88);
      const name = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 42, `${result.relic.name} · ${RARITY_LABEL[result.relic.rarity]}`, { fontFamily: 'Microsoft YaHei', fontSize: '24px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0.5);
      const effect = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 82, describeRelicEffects(result.relic.effects).join('，'), { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#52667d', wordWrap: { width: 400, useAdvancedWrap: true } }).setOrigin(0.5);
      const confirm = this.makeAction('收下！', '#e85f91', () => { this.resultLayer.removeAll(true); this.refresh(); });
      confirm.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130);
      this.resultLayer.add([overlay, card, title, glyph, name, effect, confirm]);
    } else {
      const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, FRESH.INK, 0.5).setInteractive();
      const card = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 600, 470, 0xfffffb, 0.99).setStrokeStyle(3, FRESH.PINK_DARK, 0.85);
      const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 196, `抽取结果 · ${results.length} 连`, { fontFamily: 'Microsoft YaHei', fontSize: '18px', color: '#e85f91', fontStyle: 'bold' }).setOrigin(0.5);
      const rows: Phaser.GameObjects.GameObject[] = [];
      results.forEach((result, index) => {
        const col = index % 2; const row = Math.floor(index / 2);
        const x = GAME_WIDTH / 2 - 262 + col * 272; const y = GAME_HEIGHT / 2 - 148 + row * 62;
        const accent = RARITY_COLOR[result.relic.rarity];
        const chip = this.add.rectangle(x, y - 12, 44, 16, accent, 0.16);
        const glyph = createRelicIcon(this, result.relic, x + 12, y - 12, 22, 22);
        const name = this.add.text(x + 32, y - 12, result.relic.name, { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0, 0.5);
        const rarity = this.add.text(x + 132, y - 12, RARITY_LABEL[result.relic.rarity], { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold' }).setOrigin(0, 0.5);
        const outcome = result.duplicate
          ? this.add.text(x + 246, y - 12, `+${result.refund} ✦`, { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#a66b25', fontStyle: 'bold' }).setOrigin(1, 0.5)
          : this.add.text(x + 246, y - 12, '新藏品！', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#348c72', fontStyle: 'bold' }).setOrigin(1, 0.5);
        rows.push(chip, glyph, name, rarity, outcome);
      });
      const confirm = this.makeAction('收下！', '#e85f91', () => { this.resultLayer.removeAll(true); this.refresh(); });
      confirm.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 196);
      this.resultLayer.add([overlay, card, title, ...rows, confirm]);
    }
    sharpenSceneText(this);
  }

  private showToast(message: string, color: number): void {
    const toast = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, message, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', backgroundColor: '#fffaf1ee', padding: { x: 16, y: 8 } })).setOrigin(0.5, 1).setDepth(190);
    toast.setStroke(Phaser.Display.Color.IntegerToColor(color).rgba, 1);
    this.tweens.add({ targets: toast, alpha: 0, delay: 1400, duration: 320, onComplete: () => toast.destroy() });
  }
}
