import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import type { RogueRunState } from '../core/RogueRun';

interface ResourceItem {
  kind: 'life' | 'support' | 'ticket';
  label: string;
  value: string;
  accent: number;
  background: number;
  title: string;
  description: string;
}

const ITEM_W = 126;
const ITEM_H = 46;
const GAP = 8;

/** 肉鸽模式统一资源栏。图标由 Phaser Graphics 绘制，不依赖额外图片文件。 */
export function createRogueResourceBar(scene: Phaser.Scene, run: RogueRunState, rightX = GAME_WIDTH - 28, topY = 46): Phaser.GameObjects.Container {
  const items: ResourceItem[] = [
    {
      kind: 'life', label: '生命值', value: `${run.stageHp}/${run.maxStageHp}`,
      accent: 0xe85f7f, background: 0xf6e6dc, title: '生命值 · 本次巡演的生存状态',
      description: '战斗失败和部分事件会损失生命值；降至 0 时，本次肉鸽巡演结束。可通过休整、战后维护和商店恢复。',
    },
    {
      kind: 'support', label: '应援值', value: String(run.hope),
      accent: 0xe79b35, background: 0xf1ecd9, title: '应援值 · 招募与进阶资源',
      description: '用于首次招募角色，或再次招募多段特性角色使其进阶至 Rank II。主要由战斗、升级和事件获得。',
    },
    {
      kind: 'ticket', label: '门票', value: String(run.tickets),
      accent: 0x3fa47b, background: 0xe8efe3, title: '门票 · 本局交易物',
      description: '在枝江小铺中使用，可兑换应援值或维修舞台恢复生命值。主要由战斗和沿途事件获得。',
    },
  ];
  const totalW = items.length * ITEM_W + (items.length - 1) * GAP;
  const bar = scene.add.container(rightX - totalW, topY).setDepth(240);
  const tooltip = createTooltip(scene, rightX - totalW / 2, topY + ITEM_H + 9);

  items.forEach((item, index) => {
    const x = index * (ITEM_W + GAP);
    const itemContainer = scene.add.container(x, 0);
    const bg = scene.add.rectangle(0, 0, ITEM_W, ITEM_H, item.background, 0.98).setOrigin(0).setStrokeStyle(1, item.accent, 0.32);
    const icon = createIcon(scene, item.kind, 20, ITEM_H / 2, item.accent);
    const label = scene.add.text(40, 7, item.label, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#63776c', fontStyle: 'bold' });
    const value = scene.add.text(ITEM_W - 10, 29, item.value, { fontFamily: 'Arial', fontSize: '17px', color: '#244c49', fontStyle: 'bold' }).setOrigin(1, 0.5);
    itemContainer.add([bg, icon, label, value]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(1, item.accent, 0.9); itemContainer.setScale(1.025);
      tooltip.setVisible(true); tooltip.getAt<Phaser.GameObjects.Text>(1).setText(item.title);
      tooltip.getAt<Phaser.GameObjects.Text>(2).setText(item.description);
    });
    bg.on('pointerout', () => { bg.setStrokeStyle(1, item.accent, 0.32); itemContainer.setScale(1); tooltip.setVisible(false); });
    bar.add(itemContainer);
  });
  return bar;
}

function createIcon(scene: Phaser.Scene, kind: ResourceItem['kind'], x: number, y: number, accent: number): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const graphics = scene.add.graphics();
  if (kind === 'life') {
    graphics.fillStyle(accent, 1); graphics.fillCircle(-5, -4, 7); graphics.fillCircle(5, -4, 7); graphics.fillTriangle(-12, -1, 12, -1, 0, 13);
    graphics.lineStyle(2, 0xffffff, 0.58); graphics.beginPath(); graphics.arc(-4, -5, 3, Math.PI, Math.PI * 1.75); graphics.strokePath();
  } else if (kind === 'support') {
    graphics.lineStyle(2, accent, 0.78);
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4; graphics.beginPath(); graphics.moveTo(Math.cos(angle) * 11, Math.sin(angle) * 11); graphics.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15); graphics.strokePath();
    }
    graphics.fillStyle(0xffd761, 1); graphics.fillCircle(0, 0, 11); graphics.lineStyle(2, accent, 0.85); graphics.strokeCircle(0, 0, 11);
    const star = scene.add.text(0, 1, '★', { fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    container.add(star);
  } else {
    graphics.fillStyle(0xfbf4cf, 1); graphics.fillRoundedRect(-16, -10, 32, 20, 4); graphics.lineStyle(2, accent, 0.9); graphics.strokeRoundedRect(-16, -10, 32, 20, 4);
    graphics.lineStyle(1, accent, 0.55); graphics.strokeCircle(0, 0, 6); graphics.fillStyle(accent, 0.86); graphics.fillCircle(-11, 0, 2); graphics.fillCircle(11, 0, 2);
    const mark = scene.add.text(0, 0, '票', { fontFamily: 'Microsoft YaHei', fontSize: '8px', color: '#397d65', fontStyle: 'bold' }).setOrigin(0.5);
    container.add(mark);
  }
  container.addAt(graphics, 0);
  return container;
}

function createTooltip(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y).setVisible(false).setDepth(260);
  const bg = scene.add.rectangle(0, 0, 398, 94, 0xfffdf5, 0.99).setOrigin(0.5, 0).setStrokeStyle(2, 0x34786c, 0.72);
  const title = scene.add.text(-178, 13, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#244c49', fontStyle: 'bold' });
  const description = scene.add.text(-178, 40, '', { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#63776c', lineSpacing: 4, wordWrap: { width: 356, useAdvancedWrap: true } });
  container.add([bg, title, description]);
  return container;
}


