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
    this.drawA87Variant(g, 'phone'); this.emit(scene, g, TEX.ZOMBIE_PHONE, 90, 96);
    this.drawA87Variant(g, 'flag'); this.emit(scene, g, TEX.ZOMBIE_FLAG, 118, 110);
    this.drawA87Variant(g, 'screen'); this.emit(scene, g, TEX.ZOMBIE_SCREEN, 100, 100);
    this.drawA87Variant(g, 'balloon'); this.emit(scene, g, TEX.ZOMBIE_BALLOON, 100, 130);
    this.drawA87Variant(g, 'ladder'); this.emit(scene, g, TEX.ZOMBIE_LADDER, 112, 104);
    this.drawA87(g, 'bucket'); this.emit(scene, g, TEX.ZOMBIE_CONE, 74, 96);
    this.drawKnight(g); this.emit(scene, g, TEX.ZOMBIE_FOOTBALL, 80, 100);
    this.drawA87(g, 'dragon'); this.emit(scene, g, TEX.ZOMBIE_SLED, 112, 118);
    this.drawA87(g, 'bucket'); this.emit(scene, g, TEX.ZOMBIE_MINER, 74, 96);
    this.drawA87(g, 'bucket'); this.emit(scene, g, TEX.ZOMBIE_BUCKET, 74, 96);
    this.drawA87(g, 'pole'); this.emit(scene, g, TEX.ZOMBIE_POLE, 78, 98);
    this.drawKnight(g); this.emit(scene, g, TEX.ZOMBIE_KNIGHT, 80, 100);
    this.drawCarol(g); this.emit(scene, g, TEX.ZOMBIE_CAROL, 104, 118);
    this.drawA87(g, 'dragon'); this.emit(scene, g, TEX.ZOMBIE_DRAGON, 112, 118);

    this.drawCandy(g); this.emit(scene, g, TEX.CANDY, 24, 24);
    this.drawStarCandy(g); this.emit(scene, g, TEX.STAR_CANDY, 28, 28);
    this.drawCandyIceCream(g); this.emit(scene, g, TEX.CANDY_ICE_CREAM, 30, 30);
    this.drawSoulCandy(g); this.emit(scene, g, TEX.SOUL_CANDY, 30, 30);
    this.drawChocolate(g); this.emit(scene, g, TEX.CHOCOLATE, 26, 24);
    this.drawCream(g); this.emit(scene, g, TEX.CREAM, 28, 24);
    this.drawHammer(g); this.emit(scene, g, TEX.HAMMER, 34, 30);
    this.drawBeam(g); this.emit(scene, g, TEX.BEAM, 38, 18);
    this.drawSun(g); this.emit(scene, g, TEX.SUN, 58, 58);
    this.drawBellaMine(g); this.emit(scene, g, TEX.BELLA_MINE, 84, 68);
    this.drawSoupBowl(g); this.emit(scene, g, TEX.EILEEN_SOUP, 84, 58);
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

  /** 乃琳地刺形态的兜底纹理：一碗番茄牛肉汤。 */
  private static drawSoupBowl(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x8fa39b, 1); g.fillEllipse(42, 34, 78, 44);
    g.lineStyle(3, 0x5c6f68, 1); g.strokeEllipse(42, 34, 78, 44);
    g.fillStyle(0xb5442a, 1); g.fillEllipse(42, 28, 64, 30);
    g.fillStyle(0xd95b30, 1); g.fillEllipse(30, 24, 18, 12); g.fillEllipse(52, 30, 16, 10);
    g.fillStyle(0xe8833a, 1); g.fillEllipse(44, 22, 12, 9); g.fillEllipse(60, 25, 9, 7);
    g.fillStyle(0x6e4a35, 1); g.fillEllipse(26, 31, 14, 9); g.fillEllipse(50, 35, 12, 8);
    g.fillStyle(0xfdf3e3, 1); g.fillEllipse(38, 27, 20, 13);
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(30, 20, 22, 8);
    g.lineStyle(4, 0xcfd8d4, 0.9); g.beginPath(); g.moveTo(58, 10); g.lineTo(80, 4); g.strokePath();
  }

  /** 贝拉土豆雷形态的兜底纹理：紫发兔耳从土里警觉探头。 */
  private static drawBellaMine(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x813b28, 1); g.fillTriangle(20, 34, 25, 2, 36, 35); g.fillTriangle(48, 35, 60, 2, 65, 35);
    g.fillStyle(0xfff0d9, 1); g.fillTriangle(24, 30, 27, 9, 33, 31); g.fillTriangle(52, 31, 58, 9, 61, 30);
    g.fillStyle(0x4a247b, 1); g.fillEllipse(42, 43, 51, 38);
    g.fillStyle(0xffffff, 1); g.fillEllipse(32, 47, 15, 11); g.fillEllipse(52, 47, 15, 11);
    g.fillStyle(0x8f6cff, 1); g.fillCircle(33, 47, 5); g.fillCircle(51, 47, 5);
    g.fillStyle(0x261744, 1); g.fillCircle(33, 48, 2); g.fillCircle(51, 48, 2);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(31, 45, 2); g.fillCircle(49, 45, 2);
    g.fillStyle(0x8a5432, 1); g.fillEllipse(42, 61, 82, 24);
    g.fillStyle(0xb97545, 1); g.fillCircle(18, 57, 10); g.fillCircle(38, 60, 12); g.fillCircle(62, 57, 11);
    g.fillStyle(0x70bd58, 1); g.fillTriangle(12, 54, 8, 42, 17, 53); g.fillTriangle(70, 54, 76, 41, 75, 56);
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

  private static drawA87Variant(g: Phaser.GameObjects.Graphics, kind: 'phone' | 'flag' | 'screen' | 'balloon' | 'ladder'): void {
    const cx = kind === 'flag' ? 76 : kind === 'screen' ? 64 : 54;
    const cy = kind === 'balloon' ? 94 : kind === 'flag' ? 71 : 61;

    if (kind === 'balloon') {
      g.fillStyle(0xff668f, 1); g.fillCircle(50, 25, 22);
      g.fillStyle(0xffffff, 0.36); g.fillCircle(43, 17, 7);
      g.fillTriangle(46, 46, 54, 46, 50, 54);
      g.lineStyle(2, 0x8c3153, 0.9); g.beginPath(); g.moveTo(50, 52); g.lineTo(cx, cy - 27); g.strokePath();
    }
    if (kind === 'flag') {
      g.lineStyle(5, 0x745041, 1); g.beginPath(); g.moveTo(24, 8); g.lineTo(24, 106); g.strokePath();
      g.fillStyle(0xee4f68, 1); g.fillTriangle(27, 10, 102, 25, 27, 48);
      g.lineStyle(3, 0xffb3c1, 0.7); g.beginPath(); g.moveTo(43, 27); g.lineTo(58, 20); g.lineTo(75, 31); g.lineTo(90, 24); g.strokePath();
    }
    if (kind === 'ladder') {
      g.lineStyle(6, 0xb67943, 1); g.beginPath(); g.moveTo(8, 100); g.lineTo(87, 6); g.moveTo(27, 103); g.lineTo(106, 10); g.strokePath();
      g.lineStyle(4, 0xe0a45f, 1);
      for (let i = 0; i < 5; i++) { const x = 24 + i * 15; const y = 83 - i * 18; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 19, y + 3); g.strokePath(); }
    }

    g.fillStyle(0xdfe6ef, 1); g.fillEllipse(cx, cy, 57, 65);
    g.lineStyle(4, 0x18243a, 1); g.strokeEllipse(cx, cy, 57, 65);
    g.fillStyle(0xffa3b8, 1);
    for (let i = 0; i < 4; i++) g.fillEllipse(cx - 24 + i * 16, cy + 30, 12, 8);
    g.fillStyle(0xff8b49, 1); g.fillCircle(cx - 11, cy - 8, 7); g.fillCircle(cx + 11, cy - 8, 7);
    g.fillStyle(0x17243a, 1); g.fillCircle(cx - 9, cy - 8, 3); g.fillCircle(cx + 13, cy - 8, 3);
    g.fillStyle(0x8b2334, 1); g.fillRoundedRect(cx - 13, cy + 7, 26, 9, 4);

    if (kind === 'phone') {
      g.fillStyle(0x25334d, 1); g.fillRoundedRect(6, 47, 27, 40, 5);
      g.lineStyle(3, 0x74dcff, 1); g.strokeRoundedRect(6, 47, 27, 40, 5);
      g.fillStyle(0x6ee8ff, 0.75); g.fillRoundedRect(10, 52, 19, 27, 3);
      g.fillStyle(0xffa3b8, 1); g.fillCircle(35, 67, 6);
    }
    if (kind === 'screen') {
      g.fillStyle(0x687786, 0.96); g.fillRoundedRect(2, 22, 48, 74, 6);
      g.lineStyle(4, 0xd8e2e8, 1); g.strokeRoundedRect(2, 22, 48, 74, 6);
      g.lineStyle(2, 0xaebbc5, 0.9);
      for (let x = 10; x < 48; x += 9) { g.beginPath(); g.moveTo(x, 27); g.lineTo(x, 91); g.strokePath(); }
      for (let y = 31; y < 92; y += 11) { g.beginPath(); g.moveTo(6, y); g.lineTo(47, y); g.strokePath(); }
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
  private static drawStarCandy(g: Phaser.GameObjects.Graphics): void {
    const points: Phaser.Geom.Point[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 === 0 ? 11 : 5;
      points.push(new Phaser.Geom.Point(14 + Math.cos(angle) * radius, 14 + Math.sin(angle) * radius));
    }
    g.fillStyle(0x7d4029, 1); g.fillPoints(points, true);
    g.lineStyle(2, 0xffd56d, 1); g.strokePoints(points, true, true);
    g.fillStyle(0xffffff, 0.65); g.fillCircle(11, 9, 2);
  }
  private static drawCandyIceCream(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xd99055, 1); g.fillTriangle(10, 15, 24, 15, 17, 29);
    g.lineStyle(2, 0x7b412e, 0.8); g.strokeTriangle(10, 15, 24, 15, 17, 29);
    g.fillStyle(0xfff4d8, 1); g.fillCircle(17, 12, 10);
    g.fillStyle(0xff8eb4, 1); g.fillCircle(11, 10, 3); g.fillCircle(22, 14, 3);
    g.fillStyle(0xffffff, 0.72); g.fillCircle(14, 8, 3);
  }
  private static drawSoulCandy(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xb79cff, 0.3); g.fillCircle(15, 15, 14);
    g.lineStyle(3, 0xe7ddff, 1); g.beginPath(); g.arc(15, 15, 10, 0.1, Math.PI * 1.7); g.strokePath();
    g.lineStyle(3, 0x8f68e8, 1); g.beginPath(); g.arc(15, 15, 6, 0.3, Math.PI * 1.8); g.strokePath();
    g.fillStyle(0xffffff, 0.9); g.fillCircle(15, 15, 2.5);
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
    g.fillStyle(0xeaf8f3, 0.92); g.fillRoundedRect(5, 20, 58, 57, 6);
    g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(8, 23, 52, 15, 5);
  }
}
