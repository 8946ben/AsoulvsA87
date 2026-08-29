import Phaser from 'phaser';
import { ASSET_SPECS } from '../config/GameConfig';

interface ContentBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 素材规范化器。
 *
 * 真实美术素材（尤其是 AI 生成的）有两个共性问题：
 *   1. 分辨率很高（如 1024×1024），而游戏里只需要几十像素；
 *   2. 主体周围留有大片白边，直接等比缩放会让角色显得又小又空。
 *
 * 这里在启动时统一做两件事：
 *   - 扫描出「非白、非透明」的内容边界，裁掉白边；
 *   - 等比缩放并居中到 ASSET_SPECS 声明的目标尺寸。
 *
 * 结果是所有纹理在实体层看来尺寸都是一致的，
 * 因此 Zombie / Projectile / Sun / Plant 等实体无需任何适配代码。
 */
export class AssetNormalizer {
  static normalize(scene: Phaser.Scene): void {
    for (const [key, spec] of Object.entries(ASSET_SPECS)) {
      if (!scene.textures.exists(key)) continue;

      const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | null;
      if (!src || !src.width || !src.height) continue;

      // 占位图本身就是目标尺寸，无需处理
      if (src.width === spec.w && src.height === spec.h) continue;

      const box = this.findContentBox(src);
      if (!box) continue;

      const canvas = this.renderFitted(src, box, spec.w, spec.h);

      // 用规范化后的画布纹理替换掉原始大图
      scene.textures.remove(key);
      scene.textures.addCanvas(key, canvas);
    }
  }

  /**
   * 扫描图像，找出真正有内容的矩形区域（忽略白色背景与透明像素）。
   * 采用固定步长采样，在高分辨率图上也能保持可接受的耗时。
   */
  private static findContentBox(img: HTMLImageElement): ContentBox | null {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;

    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);

    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, c.width, c.height).data;
    } catch {
      // 极端情况下的跨域限制，退化为整图
      return { x: 0, y: 0, w: c.width, h: c.height };
    }

    const step = 2;
    let minX = c.width;
    let minY = c.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < c.height; y += step) {
      for (let x = 0; x < c.width; x += step) {
        const i = (y * c.width + x) * 4;
        const alpha = data[i + 3];
        if (alpha < 12) continue;
        // 接近纯白视为背景
        if (data[i] > 244 && data[i + 1] > 244 && data[i + 2] > 244) continue;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < 0) return null;

    // 向外留 1% 余量，避免裁到描边
    const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.01);
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(c.width - 1, maxX + pad);
    maxY = Math.min(c.height - 1, maxY + pad);

    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  /** 把裁剪后的内容等比缩放并居中绘制到目标尺寸的画布上 */
  private static renderFitted(
    img: HTMLImageElement,
    box: ContentBox,
    targetW: number,
    targetH: number,
  ): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = targetW;
    c.height = targetH;

    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const scale = Math.min(targetW / box.w, targetH / box.h);
    const dw = box.w * scale;
    const dh = box.h * scale;
    const dx = (targetW - dw) / 2;
    const dy = (targetH - dh) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, box.x, box.y, box.w, box.h, dx, dy, dw, dh);

    return c;
  }
}
