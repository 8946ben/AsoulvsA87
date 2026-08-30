import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { getCoins, isTechUnlocked, techRequiresMet, unlockTech } from '../core/Coins';
import { isDeveloperMode } from '../core/DeveloperMode';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { PLANTS } from '../data/plants';
import { COIN_PER_CLEAR, COIN_PER_INTACT_MOWER, TECH_NODES, type TechNode } from '../data/techTree';

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
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x070b1a, 0x141636, 0x1a2f40, 0x0a1420, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0xffd76a, 0.05); bg.fillCircle(640, 330, 320);
    bg.fillStyle(0x65e7ff, 0.04); bg.fillCircle(90, 640, 260); bg.fillCircle(1200, 110, 240);
    bg.lineStyle(1, 0xffd76a, 0.06);
    for (let x = 0; x <= GAME_WIDTH; x += 64) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, GAME_HEIGHT); bg.strokePath(); }
    for (let y = 0; y <= GAME_HEIGHT; y += 64) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(GAME_WIDTH, y); bg.strokePath(); }
  }

  private createHeader(): void {
    this.add.text(42, 26, '枝江商店', {
      fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#fdf6e3', fontStyle: 'bold',
    });
    this.add.text(43, 72, 'ZHIJIANG SHOP', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffd76a', fontStyle: 'bold', letterSpacing: 2,
    });
    this.add.text(GAME_WIDTH - 42, 34, `金币 ${getCoins()}`, {
      fontFamily: 'Microsoft YaHei', fontSize: '20px', color: '#ffd76a', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add.text(GAME_WIDTH - 42, 66, `通关固定 +${COIN_PER_CLEAR} 金币 · 每保留一辆完整小车 +${COIN_PER_INTACT_MOWER}`, {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#a08d5f',
    }).setOrigin(1, 0);
    if (isDeveloperMode()) {
      this.add.text(GAME_WIDTH - 42, 92, 'DEV MODE · 全部配方已开放', {
        fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#ffd86f',
      }).setOrigin(1, 0);
    }
  }

  private createNodes(): void {
    this.add.text(GAME_WIDTH / 2, 176, '— 融合配方 —', {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#d9c896', fontStyle: 'bold',
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
    const bg = this.add.rectangle(0, 0, w, h, unlocked ? 0x1a2b1e : 0x131a2c, 0.98)
      .setStrokeStyle(2, unlocked ? 0x65efad : affordable && requiresMet ? 0xffd76a : 0x3a4a5c, unlocked ? 0.9 : 0.6);

    const icon = this.add.image(0, -h / 2 + 78, config.texture);
    const src = icon.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    icon.setScale(Math.min(86 / src.width, 86 / src.height));
    if (!unlocked) icon.setAlpha(0.55).setTint(0x5a6a7a);

    const name = this.add.text(0, -h / 2 + 140, config.name, {
      fontFamily: 'Microsoft YaHei', fontSize: '21px', color: unlocked ? '#c8f7dd' : '#f4fbff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const formula = this.add.text(0, -h / 2 + 172, FORMULAS[node.id] ?? '', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#ffd76a',
    }).setOrigin(0.5);
    const desc = this.add.text(0, -h / 2 + 200, config.desc, {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#9db4c2',
      align: 'center', wordWrap: { width: w - 30 }, lineSpacing: 3,
    }).setOrigin(0.5, 0);

    container.add([bg, icon, name, formula, desc]);

    if (unlocked) {
      container.add(this.add.text(0, h / 2 - 44, '✓ 已解锁', {
        fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#65efad', fontStyle: 'bold',
      }).setOrigin(0.5));
      return;
    }
    if (!requiresMet) {
      container.add(this.add.text(0, h / 2 - 44, '需先解锁全部二重融合', {
        fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#75838e',
      }).setOrigin(0.5));
      return;
    }
    const label = affordable ? `解锁 · ${node.cost} 金币` : `金币不足 · 需要 ${node.cost}`;
    const button = sharpenText(this.add.text(0, h / 2 - 46, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', fontStyle: 'bold',
      color: affordable ? '#1d1404' : '#8a97a3', backgroundColor: affordable ? '#ffd76a' : '#22303e',
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
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#e5fbff',
      backgroundColor: '#17344a', padding: { x: 16, y: 9 },
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#285c76'));
    back.on('pointerout', () => back.setBackgroundColor('#17344a'));
    back.on('pointerdown', () => this.scene.start('LevelSelectScene'));
  }
}
