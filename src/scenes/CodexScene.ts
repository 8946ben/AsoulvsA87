import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { CODEX_PLANT_ORDER, PLANTS, type PlantConfig } from '../data/plants';
import { describeRelicEffects, RARITY_COLOR, RARITY_LABEL, RELICS, RELIC_ORDER, type RelicConfig } from '../data/relics';
import { ZOMBIES, type ZombieConfig, type ZombieType } from '../data/zombies';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';
import { createRelicIcon } from '../ui/RelicIcon';
import { type ParentSceneData, returnToParentScene } from '../core/SceneNavigation';

type CodexTab = 'allies' | 'enemies' | 'relics';
const COLUMNS = 4;
const PAGE_SIZE = COLUMNS * 2;

const ENEMY_ORDER: ZombieType[] = [
  'basic', 'cone', 'phone', 'flag', 'screen',
  'balloon', 'ladder', 'football', 'sled', 'miner',
  'bucket', 'pole', 'dragon',
];

const TAB_ORDER: CodexTab[] = ['allies', 'enemies', 'relics'];
const TAB_COUNT_TEXT: Record<CodexTab, (total: number) => string> = {
  allies: (total) => `我方角色 · ${total} 位（含融合）`,
  enemies: (total) => `已记录敌人 · ${total} 类`,
  relics: (total) => `枝江装备 · ${total} 件`,
};

/** 双方单位与藏品资料库：所有内容直接读取当前数据，避免图鉴与实际数值脱节。 */
export class CodexScene extends Phaser.Scene {
  static readonly KEY = 'CodexScene';
  private activeTab: CodexTab = 'allies';
  private content!: Phaser.GameObjects.Container;
  private tabButtons: Partial<Record<CodexTab, Phaser.GameObjects.Text>> = {};
  private countText!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Text;
  private returnScene?: string;
  private readonly pageByTab: Record<CodexTab, number> = { allies: 0, enemies: 0, relics: 0 };

  constructor() { super(CodexScene.KEY); }

  init(data: ParentSceneData): void { this.returnScene = data?.returnScene; }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.content = this.add.container(0, 0);
    this.createNavigation();
    this.switchTab('allies');
    this.input.keyboard?.on('keydown-ESC', () => returnToParentScene(this, this.returnScene));
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.repeat) return;
      this.switchTab(TAB_ORDER[(TAB_ORDER.indexOf(this.activeTab) + 1) % TAB_ORDER.length]);
    });
    this.input.keyboard?.on('keydown-LEFT', () => this.changePage(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changePage(1));
    sharpenSceneText(this);
  }

  private createBackground(): void {
    const bg = createFreshBackdrop(this, 'paper');
    bg.fillStyle(FRESH.CREAM, 0.86); bg.fillRoundedRect(22, 14, GAME_WIDTH - 44, 136, 24);
    bg.lineStyle(2, FRESH.BLUE, 0.28); bg.beginPath(); bg.moveTo(32, 153); bg.lineTo(GAME_WIDTH - 32, 153); bg.strokePath();
  }

  private createHeader(): void {
    this.add.text(42, 28, '枝江图鉴', { fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(43, 78, 'ZHIJIANG STICKER ARCHIVE', { fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2 });
    this.countText = this.add.text(GAME_WIDTH - 42, 48, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#60758a' }).setOrigin(1, 0);

    this.tabButtons.allies = this.createTabButton(430, 54, '我方阵容', () => this.switchTab('allies'));
    this.tabButtons.enemies = this.createTabButton(585, 54, '敌方档案', () => this.switchTab('enemies'));
    this.tabButtons.relics = this.createTabButton(740, 54, '枝江装备', () => this.switchTab('relics'));
    this.add.text(866, 58, 'TAB 切换', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a' });
  }

  private createTabButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#52667d',
      backgroundColor: '#edf7f4', padding: { x: 24, y: 11 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => { if (button !== this.tabButtons[this.activeTab]) button.setBackgroundColor('#dff1ed'); });
    button.on('pointerout', () => this.refreshTabs());
    button.on('pointerdown', onClick);
    return button;
  }

  private createNavigation(): void {
    const back = sharpenText(this.add.text(44, GAME_HEIGHT - 26, '← 返回上级页面  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d',
      backgroundColor: '#e6f5f4', padding: { x: 15, y: 9 },
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d1eeee'));
    back.on('pointerout', () => back.setBackgroundColor('#e6f5f4'));
    back.on('pointerdown', () => returnToParentScene(this, this.returnScene));
    this.prevButton = sharpenText(this.add.text(GAME_WIDTH / 2 - 92, GAME_HEIGHT - 25, '← 上一页', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#42506d',
      backgroundColor: '#e6f5f4', padding: { x: 13, y: 8 },
    })).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    this.nextButton = sharpenText(this.add.text(GAME_WIDTH / 2 + 92, GAME_HEIGHT - 25, '下一页 →', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#42506d',
      backgroundColor: '#e6f5f4', padding: { x: 13, y: 8 },
    })).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    this.pageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 31, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#60758a', fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    this.prevButton.on('pointerdown', () => this.changePage(-1));
    this.nextButton.on('pointerdown', () => this.changePage(1));
    this.add.text(GAME_WIDTH - 42, GAME_HEIGHT - 29, '图鉴数值与当前战斗版本同步', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a' }).setOrigin(1, 1);
  }

  private switchTab(tab: CodexTab): void {
    this.activeTab = tab;
    this.pageByTab[tab] = 0;
    this.renderCurrentPage();
    this.refreshTabs();
    sharpenSceneText(this);
  }

  private totalOfTab(tab: CodexTab): number {
    return tab === 'allies' ? CODEX_PLANT_ORDER.length : tab === 'enemies' ? ENEMY_ORDER.length : RELIC_ORDER.length;
  }

  private renderCurrentPage(): void {
    this.content.removeAll(true);
    if (this.activeTab === 'allies') this.renderAllies();
    else if (this.activeTab === 'enemies') this.renderEnemies();
    else this.renderRelics();
    const total = this.totalOfTab(this.activeTab);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = this.pageByTab[this.activeTab];
    this.countText.setText(TAB_COUNT_TEXT[this.activeTab](total));
    this.pageText.setText(`${page + 1} / ${pages}`);
    this.prevButton.setAlpha(page > 0 ? 1 : 0.34);
    this.nextButton.setAlpha(page < pages - 1 ? 1 : 0.34);
  }

  private changePage(delta: number): void {
    const maxPage = Math.max(0, Math.ceil(this.totalOfTab(this.activeTab) / PAGE_SIZE) - 1);
    const next = Phaser.Math.Clamp(this.pageByTab[this.activeTab] + delta, 0, maxPage);
    if (next === this.pageByTab[this.activeTab]) return;
    this.pageByTab[this.activeTab] = next;
    this.renderCurrentPage();
    sharpenSceneText(this);
  }

  private refreshTabs(): void {
    const styles: Record<CodexTab, { active: string; idle: string }> = {
      allies: { active: '#4eb3cf', idle: '#52667d' },
      enemies: { active: '#e46f98', idle: '#52667d' },
      relics: { active: '#e8a020', idle: '#52667d' },
    };
    for (const tab of TAB_ORDER) {
      const button = this.tabButtons[tab];
      const active = this.activeTab === tab;
      button?.setColor(active ? '#ffffff' : styles[tab].idle).setBackgroundColor(active ? styles[tab].active : '#edf7f4');
    }
  }

  private renderAllies(): void {
    const cardW = 286; const cardH = 232; const gapX = 16; const gapY = 14;
    const totalW = cardW * COLUMNS + gapX * (COLUMNS - 1); const startX = (GAME_WIDTH - totalW) / 2;
    const offset = this.pageByTab.allies * PAGE_SIZE;
    CODEX_PLANT_ORDER.slice(offset, offset + PAGE_SIZE).forEach((type, index) => {
      const col = index % COLUMNS; const row = Math.floor(index / COLUMNS);
      const x = startX + col * (cardW + gapX) + cardW / 2;
      const y = 164 + row * (cardH + gapY) + cardH / 2;
      this.content.add(this.createAllyCard(x, y, PLANTS[type], offset + index + 1, cardW, cardH));
    });
  }

  private createAllyCard(x: number, y: number, config: PlantConfig, index: number, w: number, h: number): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, FRESH.PAPER, 0.97).setStrokeStyle(2, config.accent, 0.32).setInteractive({ useHandCursor: true });
    const strip = this.add.rectangle(-w / 2 + 4, 0, 7, h - 10, config.accent, 0.86);
    const number = this.add.text(-w / 2 + 18, -h / 2 + 12, String(index).padStart(2, '0'), { fontFamily: 'Arial', fontSize: '11px', color: '#71809a', fontStyle: 'bold' });
    const imageX = -w / 2 + 61; const textX = -w / 2 + 116; const textW = w - 132;
    const image = this.fitImage(this.add.image(imageX, 16, config.texture), 86, 112);
    const name = this.add.text(textX, -86, config.name, { fontFamily: 'Microsoft YaHei', fontSize: '19px', color: '#42506d', fontStyle: 'bold' });
    const role = this.add.text(textX, -56, config.role, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: Phaser.Display.Color.IntegerToColor(config.accent).rgba });
    const fusion = config.type === 'xingkongtang' || config.type === 'xilanai' || config.type === 'jiaxinnaitang' || config.type === 'yigehun';
    const stats = this.add.text(textX, -9, fusion ? `融合单位 · 生命 ${config.hp}` : `应援 ${config.cost} · 生命 ${config.hp}`, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#a66b25' });
    const formula = config.type === 'xingkongtang'
      ? '贝极星＋嘉心糖'
      : config.type === 'xilanai' ? '贝极星＋奶淇琳' : config.type === 'jiaxinnaitang' ? '奶淇琳＋嘉心糖' : config.type === 'yigehun' ? '三张基础卡三重融合' : '';
    const cooldown = this.add.text(textX, 15, fusion ? formula : `冷却 ${(config.cooldown / 1000).toFixed(1)} 秒`, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#71809a' });
    const desc = this.add.text(textX, 41, config.desc, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#5e6f84', wordWrap: { width: textW, useAdvancedWrap: true }, lineSpacing: 3 });
    const quote = this.add.text(textX, -34, config.quote ? `“${config.quote}”` : '', { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#8a94a6', fontStyle: 'italic', wordWrap: { width: textW, useAdvancedWrap: true }, lineSpacing: 1 });
    card.add([bg, strip, number, image, name, role, stats, cooldown, desc, quote]);
    this.bindCardHover(card, bg, config.accent);
    return card;
  }

  private renderEnemies(): void {
    const cardW = 286; const cardH = 200; const gapX = 16; const gapY = 16;
    const totalW = cardW * COLUMNS + gapX * (COLUMNS - 1); const startX = (GAME_WIDTH - totalW) / 2;
    const offset = this.pageByTab.enemies * PAGE_SIZE;
    ENEMY_ORDER.slice(offset, offset + PAGE_SIZE).forEach((type, index) => {
      const col = index % COLUMNS; const row = Math.floor(index / COLUMNS);
      const x = startX + col * (cardW + gapX) + cardW / 2;
      const y = 164 + row * (cardH + gapY) + cardH / 2;
      this.content.add(this.createEnemyCard(x, y, ZOMBIES[type], offset + index + 1, cardW, cardH));
    });
  }

  private createEnemyCard(x: number, y: number, config: ZombieConfig, index: number, w: number, h: number): Phaser.GameObjects.Container {
    const accent = config.boss ? 0xd36aff : config.flagWave ? 0xffd15f : config.flying ? 0x78ddff : config.type === 'knight' ? 0xff557f : 0xff7598;
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, config.boss ? 0xffeef7 : 0xfff7f5, 0.97).setStrokeStyle(2, accent, config.boss ? 0.62 : 0.3).setInteractive({ useHandCursor: true });
    const strip = this.add.rectangle(-w / 2 + 4, 0, 7, h - 10, accent, 0.88);
    const number = this.add.text(-w / 2 + 18, -h / 2 + 12, `E-${String(index).padStart(2, '0')}`, { fontFamily: 'Arial', fontSize: '11px', color: '#9a6e7e', fontStyle: 'bold' });
    const imageX = -w / 2 + 61; const textX = -w / 2 + 116; const textW = w - 132;
    const image = this.fitImage(this.add.image(imageX, 14, config.texture), 92, 118);
    const name = this.add.text(textX, -76, config.name, { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#5a465f', fontStyle: 'bold' });
    const tags = [
      config.boss ? 'BOSS' : '', config.flagWave ? '大型波次标志' : '', config.flying ? '飞越植物' : '',
      config.enragedSpeedMultiplier ? '掉落手机后加速' : '', config.canVault ? '越过首个阻挡' : '',
      config.accessoryBreakHp && !config.enragedSpeedMultiplier ? '防具可破坏' : '', config.charge ? '高速冲锋' : '',
      config.crushPlants ? '碾压植物' : '', config.tunneling ? '钻地绕后' : '', config.summonInterval ? '召唤骑士' : '',
    ].filter(Boolean).join(' · ') || '敌方单位';
    const tag = this.add.text(textX, -48, tags, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold', wordWrap: { width: textW, useAdvancedWrap: true } });
    const stats = this.add.text(textX, -13, `生命 ${config.hp} · 移速 ${config.speed}`, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#9b5570' });
    const attack = this.add.text(textX, 12, `啃食 ${config.attackDps}/秒`, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#8c6b78' });
    const quote = this.add.text(textX, 40, `“${config.quote}”`, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#745f68', fontStyle: 'italic', wordWrap: { width: textW, useAdvancedWrap: true }, lineSpacing: 2 });
    card.add([bg, strip, number, image, name, tag, stats, attack, quote]);
    this.bindCardHover(card, bg, accent);
    return card;
  }

  private renderRelics(): void {
    const cardW = 286; const cardH = 232; const gapX = 16; const gapY = 14;
    const totalW = cardW * COLUMNS + gapX * (COLUMNS - 1); const startX = (GAME_WIDTH - totalW) / 2;
    const offset = this.pageByTab.relics * PAGE_SIZE;
    RELIC_ORDER.slice(offset, offset + PAGE_SIZE).forEach((id, index) => {
      const col = index % COLUMNS; const row = Math.floor(index / COLUMNS);
      const x = startX + col * (cardW + gapX) + cardW / 2;
      const y = 164 + row * (cardH + gapY) + cardH / 2;
      this.content.add(this.createRelicCard(x, y, RELICS[id], offset + index + 1, cardW, cardH));
    });
  }

  private createRelicCard(x: number, y: number, config: RelicConfig, index: number, w: number, h: number): Phaser.GameObjects.Container {
    const accent = RARITY_COLOR[config.rarity];
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, FRESH.PAPER, 0.97).setStrokeStyle(2, accent, 0.4).setInteractive({ useHandCursor: true });
    const strip = this.add.rectangle(-w / 2 + 4, 0, 7, h - 10, accent, 0.86);
    const number = this.add.text(-w / 2 + 18, -h / 2 + 12, `R-${String(index).padStart(2, '0')}`, { fontFamily: 'Arial', fontSize: '11px', color: '#71809a', fontStyle: 'bold' });
    const imageX = -w / 2 + 61; const textX = -w / 2 + 116; const textW = w - 132;
    const glyph = createRelicIcon(this, config, imageX, 14, 82, 82);
    const name = this.add.text(textX, -86, config.name, { fontFamily: 'Microsoft YaHei', fontSize: '19px', color: '#42506d', fontStyle: 'bold' });
    const rarity = this.add.text(textX, -56, `${RARITY_LABEL[config.rarity]}藏品 · 转盘抽取`, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold' });
    const effect = this.add.text(textX, -32, describeRelicEffects(config.effects).join('，'), { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#5e6f84', wordWrap: { width: textW, useAdvancedWrap: true }, lineSpacing: 3 });
    const allowed = this.add.text(textX, 8, config.allowedTypes ? `仅 ${config.allowedTypes.map((t) => PLANTS[t].name).join('、')} 可装配` : '全体角色可装配', { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#a66b25', fontStyle: 'bold', wordWrap: { width: textW, useAdvancedWrap: true }, lineSpacing: 2 });
    const quote = this.add.text(textX, 52, `“${config.quote}”`, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#8a94a6', fontStyle: 'italic', wordWrap: { width: textW, useAdvancedWrap: true }, lineSpacing: 2 });
    card.add([bg, strip, number, glyph, name, rarity, effect, allowed, quote]);
    this.bindCardHover(card, bg, accent, FRESH.PAPER, 0.4);
    return card;
  }

  private fitImage(image: Phaser.GameObjects.Image, maxW: number, maxH: number): Phaser.GameObjects.Image {
    const source = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const scale = Math.min(maxW / source.width, maxH / source.height);
    return image.setScale(scale);
  }

  private bindCardHover(card: Phaser.GameObjects.Container, bg: Phaser.GameObjects.Rectangle, accent: number, baseFill = FRESH.PAPER, baseStrokeAlpha = 0.3): void {
    bg.on('pointerover', () => {
      this.tweens.add({ targets: card, scale: 1.025, duration: 120, ease: 'Quad.easeOut' });
      bg.setFillStyle(Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(baseFill), Phaser.Display.Color.ValueToColor(accent), 100, 8).color, 0.98);
      bg.setStrokeStyle(2, accent, 0.8);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: card, scale: 1, duration: 120, ease: 'Quad.easeOut' });
      bg.setFillStyle(this.activeTab === 'enemies' ? 0xfff7f5 : baseFill, 0.97);
      bg.setStrokeStyle(2, accent, this.activeTab === 'enemies' ? 0.3 : baseStrokeAlpha);
    });
  }
}
