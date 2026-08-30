import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { getCoins, isTechUnlocked, techRequiresMet, unlockTech } from '../core/Coins';
import { isDeveloperMode } from '../core/DeveloperMode';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { PLANTS } from '../data/plants';
import { COIN_PER_CLEAR, COIN_PER_INTACT_MOWER, TECH_NODES, type TechNode } from '../data/techTree';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

const FORMULAS: Record<string, string> = {
  xingkongtang: '贝极星 ＋ 嘉心糖',
  xilanai: '贝极星 ＋ 奶淇琳',
  jiaxinnaitang: '奶淇琳 ＋ 嘉心糖',
  yigehun: '二重融合 ＋ 第三张基础卡',
};

export class ShopScene extends Phaser.Scene {
  static readonly KEY = 'ShopScene';

  constructor() { super(ShopScene.KEY); }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.createNodes();
    this.createNavigation();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LevelSelectScene'));
    sharpenSceneText(this);
  }

  private createBackground(): void {
    createFreshBackdrop(this, 'sunny');
  }

  private createHeader(): void {
    this.add.text(42, 26, '枝江商店', {
      fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#42506d', fontStyle: 'bold',
    });
    this.add.text(43, 72, 'ZHIJIANG SHOP', {
      fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2,
    });
    this.add.text(GAME_WIDTH - 42, 34, `金币 ${getCoins()}`, {
      fontFamily: 'Microsoft YaHei', fontSize: '20px', color: '#9b6b22', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add.text(GAME_WIDTH - 42, 66, `通关固定 +${COIN_PER_CLEAR} 金币 · 每保留一辆完整小车 +${COIN_PER_INTACT_MOWER}`, {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a',
    }).setOrigin(1, 0);
    if (isDeveloperMode()) {
      this.add.text(GAME_WIDTH - 42, 92, 'DEV MODE · 全部配方已开放', {
        fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#b47724',
      }).setOrigin(1, 0);
    }
  }

  private createNodes(): void {
    this.add.text(GAME_WIDTH / 2, 176, '— 融合配方 —', {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#766593', fontStyle: 'bold',
    }).setOrigin(0.5);
    const cardW = 272; const cardH = 330; const gap = 26;
    const totalW = cardW * TECH_NODES.length + gap * (TECH_NODES.length - 1);
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    TECH_NODES.forEach((node, index) => {
      this.createNodeCard(startX + index * (cardW + gap), 385, cardW, cardH, node);
    });
  }

  private createNodeCard(x: number, y: number, w: number, h: number, node: TechNode): void {
    const config = PLANTS[node.id];
    const unlocked = isTechUnlocked(node.id);
    const requiresMet = techRequiresMet(node.id);
    const affordable = getCoins() >= node.cost;

    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, unlocked ? 0xe9f8ef : FRESH.PAPER, 0.97)
      .setStrokeStyle(2, unlocked ? FRESH.MINT : affordable && requiresMet ? FRESH.GOLD : 0xbac8c3, unlocked ? 0.86 : 0.55);

    const icon = this.add.image(0, -h / 2 + 78, config.texture);
    const src = icon.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    icon.setScale(Math.min(86 / src.width, 86 / src.height));
    if (!unlocked) icon.setAlpha(0.58).setTint(0xaebdb8);

    const name = this.add.text(0, -h / 2 + 140, config.name, {
      fontFamily: 'Microsoft YaHei', fontSize: '21px', color: unlocked ? '#2f8066' : '#42506d', fontStyle: 'bold',
    }).setOrigin(0.5);
    const formula = this.add.text(0, -h / 2 + 172, FORMULAS[node.id] ?? '', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#a66b25',
    }).setOrigin(0.5);
    const desc = this.add.text(0, -h / 2 + 200, config.desc, {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#60758a',
      align: 'center', wordWrap: { width: w - 30 }, lineSpacing: 3,
    }).setOrigin(0.5, 0);

    container.add([bg, icon, name, formula, desc]);

    if (unlocked) {
      container.add(this.add.text(0, h / 2 - 44, '✓ 已解锁', {
        fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#2f9a75', fontStyle: 'bold',
      }).setOrigin(0.5));
      return;
    }
    if (!requiresMet) {
      container.add(this.add.text(0, h / 2 - 44, '需先解锁全部二重融合', {
        fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#87938f',
      }).setOrigin(0.5));
      return;
    }
    const label = affordable ? `解锁 · ${node.cost} 金币` : `金币不足 · 需要 ${node.cost}`;
    const button = sharpenText(this.add.text(0, h / 2 - 46, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', fontStyle: 'bold',
      color: affordable ? '#704d18' : '#87938f', backgroundColor: affordable ? '#ffe39a' : '#e5ece8',
      padding: { x: 20, y: 10 },
    })).setOrigin(0.5);
    container.add(button);
    if (!affordable) return;
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.05));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => {
      if (!unlockTech(node.id)) return;
      this.cameras.main.flash(220, 255, 215, 106, false);
      this.scene.restart();
    });
  }

  private createNavigation(): void {
    const back = sharpenText(this.add.text(42, GAME_HEIGHT - 23, '← 返回选关  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d',
      backgroundColor: '#e6f5f4', padding: { x: 16, y: 9 },
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d1eeee'));
    back.on('pointerout', () => back.setBackgroundColor('#e6f5f4'));
    back.on('pointerdown', () => this.scene.start('LevelSelectScene'));
  }
}
