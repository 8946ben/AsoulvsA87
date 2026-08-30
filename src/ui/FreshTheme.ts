import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

/** 清新自然主题：以天空、草木、花瓣和奶油纸张替代灰黑色后台面板。 */
export const FRESH = {
  INK: 0x42506d,
  INK_SOFT: 0x71809a,
  SKY: 0x8edcf3,
  SKY_LIGHT: 0xdff7ff,
  CREAM: 0xfffaed,
  PAPER: 0xfffffb,
  PINK: 0xff86ad,
  PINK_DARK: 0xe85f91,
  BLUE: 0x62cae8,
  BLUE_DARK: 0x399ec3,
  GOLD: 0xffd466,
  MINT: 0x72d7ad,
  GREEN: 0x65c98b,
  PURPLE: 0xa997e8,
  LOCKED: 0xdde4df,
} as const;

export type FreshBackdropKind = 'sky' | 'garden' | 'paper' | 'sunny';

export function createFreshBackdrop(scene: Phaser.Scene, kind: FreshBackdropKind = 'sky'): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  if (kind === 'paper') g.fillGradientStyle(0xfffaed, 0xfff4f7, 0xedfaff, 0xf7fff5, 1);
  else if (kind === 'sunny') g.fillGradientStyle(0x9ee5f5, 0xd9f5ff, 0xfff0bf, 0xfff9e5, 1);
  else if (kind === 'garden') g.fillGradientStyle(0x8edcf3, 0xc8f2ff, 0xeaf8d9, 0xbfe8bd, 1);
  else g.fillGradientStyle(0x8bd8f1, 0xc8f1ff, 0xffe2e9, 0xfff3c9, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  g.fillStyle(0xffef9b, kind === 'paper' ? 0.22 : 0.72); g.fillCircle(GAME_WIDTH - 115, 88, 54);
  g.fillStyle(0xffffff, 0.58);
  drawCloud(g, 145, 106, 1.15); drawCloud(g, 980, 188, 0.78); drawCloud(g, 560, 62, 0.62);

  if (kind !== 'paper') {
    g.fillStyle(0x9ed8b0, 0.72); g.fillEllipse(120, GAME_HEIGHT + 45, 720, 260);
    g.fillStyle(0x7dca9c, 0.78); g.fillEllipse(1060, GAME_HEIGHT + 70, 920, 300);
    g.fillStyle(0xc8ebbb, 0.72); g.fillEllipse(620, GAME_HEIGHT + 120, 1050, 280);
  }

  g.fillStyle(0xffffff, 0.34);
  for (let i = 0; i < 22; i++) {
    const x = 34 + i * 59; const y = 42 + (i * 73) % 470;
    g.fillCircle(x, y, i % 3 === 0 ? 3 : 2);
  }
  g.fillStyle(0xff91b5, 0.52);
  for (let i = 0; i < 9; i++) {
    const x = 78 + i * 143; const y = 500 + (i % 3) * 42;
    g.fillCircle(x, y, 4); g.fillCircle(x + 7, y + 2, 4); g.fillCircle(x + 3, y + 8, 4);
    g.fillStyle(0xffdb6c, 0.8); g.fillCircle(x + 3, y + 4, 2.5); g.fillStyle(0xff91b5, 0.52);
  }
  return g;
}

export function createFreshPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  accent = FRESH.BLUE,
  alpha = 0.94,
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, width, height, FRESH.PAPER, alpha).setStrokeStyle(2, accent, 0.42);
}

function drawCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
  g.fillEllipse(x, y, 118 * scale, 42 * scale);
  g.fillCircle(x - 30 * scale, y - 9 * scale, 25 * scale);
  g.fillCircle(x + 6 * scale, y - 18 * scale, 33 * scale);
  g.fillCircle(x + 39 * scale, y - 7 * scale, 22 * scale);
}
