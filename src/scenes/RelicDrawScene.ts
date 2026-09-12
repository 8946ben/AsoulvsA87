import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { getStardust, spendStardust } from '../core/Collection';
import { consumeDrawTicket, drawRandomRelic, getDrawTickets, getOwnedRelics, getRelicHolder, RELIC_DRAW_STARDUST_COST } from '../core/Relics';
import { describeRelicEffects, RARITY_COLOR, RARITY_LABEL, RELICS, RELIC_ORDER, type RelicConfig } from '../data/relics';
import { PLANTS } from '../data/plants';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

const WHEEL_X = 400;
const WHEEL_Y = 408;
const WHEEL_R = 216;
const SECTOR = 360 / RELIC_ORDER.length;

/**
 * 枝江藏品抽卡转盘：消耗星愿徽记或答题券转动转盘，随机获得未持有的藏品。
 * 答题入口也在此场景，QuizScene 结算后返回这里。
 */
export class RelicDrawScene extends Phaser.Scene {
  static readonly KEY = 'RelicDrawScene';
  private wheel!: Phaser.GameObjects.Container;
  private resultLayer!: Phaser.GameObjects.Container;
  private stardustText!: Phaser.GameObjects.Text;
  private ticketText!: Phaser.GameObjects.Text;
  private stardustButton!: Phaser.GameObjects.Text;
  private ticketButton!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private poolMarks: Phaser.GameObjects.Text[] = [];
  private spinning = false;

  constructor() { super(RelicDrawScene.KEY); }

  create(): void {
    createFreshBackdrop(this, 'sunny');
    this.spinning = false;
    this.createHeader();
    this.createWheel();
    this.createPanel();
    this.resultLayer = this.add.container(0, 0).setDepth(300);
    this.createBackButton();
    this.refresh();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('BackpackScene', { tab: 'relics' }));
    sharpenSceneText(this);
  }

  private createHeader(): void {
    this.add.text(42, 26, '枝江藏品 · 抽卡转盘', { fontFamily: 'Microsoft YaHei', fontSize: '32px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(43, 70, 'ZHIJIANG RELIC ROULETTE', { fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2 });
    this.add.text(42, 100, '消耗星愿徽记或答题券转动转盘，随机收录枝江藏品。', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#60758a' });
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
      const glyphR = WHEEL_R * 0.66;
      const glyph = this.add.text(Math.cos(mid) * glyphR, Math.sin(mid) * glyphR, relic.glyph, { fontSize: '34px' })
        .setOrigin(0.5).setRotation(mid + Math.PI / 2);
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
    pointer;
  }

  private createPanel(): void {
    const panelX = 705; const panelY = 408;
    this.add.rectangle(panelX + 267, panelY, 534, 548, FRESH.PAPER, 0.96).setStrokeStyle(2, FRESH.MINT, 0.42);
    this.add.text(732, 150, '抽取方式', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });

    this.stardustButton = this.makeAction(`${RELIC_DRAW_STARDUST_COST} ✦ 抽一次`, '#e85f91', () => this.tryDraw('stardust'));
    this.stardustButton.setPosition(panelX + 132, 208);
    this.ticketButton = this.makeAction('答题券抽一次', '#58bd92', () => this.tryDraw('ticket'));
    this.ticketButton.setPosition(panelX + 400, 208);

    const quizButton = this.makeAction('去答题赢抽奖券（10 题对 8 题）', '#4eb3cf', () => this.scene.start('QuizScene'));
    quizButton.setPosition(panelX + 267, 268).setFontSize('14px');

    this.add.text(732, 306, '藏品奖池', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    RELIC_ORDER.forEach((id, index) => {
      const relic = RELICS[id];
      const y = 338 + index * 44;
      const accent = RARITY_COLOR[relic.rarity];
      const row = this.add.rectangle(panelX + 267, y, 498, 38, 0xfffaf0, 0.9).setStrokeStyle(1, accent, 0.28);
      const glyph = this.add.text(748, y, relic.glyph, { fontSize: '20px' }).setOrigin(0.5);
      const name = this.add.text(776, y, relic.name, { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0, 0.5);
      const rarity = this.add.text(876, y, RARITY_LABEL[relic.rarity], { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold' }).setOrigin(0, 0.5);
      const effect = this.add.text(936, y, describeRelicEffects(relic.effects)[0] ?? '', { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#71809a' }).setOrigin(0, 0.5);
      const mark = this.add.text(panelX + 500, y, '', { fontFamily: 'Microsoft YaHei', fontSize: '11px', fontStyle: 'bold' }).setOrigin(1, 0.5);
      this.poolMarks.push(mark);
      void row; void glyph; void name; void rarity; void effect;
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
    const back = sharpenText(this.add.text(42, GAME_HEIGHT - 24, '← 返回背包  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', backgroundColor: '#e6f5f4', padding: { x: 15, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d1eeee'));
    back.on('pointerout', () => back.setBackgroundColor('#e6f5f4'));
    back.on('pointerdown', () => this.scene.start('BackpackScene', { tab: 'relics' }));
  }

  private refresh(): void {
    const stardust = getStardust();
    const tickets = getDrawTickets();
    const owned = getOwnedRelics();
    const complete = owned.length >= RELIC_ORDER.length;
    this.stardustText.setText(`✦ 星愿徽记  ${Number.isFinite(stardust) ? stardust : '∞'}`);
    this.ticketText.setText(`🎟 答题券  ${Number.isFinite(tickets) ? tickets : '∞'}`);
    this.progressText.setText(`藏品收录  ${owned.length} / ${RELIC_ORDER.length}`);
    this.stardustButton.setAlpha(!complete && (Number.isFinite(stardust) ? stardust >= RELIC_DRAW_STARDUST_COST : true) ? 1 : 0.45);
    this.ticketButton.setAlpha(!complete && (Number.isFinite(tickets) ? tickets >= 1 : true) ? 1 : 0.45);
    RELIC_ORDER.forEach((id, index) => {
      const isOwned = owned.includes(id);
      const holder = getRelicHolder(id);
      this.poolMarks[index]?.setText(isOwned ? (holder ? `装配·${PLANTS[holder].name}` : '已入库') : '未获得')
        .setColor(isOwned ? (holder ? '#d7527c' : '#348c72') : '#9aa8a4');
    });
    sharpenSceneText(this);
  }

  private tryDraw(currency: 'stardust' | 'ticket'): void {
    if (this.spinning) return;
    if (getOwnedRelics().length >= RELIC_ORDER.length) {
      this.cameras.main.shake(100, 0.003);
      this.showToast('藏品已全部集齐！', 0xffd46f);
      return;
    }
    if (currency === 'stardust' && !spendStardust(RELIC_DRAW_STARDUST_COST)) {
      this.cameras.main.shake(100, 0.004);
      this.showToast(`星愿徽记不足，还差 ${RELIC_DRAW_STARDUST_COST - getStardust()} ✦`, 0xff6585);
      return;
    }
    if (currency === 'ticket' && !consumeDrawTicket()) {
      this.cameras.main.shake(100, 0.004);
      this.showToast('答题券不足：先去答题赢取吧', 0xff6585);
      return;
    }
    const result = drawRandomRelic();
    if (!result) { this.refresh(); return; }
    this.spinning = true;
    this.refresh();
    this.spinTo(result, () => {
      this.spinning = false;
      this.cameras.main.flash(200, 255, 233, 200, false);
      this.showResult(result);
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

  private showResult(relic: RelicConfig): void {
    this.resultLayer.removeAll(true);
    const accent = RARITY_COLOR[relic.rarity];
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, FRESH.INK, 0.5).setInteractive();
    const card = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 460, 330, 0xfffffb, 0.99)
      .setStrokeStyle(3, accent, 0.85);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118, '恭喜收录新藏品！', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#e85f91', fontStyle: 'bold' }).setOrigin(0.5);
    const glyph = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 34, relic.glyph, { fontSize: '64px' }).setOrigin(0.5);
    const name = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 42, `${relic.name} · ${RARITY_LABEL[relic.rarity]}`, { fontFamily: 'Microsoft YaHei', fontSize: '24px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0.5);
    const effect = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 82, describeRelicEffects(relic.effects).join('，'), { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#52667d', wordWrap: { width: 400, useAdvancedWrap: true } }).setOrigin(0.5);
    const confirm = this.makeAction('收下！', '#e85f91', () => { this.resultLayer.removeAll(true); this.refresh(); });
    confirm.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130);
    this.resultLayer.add([overlay, card, title, glyph, name, effect, confirm]);
    sharpenSceneText(this);
  }

  private showToast(message: string, color: number): void {
    const toast = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, message, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', backgroundColor: '#fffaf1ee', padding: { x: 16, y: 8 } })).setOrigin(0.5, 1).setDepth(190);
    toast.setStroke(Phaser.Display.Color.IntegerToColor(color).rgba, 1);
    this.tweens.add({ targets: toast, alpha: 0, delay: 1400, duration: 320, onComplete: () => toast.destroy() });
  }
}
