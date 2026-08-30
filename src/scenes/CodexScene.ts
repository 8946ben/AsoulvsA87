import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { CODEX_PLANT_ORDER, PLANTS, type PlantConfig } from '../data/plants';
import { ZOMBIES, type ZombieConfig, type ZombieType } from '../data/zombies';

type CodexTab = 'allies' | 'enemies';
const PAGE_SIZE = 10;

const ENEMY_ORDER: ZombieType[] = [
  'basic', 'cone', 'phone', 'flag', 'screen',
  'balloon', 'ladder', 'football', 'sled', 'miner',
  'bucket', 'pole', 'knight', 'dragon', 'carol',
];

/** 双方单位资料库：所有内容直接读取当前战斗数据，避免图鉴与实际数值脱节。 */
export class CodexScene extends Phaser.Scene {
  static readonly KEY = 'CodexScene';
  private activeTab: CodexTab = 'allies';
  private content!: Phaser.GameObjects.Container;
  private allyTab!: Phaser.GameObjects.Text;
  private enemyTab!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Text;
  private readonly pageByTab: Record<CodexTab, number> = { allies: 0, enemies: 0 };

  constructor() { super(CodexScene.KEY); }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.content = this.add.container(0, 0);
    this.createNavigation();
    this.switchTab('allies');
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.repeat) return;
      this.switchTab(this.activeTab === 'allies' ? 'enemies' : 'allies');
    });
    this.input.keyboard?.on('keydown-LEFT', () => this.changePage(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changePage(1));
    sharpenSceneText(this);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060c1b, 0x111a39, 0x0c2935, 0x07131f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x5de6ff, 0.045); bg.fillCircle(80, 180, 260); bg.fillCircle(1170, 650, 330);
    bg.fillStyle(0xff70a7, 0.035); bg.fillCircle(1160, 110, 250);
    bg.lineStyle(1, 0x6fe9ff, 0.07);
    for (let x = 0; x <= GAME_WIDTH; x += 64) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, GAME_HEIGHT); bg.strokePath(); }
    for (let y = 0; y <= GAME_HEIGHT; y += 64) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(GAME_WIDTH, y); bg.strokePath(); }
    bg.fillStyle(0x081221, 0.94); bg.fillRect(0, 0, GAME_WIDTH, 154);
    bg.lineStyle(2, 0x62e7ff, 0.22); bg.beginPath(); bg.moveTo(32, 153); bg.lineTo(GAME_WIDTH - 32, 153); bg.strokePath();
  }

  private createHeader(): void {
    this.add.text(42, 28, '枝江图鉴', { fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#f4fcff', fontStyle: 'bold' });
    this.add.text(43, 78, 'STAGE DEFENSE ARCHIVE', { fontFamily: 'Arial', fontSize: '13px', color: '#66dff8', fontStyle: 'bold', letterSpacing: 2 });
    this.countText = this.add.text(GAME_WIDTH - 42, 48, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#8eafc0' }).setOrigin(1, 0);

    this.allyTab = this.createTabButton(430, 54, '我方阵容', () => this.switchTab('allies'));
    this.enemyTab = this.createTabButton(585, 54, '敌方档案', () => this.switchTab('enemies'));
    this.add.text(760, 58, 'TAB 切换', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#607f91' });
  }

  private createTabButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#a6c5d4',
      backgroundColor: '#152237', padding: { x: 24, y: 11 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => { if (button !== (this.activeTab === 'allies' ? this.allyTab : this.enemyTab)) button.setBackgroundColor('#20364f'); });
    button.on('pointerout', () => this.refreshTabs());
    button.on('pointerdown', onClick);
    return button;
  }

  private createNavigation(): void {
    const back = sharpenText(this.add.text(44, GAME_HEIGHT - 26, '← 返回主界面  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#dff8ff',
      backgroundColor: '#1d3850', padding: { x: 15, y: 9 },
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#2b5874'));
    back.on('pointerout', () => back.setBackgroundColor('#1d3850'));
    back.on('pointerdown', () => this.scene.start('MenuScene'));
    this.prevButton = sharpenText(this.add.text(GAME_WIDTH / 2 - 92, GAME_HEIGHT - 25, '← 上一页', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#dff8ff',
      backgroundColor: '#1d3850', padding: { x: 13, y: 8 },
    })).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    this.nextButton = sharpenText(this.add.text(GAME_WIDTH / 2 + 92, GAME_HEIGHT - 25, '下一页 →', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#dff8ff',
      backgroundColor: '#1d3850', padding: { x: 13, y: 8 },
    })).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    this.pageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 31, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#8eb4c7', fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    this.prevButton.on('pointerdown', () => this.changePage(-1));
    this.nextButton.on('pointerdown', () => this.changePage(1));
    this.add.text(GAME_WIDTH - 42, GAME_HEIGHT - 29, '图鉴数值与当前战斗版本同步', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#567487' }).setOrigin(1, 1);
  }

  private switchTab(tab: CodexTab): void {
    this.activeTab = tab;
    this.pageByTab[tab] = 0;
    this.renderCurrentPage();
    this.refreshTabs();
    sharpenSceneText(this);
  }

  private renderCurrentPage(): void {
    this.content.removeAll(true);
    if (this.activeTab === 'allies') this.renderAllies(); else this.renderEnemies();
    const total = this.activeTab === 'allies' ? CODEX_PLANT_ORDER.length : ENEMY_ORDER.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = this.pageByTab[this.activeTab];
    this.countText.setText(this.activeTab === 'allies' ? `我方角色 · ${total} 位（含融合）` : `已记录敌人 · ${total} 类`);
    this.pageText.setText(`${page + 1} / ${pages}`);
    this.prevButton.setAlpha(page > 0 ? 1 : 0.34);
    this.nextButton.setAlpha(page < pages - 1 ? 1 : 0.34);
  }

  private changePage(delta: number): void {
    const total = this.activeTab === 'allies' ? CODEX_PLANT_ORDER.length : ENEMY_ORDER.length;
    const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
    const next = Phaser.Math.Clamp(this.pageByTab[this.activeTab] + delta, 0, maxPage);
    if (next === this.pageByTab[this.activeTab]) return;
    this.pageByTab[this.activeTab] = next;
    this.renderCurrentPage();
    sharpenSceneText(this);
  }

  private refreshTabs(): void {
    const activeColor = '#effdff';
    const idleColor = '#95b3c2';
    this.allyTab?.setColor(this.activeTab === 'allies' ? activeColor : idleColor).setBackgroundColor(this.activeTab === 'allies' ? '#27617d' : '#152237');
    this.enemyTab?.setColor(this.activeTab === 'enemies' ? activeColor : idleColor).setBackgroundColor(this.activeTab === 'enemies' ? '#71354e' : '#152237');
  }

  private renderAllies(): void {
    const cardW = 228; const cardH = 204; const gapX = 14; const gapY = 18;
    const totalW = cardW * 5 + gapX * 4; const startX = (GAME_WIDTH - totalW) / 2;
    const offset = this.pageByTab.allies * PAGE_SIZE;
    CODEX_PLANT_ORDER.slice(offset, offset + PAGE_SIZE).forEach((type, index) => {
      const col = index % 5; const row = Math.floor(index / 5);
      const x = startX + col * (cardW + gapX) + cardW / 2;
      const y = 164 + row * (cardH + gapY) + cardH / 2;
      this.content.add(this.createAllyCard(x, y, PLANTS[type], offset + index + 1, cardW, cardH));
    });
  }

  private createAllyCard(x: number, y: number, config: PlantConfig, index: number, w: number, h: number): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x101b2d, 0.97).setStrokeStyle(2, config.accent, 0.32).setInteractive({ useHandCursor: true });
    const strip = this.add.rectangle(-w / 2 + 4, 0, 7, h - 10, config.accent, 0.86);
    const number = this.add.text(-w / 2 + 18, -h / 2 + 12, String(index).padStart(2, '0'), { fontFamily: 'Arial', fontSize: '11px', color: '#668599', fontStyle: 'bold' });
    const imageX = -w / 2 + 47; const textX = -w / 2 + 88; const textW = w - 102;
    const image = this.fitImage(this.add.image(imageX, 13, config.texture), 66, 90);
    const name = this.add.text(textX, -72, config.name, { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#f5fcff', fontStyle: 'bold' });
    const role = this.add.text(textX, -43, config.role, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(config.accent).rgba });
    const fusion = config.type === 'xingkongtang' || config.type === 'xilanai' || config.type === 'jiaxinnaitang' || config.type === 'yigehun';
    const stats = this.add.text(textX, -12, fusion ? `融合单位 · 生命 ${config.hp}` : `应援 ${config.cost} · 生命 ${config.hp}`, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#ffdd86' });
    const formula = config.type === 'xingkongtang'
      ? '贝极星＋嘉心糖'
      : config.type === 'xilanai' ? '贝极星＋奶淇琳' : config.type === 'jiaxinnaitang' ? '奶淇琳＋嘉心糖' : config.type === 'yigehun' ? '三张基础卡三重融合' : '';
    const cooldown = this.add.text(textX, 14, fusion ? formula : `冷却 ${(config.cooldown / 1000).toFixed(1)} 秒`, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#7e9eb0' });
    const desc = this.add.text(textX, 40, config.desc, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#c6dce6', wordWrap: { width: textW, useAdvancedWrap: true }, lineSpacing: 2 });
    card.add([bg, strip, number, image, name, role, stats, cooldown, desc]);
    this.bindCardHover(card, bg, config.accent);
    return card;
  }

  private renderEnemies(): void {
    const cardW = 228; const cardH = 154; const gapX = 14; const gapY = 14;
    const totalW = cardW * 5 + gapX * 4; const startX = (GAME_WIDTH - totalW) / 2;
    const offset = this.pageByTab.enemies * PAGE_SIZE;
    ENEMY_ORDER.slice(offset, offset + PAGE_SIZE).forEach((type, index) => {
      const col = index % 5; const row = Math.floor(index / 5);
      const x = startX + col * (cardW + gapX) + cardW / 2;
      const y = 164 + row * (cardH + gapY) + cardH / 2;
      this.content.add(this.createEnemyCard(x, y, ZOMBIES[type], offset + index + 1, cardW, cardH));
    });
  }

  private createEnemyCard(x: number, y: number, config: ZombieConfig, index: number, w: number, h: number): Phaser.GameObjects.Container {
    const accent = config.boss ? 0xd36aff : config.flagWave ? 0xffd15f : config.flying ? 0x78ddff : config.type === 'knight' ? 0xff557f : 0xff7598;
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, config.boss ? 0x1d112b : 0x171724, 0.97).setStrokeStyle(2, accent, config.boss ? 0.62 : 0.3).setInteractive({ useHandCursor: true });
    const strip = this.add.rectangle(-w / 2 + 4, 0, 7, h - 10, accent, 0.88);
    const number = this.add.text(-w / 2 + 18, -h / 2 + 12, `E-${String(index).padStart(2, '0')}`, { fontFamily: 'Arial', fontSize: '11px', color: '#8b6575', fontStyle: 'bold' });
    const image = this.fitImage(this.add.image(-73, 8, config.texture), 72, 86);
    const name = this.add.text(-31, -56, config.name, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#fff5f8', fontStyle: 'bold' });
    const tags = [
      config.boss ? 'BOSS' : '', config.flagWave ? '大型波次标志' : '', config.flying ? '飞越植物' : '',
      config.enragedSpeedMultiplier ? '掉落手机后加速' : '', config.canVault ? '越过首个阻挡' : '',
      config.accessoryBreakHp && !config.enragedSpeedMultiplier ? '防具可破坏' : '', config.charge ? '高速冲锋' : '',
      config.crushPlants ? '碾压植物' : '', config.tunneling ? '钻地绕后' : '', config.summonInterval ? '召唤骑士' : '',
    ].filter(Boolean).join(' · ') || '敌方单位';
    const tag = this.add.text(-31, -32, tags, { fontFamily: 'Microsoft YaHei', fontSize: '8px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, fontStyle: 'bold', wordWrap: { width: 128, useAdvancedWrap: true } });
    const stats = this.add.text(-31, -7, `生命 ${config.hp} · 移速 ${config.speed}`, { fontFamily: 'Microsoft YaHei', fontSize: '9px', color: '#ffd1dc' });
    const attack = this.add.text(-31, 12, `啃食 ${config.attackDps}/秒`, { fontFamily: 'Microsoft YaHei', fontSize: '9px', color: '#c49aa8' });
    const quote = this.add.text(-31, 34, `“${config.quote}”`, { fontFamily: 'Microsoft YaHei', fontSize: '9px', color: '#c7b7c0', fontStyle: 'italic', wordWrap: { width: 128, useAdvancedWrap: true }, lineSpacing: 1 });
    card.add([bg, strip, number, image, name, tag, stats, attack, quote]);
    this.bindCardHover(card, bg, accent);
    return card;
  }

  private fitImage(image: Phaser.GameObjects.Image, maxW: number, maxH: number): Phaser.GameObjects.Image {
    const source = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const scale = Math.min(maxW / source.width, maxH / source.height);
    return image.setScale(scale);
  }

  private bindCardHover(card: Phaser.GameObjects.Container, bg: Phaser.GameObjects.Rectangle, accent: number): void {
    bg.on('pointerover', () => {
      this.tweens.add({ targets: card, scale: 1.025, duration: 120, ease: 'Quad.easeOut' });
      bg.setFillStyle(Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x101b2d), Phaser.Display.Color.ValueToColor(accent), 100, 10).color, 0.98);
      bg.setStrokeStyle(2, accent, 0.8);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: card, scale: 1, duration: 120, ease: 'Quad.easeOut' });
      bg.setFillStyle(this.activeTab === 'allies' ? 0x101b2d : 0x171724, 0.97);
      bg.setStrokeStyle(2, accent, this.activeTab === 'allies' ? 0.32 : 0.3);
    });
  }
}
