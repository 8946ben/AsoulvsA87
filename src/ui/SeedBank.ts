import Phaser from 'phaser';
import { PALETTE, SEEDBANK_HEIGHT, TEX } from '../config/GameConfig';
import { PLANTS, type PlantConfig, type PlantType } from '../data/plants';

const CARD_W = 68;
const CARD_H = 104;
const CARD_GAP = 5;
const BANK_X = 8;
const BANK_W = 836;

export class SeedCard extends Phaser.GameObjects.Container {
  readonly config: PlantConfig;
  parentBank: SeedBank | null = null;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly costText: Phaser.GameObjects.Text;
  private readonly cooldownMask: Phaser.GameObjects.Graphics;
  private readonly cooldownText: Phaser.GameObjects.Text;
  private readonly highlight: Phaser.GameObjects.Graphics;
  private readonly statusDot: Phaser.GameObjects.Arc;
  private cooldownRemaining = 0;
  private selected = false;
  private affordable = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlantConfig) {
    super(scene, x, y); this.config = config;
    const frame = scene.add.image(0, 0, TEX.CARD_FRAME).setDisplaySize(CARD_W, CARD_H);
    const name = scene.add.text(0, -43, config.name, { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '13px', color: '#f3fbff', fontStyle: 'bold' }).setOrigin(0.5);
    this.icon = scene.add.image(0, -8, config.texture).setDisplaySize(54, 61);
    this.costText = scene.add.text(0, 41, String(config.cost), { fontFamily: 'Arial', fontSize: '15px', color: '#ffe07a', fontStyle: 'bold' }).setOrigin(0.5);
    this.statusDot = scene.add.circle(-24, 41, 3, config.accent, 1);
    this.cooldownMask = scene.add.graphics();
    this.cooldownText = scene.add.text(0, 4, '', { fontFamily: 'Arial', fontSize: '22px', color: '#fff', fontStyle: 'bold', stroke: '#101827', strokeThickness: 5 }).setOrigin(0.5).setVisible(false);
    this.highlight = scene.add.graphics();
    this.add([frame, name, this.icon, this.costText, this.statusDot, this.cooldownMask, this.cooldownText, this.highlight]);
    this.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: true }).setDepth(102);
    scene.add.existing(this);
    this.on('pointerover', () => { this.setScale(1.04); this.parentBank?.showTooltip(this); });
    this.on('pointerout', () => { this.setScale(1); this.parentBank?.hideTooltip(); });
  }

  get isReady(): boolean { return this.cooldownRemaining <= 0; }
  get isSelectable(): boolean { return this.isReady && this.affordable; }
  get plantType(): PlantType { return this.config.type; }
  startCooldown(): void { this.cooldownRemaining = this.config.cooldown; }
  setCooldown(ms: number): void { this.cooldownRemaining = ms; }
  setSelected(value: boolean): void { this.selected = value; this.y = SEEDBANK_HEIGHT / 2 - (value ? 5 : 0); this.drawHighlight(); }

  update(delta: number, sunAmount: number): void {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    this.affordable = sunAmount >= this.config.cost;
    const cooling = this.cooldownRemaining > 0;
    this.cooldownMask.clear();
    if (cooling) {
      const h = CARD_H * this.cooldownRemaining / this.config.cooldown;
      this.cooldownMask.fillStyle(0x07101e, 0.78); this.cooldownMask.fillRoundedRect(-CARD_W / 2, CARD_H / 2 - h, CARD_W, h, 7);
      this.cooldownText.setText(String(Math.ceil(this.cooldownRemaining / 1000))).setVisible(true);
    } else this.cooldownText.setVisible(false);
    this.icon.setAlpha(cooling ? 0.35 : this.affordable ? 1 : 0.42);
    this.icon.setTint(cooling ? 0x7890a5 : this.affordable ? 0xffffff : 0xff728e);
    this.costText.setColor(this.affordable ? '#ffe07a' : '#ff6c88');
    this.statusDot.setFillStyle(this.affordable && !cooling ? 0x65efad : 0xff657f);
    if ((!this.affordable || cooling) && this.selected) this.parentBank?.clearSelection();
  }

  private drawHighlight(): void {
    this.highlight.clear();
    if (!this.selected) return;
    this.highlight.fillStyle(this.config.accent, 0.13); this.highlight.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9);
    this.highlight.lineStyle(3, this.config.accent, 1); this.highlight.strokeRoundedRect(-CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2, 9);
  }
}

export class SeedBank {
  readonly cards: SeedCard[] = [];
  private selected: SeedCard | null = null;
  private readonly tooltip: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, types: PlantType[]) {
    this.tooltip = scene.add.text(0, 140, '', {
      fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '14px', color: '#effaff',
      backgroundColor: '#101a2bea', padding: { x: 12, y: 8 }, align: 'center',
    }).setOrigin(0.5, 0).setDepth(180).setVisible(false);
    const totalWidth = types.length * CARD_W + Math.max(0, types.length - 1) * CARD_GAP;
    const startX = BANK_X + (BANK_W - totalWidth) / 2 + CARD_W / 2;
    types.forEach((type, index) => {
      const card = new SeedCard(scene, startX + index * (CARD_W + CARD_GAP), SEEDBANK_HEIGHT / 2, PLANTS[type]);
      card.parentBank = this; card.on('pointerdown', () => this.toggleSelect(card)); this.cards.push(card);
    });
  }
  get selectedType(): PlantType | null { return this.selected?.isSelectable ? this.selected.plantType : null; }
  toggleSelect(card: SeedCard): void {
    if (!card.isSelectable) return;
    if (this.selected === card) { this.clearSelection(); return; }
    this.clearSelection(); this.selected = card; card.setSelected(true);
  }
  clearSelection(): void { if (this.selected) { this.selected.setSelected(false); this.selected = null; } }
  consumeSelected(): void { if (!this.selected) return; this.selected.startCooldown(); this.clearSelection(); }
  update(delta: number, sunAmount: number): void { for (const card of this.cards) card.update(delta, sunAmount); }
  applyInitialCooldown(ms: number): void { for (const card of this.cards) card.setCooldown(ms); }
  showTooltip(card: SeedCard): void { this.tooltip.setPosition(card.x, 132).setText(`${card.config.role}  ·  ${card.config.desc}`).setVisible(true); }
  hideTooltip(): void { this.tooltip.setVisible(false); }
}

export function createSeedBankBackground(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(98);
  g.fillStyle(0x0c1526, 0.97); g.fillRoundedRect(8, 8, 836, 116, 14);
  g.lineStyle(2, PALETTE.CARD_BORDER, 0.35); g.strokeRoundedRect(8, 8, 836, 116, 14);
  g.fillStyle(0x52d9ff, 0.06); g.fillRoundedRect(14, 14, 824, 18, 9);
  return g;
}
