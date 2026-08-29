import Phaser from 'phaser';
import { GRID, PALETTE, TEX } from '../config/GameConfig';

/** 为缺失的角色、敌人和特效生成风格统一的矢量纹理。 */
export class TextureFactory {
  static generateAll(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    this.drawLawn(g, PALETTE.LAWN_LIGHT, 0x7ee29e);
    this.emit(scene, g, TEX.LAWN_LIGHT, GRID.CELL_W, GRID.CELL_H);
    this.drawLawn(g, PALETTE.LAWN_DARK, 0x65cd8c);
    this.emit(scene, g, TEX.LAWN_DARK, GRID.CELL_W, GRID.CELL_H);

    this.drawOceanShield(g);
    this.emit(scene, g, TEX.PLANT_XIAOHAINUO, 78, 94);
    this.drawHeartOrb(g);
    this.emit(scene, g, TEX.PLANT_XINQIUYI, 78, 94);

    const fallbackPlants = [
      [TEX.PLANT_BEIJIXING, 0x63d9ff], [TEX.PLANT_JIAXINTANG, 0xff7fab],
      [TEX.PLANT_NAIQILIN, 0xd8b3ff], [TEX.PLANT_BELLA, 0xe54955],
      [TEX.PLANT_EILEEN, 0x9b72e8], [TEX.PLANT_DIANA, 0xff9b55],
      [TEX.PLANT_GLADYS, 0x54c8ff], [TEX.PLANT_FIONA, 0xff6fba],
    ] as const;
    for (const [key, color] of fallbackPlants) {
      this.drawChibiBadge(g, color);
      this.emit(scene, g, key, 78, 94);
    }

    this.drawA87(g, 'basic'); this.emit(scene, g, TEX.ZOMBIE_BASIC, 74, 96);
    this.drawA87(g, 'bucket'); this.emit(scene, g, TEX.ZOMBIE_BUCKET, 74, 96);
    this.drawA87(g, 'pole'); this.emit(scene, g, TEX.ZOMBIE_POLE, 78, 98);
    this.drawKnight(g); this.emit(scene, g, TEX.ZOMBIE_KNIGHT, 80, 100);
    this.drawCarol(g); this.emit(scene, g, TEX.ZOMBIE_CAROL, 104, 118);
    this.drawA87(g, 'dragon'); this.emit(scene, g, TEX.ZOMBIE_DRAGON, 112, 118);

    this.drawCandy(g); this.emit(scene, g, TEX.CANDY, 24, 24);
    this.drawChocolate(g); this.emit(scene, g, TEX.CHOCOLATE, 26, 24);
    this.drawCream(g); this.emit(scene, g, TEX.CREAM, 28, 24);
    this.drawHammer(g); this.emit(scene, g, TEX.HAMMER, 34, 30);
    this.drawBeam(g); this.emit(scene, g, TEX.BEAM, 38, 18);
    this.drawSun(g); this.emit(scene, g, TEX.SUN, 58, 58);
    this.drawMower(g); this.emit(scene, g, TEX.LAWNMOWER, 62, 48);
    this.drawCard(g); this.emit(scene, g, TEX.CARD_FRAME, 68, 104);
    g.destroy();
  }

  private static emit(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, key: string, w: number, h: number): void {
    if (!scene.textures.exists(key)) g.generateTexture(key, w, h);
    g.clear();
  }

  private static drawLawn(g: Phaser.GameObjects.Graphics, base: number, shine: number): void {
    g.fillStyle(base, 1); g.fillRect(0, 0, GRID.CELL_W, GRID.CELL_H);
    g.fillStyle(shine, 0.12); g.fillRect(0, 0, GRID.CELL_W, 8);
    g.lineStyle(1, 0xffffff, 0.08); g.strokeRect(0.5, 0.5, GRID.CELL_W - 1, GRID.CELL_H - 1);
    g.lineStyle(1, 0x123f32, 0.12);
    for (let x = 10; x < GRID.CELL_W; x += 18) {
      g.beginPath(); g.moveTo(x, GRID.CELL_H - 7); g.lineTo(x + 4, GRID.CELL_H - 15); g.strokePath();
    }
  }

  private static drawOceanShield(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x5ee6df, 0.25); g.fillCircle(39, 47, 37);
    g.lineStyle(5, 0xa9fff7, 0.95); g.strokeCircle(39, 47, 32);
    g.fillStyle(0x1f8bb5, 1); g.fillRoundedRect(18, 24, 42, 48, 18);
    g.fillStyle(0x83f4ff, 1); g.fillCircle(30, 42, 5); g.fillCircle(48, 42, 5);
    g.lineStyle(3, 0xffffff, 0.8); g.beginPath(); g.arc(39, 52, 12, 0.2, Math.PI - 0.2); g.strokePath();
    g.fillStyle(0xffffff, 0.85); g.fillCircle(25, 29, 5);
  }

  private static drawHeartOrb(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xff5a91, 0.22); g.fillCircle(39, 46, 38);
    g.lineStyle(4, 0xffa7c4, 1); g.strokeCircle(39, 46, 31);
    g.fillStyle(0xff4f87, 1); g.fillCircle(30, 41, 12); g.fillCircle(48, 41, 12);
    g.fillTriangle(20, 44, 58, 44, 39, 70);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(30, 35, 4);
    g.lineStyle(3, 0xffffff, 0.65); g.strokeCircle(39, 46, 37);
  }

  private static drawChibiBadge(g: Phaser.GameObjects.Graphics, color: number): void {
    g.fillStyle(color, 0.22); g.fillCircle(39, 47, 37);
    g.fillStyle(color, 1); g.fillCircle(39, 38, 25); g.fillRoundedRect(22, 60, 34, 28, 12);
    g.fillStyle(0xffffff, 1); g.fillCircle(31, 36, 5); g.fillCircle(47, 36, 5);
    g.fillStyle(0x17243a, 1); g.fillCircle(32, 37, 2); g.fillCircle(48, 37, 2);
    g.lineStyle(2, 0xffffff, 0.8); g.beginPath(); g.arc(39, 45, 8, 0.2, Math.PI - 0.2); g.strokePath();
  }

  private static drawA87(g: Phaser.GameObjects.Graphics, kind: 'basic' | 'bucket' | 'pole' | 'dragon'): void {
    const w = kind === 'dragon' ? 112 : kind === 'pole' ? 78 : 74;
    const cx = w / 2;
    g.fillStyle(0xdfe6ef, 1); g.fillEllipse(cx, kind === 'dragon' ? 67 : 58, w * 0.72, kind === 'dragon' ? 78 : 66);
    g.lineStyle(4, 0x18243a, 1); g.strokeEllipse(cx, kind === 'dragon' ? 67 : 58, w * 0.72, kind === 'dragon' ? 78 : 66);
    g.fillStyle(0xffa3b8, 1);
    for (let i = 0; i < 4; i++) g.fillEllipse(cx - 24 + i * 16, kind === 'dragon' ? 102 : 88, 12, 8);
    g.fillStyle(0xff8b49, 1); g.fillCircle(cx - 12, 50, 8); g.fillCircle(cx + 12, 50, 8);
    g.fillStyle(0x17243a, 1); g.fillCircle(cx - 10, 50, 4); g.fillCircle(cx + 10, 50, 4);
    g.fillStyle(0x8b2334, 1); g.fillRoundedRect(cx - 15, 64, 30, 11, 5);
    if (kind === 'bucket') {
      g.fillStyle(0x8ea1b5, 1); g.fillRoundedRect(cx - 25, 2, 50, 28, 5);
      g.lineStyle(4, 0xdde8f1, 1); g.strokeRoundedRect(cx - 25, 2, 50, 28, 5);
    }
    if (kind === 'pole') {
      g.lineStyle(5, 0xffd166, 1); g.beginPath(); g.moveTo(7, 96); g.lineTo(70, 3); g.strokePath();
    }
    if (kind === 'dragon') {
      g.fillStyle(0xffd166, 1); g.fillTriangle(cx - 31, 28, cx - 16, 2, cx - 7, 32); g.fillTriangle(cx + 31, 28, cx + 16, 2, cx + 7, 32);
      g.lineStyle(4, 0xffd166, 1); g.beginPath(); g.arc(cx, 65, 47, -2.7, -0.45); g.strokePath();
    }
  }

  private static drawKnight(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x22243d, 1); g.fillRoundedRect(19, 34, 45, 58, 12);
    g.fillStyle(0x4b4d74, 1); g.fillCircle(41, 29, 25);
    g.lineStyle(4, 0xc54b7d, 1); g.strokeCircle(41, 29, 23);
    g.fillStyle(0xff477e, 1); g.fillRect(28, 27, 27, 5);
    g.fillStyle(0xf3d66f, 1); g.fillCircle(34, 29, 3); g.fillCircle(49, 29, 3);
    g.lineStyle(6, 0xdde6ee, 1); g.beginPath(); g.moveTo(64, 43); g.lineTo(78, 4); g.strokePath();
  }

  private static drawCarol(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x5d266f, 0.32); g.fillCircle(52, 58, 50);
    g.fillStyle(0x221b38, 1); g.fillEllipse(52, 44, 65, 72); g.fillRoundedRect(27, 65, 50, 47, 18);
    g.fillStyle(0xe7c4dc, 1); g.fillCircle(52, 43, 25);
    g.fillStyle(0x8e5aae, 1); g.fillEllipse(52, 26, 63, 34);
    g.fillStyle(0xff4f8b, 1); g.fillCircle(43, 44, 4); g.fillCircle(61, 44, 4);
    g.lineStyle(4, 0xd35aff, 0.8); g.strokeCircle(52, 58, 49);
  }

  private static drawCandy(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xff77ad, 1); g.fillCircle(12, 12, 7); g.fillTriangle(1, 6, 6, 12, 1, 18); g.fillTriangle(23, 6, 18, 12, 23, 18);
    g.fillStyle(0xffffff, 0.65); g.fillCircle(10, 9, 2);
  }
  private static drawChocolate(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x7a412d, 1); g.fillRoundedRect(3, 4, 20, 17, 4); g.lineStyle(2, 0xb97851, 1); g.strokeRect(8, 4, 2, 17); g.strokeRect(16, 4, 2, 17);
  }
  private static drawCream(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xfdf6dc, 1); g.fillCircle(7, 16, 6); g.fillCircle(14, 12, 8); g.fillCircle(21, 16, 6); g.lineStyle(2, 0xc7bda6, 1); g.strokeEllipse(14, 17, 25, 11);
  }
  private static drawHammer(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x566477, 1); g.fillRoundedRect(3, 2, 26, 13, 4); g.fillStyle(0xffd166, 1); g.fillRoundedRect(15, 13, 6, 17, 3); g.fillStyle(0xffffff, 0.35); g.fillRect(6, 4, 16, 3);
  }
  private static drawBeam(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xc995ff, 0.35); g.fillEllipse(19, 9, 38, 18); g.fillStyle(0xf4d9ff, 1); g.fillEllipse(19, 9, 32, 7); g.fillStyle(0xffffff, 1); g.fillEllipse(19, 9, 22, 3);
  }
  private static drawSun(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xffc84d, 0.85); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillCircle(29 + Math.cos(a) * 23, 29 + Math.sin(a) * 23, 4); }
    g.fillStyle(PALETTE.SUN, 1); g.fillCircle(29, 29, 20); g.fillStyle(0xffffff, 0.55); g.fillCircle(23, 22, 6);
  }
  private static drawMower(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x3dd6d0, 1); g.fillRoundedRect(5, 11, 50, 25, 7); g.fillStyle(0x152239, 1); g.fillCircle(18, 39, 7); g.fillCircle(45, 39, 7);
    g.lineStyle(4, 0x9ef5f0, 1); g.beginPath(); g.moveTo(50, 14); g.lineTo(60, 2); g.strokePath();
  }
  private static drawCard(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(PALETTE.CARD_BG, 0.98); g.fillRoundedRect(0, 0, 68, 104, 9);
    g.lineStyle(2, PALETTE.CARD_BORDER, 0.65); g.strokeRoundedRect(1, 1, 66, 102, 9);
    g.fillStyle(0x0b1425, 0.5); g.fillRoundedRect(5, 20, 58, 57, 6);
  }
}
