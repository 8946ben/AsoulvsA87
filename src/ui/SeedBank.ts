import Phaser from 'phaser';
import { PALETTE, SEEDBANK_HEIGHT, TEX } from '../config/GameConfig';
import { PLANTS, type PlantConfig, type PlantType } from '../data/plants';

const CARD_W = 60;
const CARD_H = 88;
const CARD_GAP = 6;
/** 起始位置需避开左上角阳光计数器面板（占 x=8~102），否则首张卡会被压住 */
const CARD_START_X = 110;
/** 卡片栏背景宽度：覆盖全部 6 张卡（110 + 6×60 + 5×6 = 530），
 *  再留一点余量；同时不得压到右侧关卡进度条（x=620）。 */
const SEEDBANK_BG_W = 545;

/** 单张植物卡片：负责冷却、费用、可选/选中状态的可视化 */
export class SeedCard extends Phaser.GameObjects.Container {
  readonly config: PlantConfig;

  /** 由 SeedBank 注入，用于卡片自动取消选中时通知父级 */
  parentBank: SeedBank | null = null;

  private readonly icon: Phaser.GameObjects.Image;
  private readonly costText: Phaser.GameObjects.Text;
  private readonly cooldownMask: Phaser.GameObjects.Graphics;
  private readonly cooldownText: Phaser.GameObjects.Text;
  private readonly highlight: Phaser.GameObjects.Graphics;

  private cooldownRemaining = 0;
  private selected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlantConfig) {
    super(scene, x, y);
    this.config = config;

    const frame = scene.add.image(0, 0, TEX.CARD_FRAME);
    frame.setDisplaySize(CARD_W, CARD_H);

    this.icon = scene.add.image(0, -10, config.texture);
    this.icon.setDisplaySize(52, 60);

    this.costText = scene.add
      .text(0, 30, String(config.cost), {
        fontFamily: 'Arial',
        fontSize: '17px',
        color: '#FFE680',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.cooldownText = scene.add
      .text(0, 6, '', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.cooldownMask = scene.add.graphics();
    this.highlight = scene.add.graphics();

    this.add([
      frame,
      this.icon,
      this.costText,
      this.cooldownMask,
      this.cooldownText,
      this.highlight,
    ]);

    this.setSize(CARD_W, CARD_H);
    this.setInteractive({ useHandCursor: true });

    scene.add.existing(this);
    this.refresh(0);
  }

  get isReady(): boolean {
    return this.cooldownRemaining <= 0;
  }

  get plantType(): PlantType {
    return this.config.type;
  }

  /** 开始冷却并立即刷新显示 */
  startCooldown(): void {
    this.cooldownRemaining = this.config.cooldown;
    this.refresh(0);
  }

  /** 直接设置剩余冷却时间（用于开局统一冷却） */
  setCooldown(ms: number): void {
    this.cooldownRemaining = ms;
    this.refresh(0);
  }

  setSelected(value: boolean): void {
    this.selected = value;
    this.drawHighlight();
  }

  /** 每帧推进冷却；sunAmount 用于判断是否买得起 */
  update(delta: number, sunAmount: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    }
    this.refresh(sunAmount);
  }

  /**
   * 三种状态必须一眼可分：
   *   冷却中   → 黑色遮罩从底部退去 + 倒计时秒数
   *   阳光不够 → 图标压暗染红 + 费用文字变红（不叠遮罩）
   *   可用     → 完全正常
   */
  private refresh(sunAmount: number): void {
    const cooling = this.cooldownRemaining > 0;
    const ratio = this.cooldownRemaining / this.config.cooldown;
    const affordable = sunAmount >= this.config.cost;

    // 冷却遮罩 + 倒计时
    this.cooldownMask.clear();
    if (cooling) {
      const h = CARD_H * ratio;
      this.cooldownMask.fillStyle(0x000000, 0.68);
      this.cooldownMask.fillRect(-CARD_W / 2, CARD_H / 2 - h, CARD_W, h);
      this.cooldownText
        .setText(String(Math.ceil(this.cooldownRemaining / 1000)))
        .setVisible(true);
    } else {
      this.cooldownText.setVisible(false);
    }

    // 可用性与「买不起」的区分
    if (cooling) {
      this.icon.setAlpha(0.5);
      this.icon.setTint(0x9e9e9e);
    } else if (!affordable) {
      this.icon.setAlpha(0.65);
      this.icon.setTint(0xff9a9a);
    } else {
      this.icon.setAlpha(1);
      this.icon.clearTint();
    }
    this.costText.setColor(affordable ? '#FFE680' : '#FF6B6B');

    this.drawHighlight();

    // 冷却中或买不起时，自动取消选中
    if ((cooling || !affordable) && this.selected) {
      this.selected = false;
      this.drawHighlight();
      this.parentBank?.clearSelection();
    }
  }

  private drawHighlight(): void {
    this.highlight.clear();
    if (!this.selected) return;
    this.highlight.lineStyle(3, 0xffe680, 1);
    this.highlight.strokeRoundedRect(-CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2, 6);
  }
}

/** 卡片栏：管理一组卡片与当前选中的植物 */
export class SeedBank {
  readonly cards: SeedCard[] = [];
  private selected: SeedCard | null = null;

  constructor(scene: Phaser.Scene, types: PlantType[]) {
    types.forEach((type, index) => {
      const card = new SeedCard(
        scene,
        CARD_START_X + index * (CARD_W + CARD_GAP) + CARD_W / 2,
        SEEDBANK_HEIGHT / 2,
        PLANTS[type],
      );
      card.parentBank = this;
      card.on('pointerdown', () => this.toggleSelect(card));
      this.cards.push(card);
    });
  }

  get selectedType(): PlantType | null {
    return this.selected && this.selected.isReady ? this.selected.plantType : null;
  }

  toggleSelect(card: SeedCard): void {
    if (!card.isReady) return;
    if (this.selected === card) {
      this.clearSelection();
      return;
    }
    this.clearSelection();
    this.selected = card;
    card.setSelected(true);
  }

  clearSelection(): void {
    if (this.selected) {
      this.selected.setSelected(false);
      this.selected = null;
    }
  }

  /** 种植成功后让对应卡片进入冷却 */
  consumeSelected(): void {
    if (!this.selected) return;
    this.selected.startCooldown();
    this.clearSelection();
  }

  update(delta: number, sunAmount: number): void {
    for (const card of this.cards) card.update(delta, sunAmount);
  }

  /** 初始化时给所有卡片施加一点初始冷却，模拟原版开局节奏 */
  applyInitialCooldown(ms: number): void {
    for (const card of this.cards) {
      card.setCooldown(ms);
    }
  }

  destroy(): void {
    for (const card of this.cards) card.destroy();
    this.cards.length = 0;
  }
}

/** 卡片栏背景条 */
export function createSeedBankBackground(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x3d2f1f, 0.95);
  g.fillRect(0, 0, SEEDBANK_BG_W, SEEDBANK_HEIGHT);
  g.lineStyle(2, PALETTE.CARD_BORDER, 1);
  g.strokeRect(0, 0, SEEDBANK_BG_W, SEEDBANK_HEIGHT);
  g.setDepth(90);
  return g;
}
