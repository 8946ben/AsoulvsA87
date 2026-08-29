import Phaser from 'phaser';
import { GRID, PALETTE, TEX } from '../config/GameConfig';

/**
 * 程序化生成占位美术。
 *
 * 目的：在自绘美术资源就绪之前，让整个游戏逻辑可以完整跑通。
 * 后续接入真实素材时，只需在 BootScene 中用
 *   this.load.image(TEX.PLANT_SUNFLOWER, 'assets/images/sunflower.png')
 * 覆盖同名 key 即可，实体层代码零改动。
 */
export class TextureFactory {
  static generateAll(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    this.drawLawn(g, PALETTE.LAWN_LIGHT);
    this.emit(scene, g, TEX.LAWN_LIGHT, GRID.CELL_W, GRID.CELL_H);

    this.drawLawn(g, PALETTE.LAWN_DARK);
    this.emit(scene, g, TEX.LAWN_DARK, GRID.CELL_W, GRID.CELL_H);

    this.drawSunflower(g);
    this.emit(scene, g, TEX.PLANT_SUNFLOWER, 80, 96);

    this.drawPeashooter(g);
    this.emit(scene, g, TEX.PLANT_PEASHOOTER, 80, 96);

    this.drawWallnut(g);
    this.emit(scene, g, TEX.PLANT_WALLNUT, 80, 96);

    this.drawZombie(g, PALETTE.ZOMBIE_SKIN, 'none');
    this.emit(scene, g, TEX.ZOMBIE_BASIC, 64, 96);

    this.drawZombie(g, PALETTE.ZOMBIE_SKIN, 'cone');
    this.emit(scene, g, TEX.ZOMBIE_CONE, 64, 96);

    this.drawZombie(g, PALETTE.ZOMBIE_SKIN, 'bucket');
    this.emit(scene, g, TEX.ZOMBIE_BUCKET, 64, 96);

    this.drawPea(g);
    this.emit(scene, g, TEX.PEA, 20, 20);

    this.drawSun(g);
    this.emit(scene, g, TEX.SUN, 64, 64);

    this.drawLawnmower(g);
    this.emit(scene, g, TEX.LAWNMOWER, 56, 48);

    this.drawCardFrame(g);
    this.emit(scene, g, TEX.CARD_FRAME, 64, 88);

    g.destroy();
  }

  /**
   * 注册一张占位纹理。
   * 若同名 key 已被 BootScene 加载的真实素材占用，则直接丢弃这笔绘制，
   * 从而实现「有真实图用真实图、没有才回退占位图」的渐进替换。
   */
  private static emit(
    scene: Phaser.Scene,
    g: Phaser.GameObjects.Graphics,
    key: string,
    w: number,
    h: number,
  ): void {
    // 注意顺序：必须先从「已绘制内容」生成纹理，再清空画笔给下一个图案复用。
    // 若先 clear 再生成，得到的会是全透明的空纹理。
    if (!scene.textures.exists(key)) {
      g.generateTexture(key, w, h);
    }
    g.clear();
  }

  // ---------------- 草坪格 ----------------
  private static drawLawn(g: Phaser.GameObjects.Graphics, color: number): void {
    g.fillStyle(color, 1);
    g.fillRect(0, 0, GRID.CELL_W, GRID.CELL_H);
    // 顶部高光带，制造层次
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(0, 0, GRID.CELL_W, 6);
    // 边框
    g.lineStyle(1, 0x000000, 0.12);
    g.strokeRect(0, 0, GRID.CELL_W, GRID.CELL_H);
  }

  // ---------------- 向日葵 ----------------
  private static drawSunflower(g: Phaser.GameObjects.Graphics): void {
    const cx = 40;
    const cy = 40;

    // 茎
    g.fillStyle(0x3f8f2a, 1);
    g.fillRect(cx - 4, cy + 20, 8, 34);
    // 叶片
    g.fillEllipse(cx - 18, cy + 44, 30, 14);
    g.fillEllipse(cx + 18, cy + 48, 28, 13);

    // 花瓣（8 片）
    g.fillStyle(0xffc107, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = cx + Math.cos(angle) * 20;
      const py = cy + Math.sin(angle) * 20;
      g.fillEllipse(px, py, 20, 13);
    }

    // 花心
    g.fillStyle(0x8d5524, 1);
    g.fillCircle(cx, cy, 15);
    g.fillStyle(0x6d3f18, 1);
    g.fillCircle(cx, cy, 10);
  }

  // ---------------- 豌豆射手 ----------------
  private static drawPeashooter(g: Phaser.GameObjects.Graphics): void {
    // 茎
    g.fillStyle(0x3f8f2a, 1);
    g.fillRect(30, 58, 10, 36);
    g.fillEllipse(20, 76, 26, 12);

    // 炮管
    g.fillStyle(0x2e7d32, 1);
    g.fillRoundedRect(46, 26, 26, 16, 6);

    // 头
    g.fillStyle(0x4caf50, 1);
    g.fillCircle(38, 36, 20);
    // 高光
    g.fillStyle(0xffffff, 0.22);
    g.fillCircle(32, 28, 7);

    // 眼睛
    g.fillStyle(0x1b1b1b, 1);
    g.fillCircle(44, 32, 3.5);
  }

  // ---------------- 坚果墙 ----------------
  private static drawWallnut(g: Phaser.GameObjects.Graphics): void {
    const cx = 40;
    const cy = 52;
    g.fillStyle(PALETTE.WALLNUT, 1);
    g.fillEllipse(cx, cy, 54, 68);
    // 纹理线
    g.lineStyle(2, 0x8a5a28, 0.8);
    g.beginPath();
    g.moveTo(cx - 14, cy - 22);
    g.lineTo(cx - 6, cy - 6);
    g.moveTo(cx + 10, cy - 20);
    g.lineTo(cx + 4, cy - 4);
    g.strokePath();
    // 高光
    g.fillStyle(0xffffff, 0.18);
    g.fillEllipse(cx - 14, cy - 18, 16, 24);
    // 眼睛
    g.fillStyle(0x1b1b1b, 1);
    g.fillCircle(cx - 8, cy - 4, 3);
    g.fillCircle(cx + 8, cy - 4, 3);
  }

  // ---------------- 僵尸 ----------------
  private static drawZombie(
    g: Phaser.GameObjects.Graphics,
    skin: number,
    hat: 'none' | 'cone' | 'bucket',
  ): void {
    const cx = 32;

    // 腿
    g.fillStyle(0x4a5a6b, 1);
    g.fillRect(cx - 13, 68, 10, 26);
    g.fillRect(cx + 3, 68, 10, 26);

    // 身体（破烂衣服）
    g.fillStyle(PALETTE.ZOMBIE_CLOTH, 1);
    g.fillRoundedRect(cx - 16, 38, 32, 34, 4);
    // 破洞
    g.fillStyle(0x000000, 0.18);
    g.fillCircle(cx - 6, 56, 4);

    // 前伸的手臂
    g.fillStyle(skin, 1);
    g.fillRoundedRect(cx - 30, 42, 20, 8, 4);
    g.fillRoundedRect(cx + 12, 48, 18, 8, 4);

    // 头
    g.fillStyle(skin, 1);
    g.fillCircle(cx, 24, 15);

    // 眼睛
    g.fillStyle(0x1b1b1b, 1);
    g.fillCircle(cx - 5, 22, 2.5);
    g.fillCircle(cx + 5, 22, 2.5);
    // 嘴
    g.fillStyle(0x2b2b2b, 1);
    g.fillRect(cx - 6, 31, 12, 3);

    // 头部装饰（区分僵尸种类）
    if (hat === 'cone') {
      g.fillStyle(0xff8c1a, 1);
      g.fillTriangle(cx, -2, cx - 16, 20, cx + 16, 20);
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(cx - 12, 12, 24, 4);
    } else if (hat === 'bucket') {
      g.fillStyle(0x9aa5b1, 1);
      g.fillRoundedRect(cx - 15, 2, 30, 20, 3);
      g.fillStyle(0x76818d, 1);
      g.fillRect(cx - 15, 4, 30, 4);
      g.lineStyle(1, 0x5c666f, 1);
      g.strokeRoundedRect(cx - 15, 2, 30, 20, 3);
    }
  }

  // ---------------- 豌豆子弹 ----------------
  private static drawPea(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(PALETTE.PEA, 1);
    g.fillCircle(10, 10, 8);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(7, 7, 3);
  }

  // ---------------- 阳光 ----------------
  private static drawSun(g: Phaser.GameObjects.Graphics): void {
    const cx = 32;
    const cy = 32;
    // 光芒
    g.fillStyle(0xffb300, 0.85);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = cx + Math.cos(angle) * 24;
      const py = cy + Math.sin(angle) * 24;
      g.fillCircle(px, py, 5);
    }
    // 主体
    g.fillStyle(PALETTE.SUN, 1);
    g.fillCircle(cx, cy, 22);
    g.fillStyle(0xffe680, 1);
    g.fillCircle(cx, cy, 15);
  }

  // ---------------- 小推车 ----------------
  private static drawLawnmower(g: Phaser.GameObjects.Graphics): void {
    // 车身
    g.fillStyle(0x8d99ae, 1);
    g.fillRoundedRect(4, 10, 48, 26, 5);
    // 把手
    g.lineStyle(4, 0x5c6672, 1);
    g.beginPath();
    g.moveTo(46, 14);
    g.lineTo(54, 2);
    g.strokePath();
    // 轮子
    g.fillStyle(0x2f3640, 1);
    g.fillCircle(16, 40, 7);
    g.fillCircle(40, 40, 7);
    g.fillStyle(0x718093, 1);
    g.fillCircle(16, 40, 3);
    g.fillCircle(40, 40, 3);
  }

  // ---------------- 卡片底板 ----------------
  private static drawCardFrame(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(PALETTE.CARD_BG, 1);
    g.fillRoundedRect(0, 0, 64, 88, 6);
    g.lineStyle(3, PALETTE.CARD_BORDER, 1);
    g.strokeRoundedRect(1.5, 1.5, 61, 85, 6);
    // 内部图标区
    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(4, 4, 56, 60, 4);
  }
}
