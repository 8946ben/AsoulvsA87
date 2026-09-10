import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

export type RogueBackdropVariant = 'hub' | 'setup' | 'map' | 'event' | 'recruit' | 'reward' | 'summary';

/** 巡演手册：暖白纸面、深青墨色、朱红重点，共用于全部巡演页面。 */
export const TOUR = {
  ink: 0x244c49, muted: 0x74877e, paper: 0xfffdf5, line: 0xd5ded2,
  teal: 0x34786c, coral: 0xd96650, gold: 0xd8ac58, mint: 0xe8efe3,
  text: '#244c49', subtext: '#63776c', red: '#c65b47', white: '#fffdf5',
};

export function tourText(scene: Phaser.Scene, x: number, y: number, text: string, size = 14, color = TOUR.text, bold = false): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal' });
}

/** 中心定位的纸质面板，可与卡片内容一起移动。 */
export function tourPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, accent = TOUR.line, fill = TOUR.paper): Phaser.GameObjects.Container {
  const panel = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(TOUR.ink, 0.07); g.fillRoundedRect(-width / 2 + 3, -height / 2 + 6, width, height, 14);
  g.fillStyle(fill, 1); g.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
  g.lineStyle(1, accent, 0.85); g.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
  panel.add(g);
  return panel;
}

export function tourButton(scene: Phaser.Scene, x: number, y: number, width: number, label: string, action: () => void, secondary = false): Phaser.GameObjects.Container {
  const button = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, width, 46, secondary ? TOUR.mint : TOUR.coral).setStrokeStyle(1, secondary ? TOUR.line : TOUR.coral);
  const text = tourText(scene, 0, 0, label, 15, secondary ? TOUR.text : TOUR.white, true).setOrigin(0.5);
  button.add([bg, text]);
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => { bg.setFillStyle(secondary ? 0xdbe8d9 : 0xbf5745); button.y = y - 2; });
  bg.on('pointerout', () => { bg.setFillStyle(secondary ? TOUR.mint : TOUR.coral); button.y = y; });
  bg.on('pointerdown', action);
  return button;
}

export function tourPortrait(scene: Phaser.Scene, x: number, y: number, texture: string, width: number, height: number): Phaser.GameObjects.Image {
  const portrait = scene.add.image(x, y, texture);
  const source = portrait.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  return portrait.setScale(Math.min(width / source.width, height / source.height));
}

export function createRogueBackdrop(scene: Phaser.Scene, variant: RogueBackdropVariant): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(-20);
  g.fillStyle(0xf0f1e7); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.fillStyle(0xe5ebde); g.fillCircle(1220, 630, 330);
  g.fillStyle(0xf3e5d4, 0.65); g.fillCircle(20, 240, 240);
  g.lineStyle(1, 0x647969, 0.08);
  for (let x = 24; x < GAME_WIDTH; x += 32) for (let y = 110; y < 650; y += 32) {
    g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x + 2, y); g.moveTo(x, y - 2); g.lineTo(x, y + 2); g.strokePath();
  }
  g.fillStyle(TOUR.ink); g.fillRect(0, 0, GAME_WIDTH, 7);
  g.fillStyle(TOUR.coral); g.fillRect(40, 0, 84, 7);
  g.lineStyle(1, TOUR.line); g.lineBetween(40, 128, 1240, 128); g.lineBetween(40, 658, 1240, 658);
  const labels: Record<RogueBackdropVariant, string> = { hub: '巡演大厅', setup: '出发准备', map: '路线探索', event: '沿途纪事', recruit: '公开招募', reward: '演出奖励', summary: '巡演档案' };
  tourText(scene, 40, 22, `A-SOUL  /  集成巡演  /  ${labels[variant]}`, 11, TOUR.subtext, true);
  tourText(scene, 1238, 686, '每一站，都是新的故事。    /    INTEGRATED TOUR', 10, TOUR.subtext).setOrigin(1, 0.5);
  scene.cameras.main.fadeIn(180, 240, 241, 231);
  return g;
}

export function createRogueHeader(scene: Phaser.Scene, kicker: string, title: string, subtitle: string): void {
  tourText(scene, 40, 49, title, 30, TOUR.text, true);
  tourText(scene, 42, 94, subtitle, 13, TOUR.subtext);
  tourText(scene, 1238, 100, kicker, 10, TOUR.red, true).setOrigin(1, 0.5).setLetterSpacing(2);
}

