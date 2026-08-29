import Phaser from 'phaser';
import { ASSET_SPECS } from '../config/GameConfig';

interface ContentBox { x: number; y: number; w: number; h: number; }

/**
 * 运行时素材清洗：从四周做连通区域去底色，再按内容边界裁切。
 * 与简单“裁白边”不同，最终纹理内部不再保留碍眼的白色方框。
 */
export class AssetNormalizer {
  static normalize(scene: Phaser.Scene): void {
    for (const [key, spec] of Object.entries(ASSET_SPECS)) {
      if (!scene.textures.exists(key)) continue;
      const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      if (!src?.width || !src?.height) continue;
      if (src.width === spec.w && src.height === spec.h) continue;

      const foreground = this.removeConnectedBackground(src);
      const box = this.findContentBox(foreground);
      if (!box) continue;
      const fitted = this.renderFitted(foreground, box, spec.w, spec.h);
      scene.textures.remove(key);
      scene.textures.addCanvas(key, fitted);
    }
  }

  /** 只清除与画布边缘连通的底色，角色衣服中的白色会被保留。 */
  private static removeConnectedBackground(img: CanvasImageSource & { width: number; height: number }): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;
    ctx.drawImage(img, 0, 0);

    let pixels: ImageData;
    try { pixels = ctx.getImageData(0, 0, canvas.width, canvas.height); }
    catch { return canvas; }

    const { data } = pixels;
    const w = canvas.width;
    const h = canvas.height;
    const total = w * h;
    const cornerIds = [0, w - 1, (h - 1) * w, total - 1];
    let br = 0; let bg = 0; let bb = 0;
    for (const id of cornerIds) {
      br += data[id * 4]; bg += data[id * 4 + 1]; bb += data[id * 4 + 2];
    }
    br /= 4; bg /= 4; bb /= 4;

    const seen = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0; let tail = 0;
    const isBackground = (id: number): boolean => {
      const i = id * 4;
      if (data[i + 3] < 24) return true;
      const dr = data[i] - br; const dg = data[i + 1] - bg; const db = data[i + 2] - bb;
      return dr * dr + dg * dg + db * db < 52 * 52;
    };
    const enqueue = (id: number): void => {
      if (seen[id] || !isBackground(id)) return;
      seen[id] = 1; queue[tail++] = id;
    };

    for (let x = 0; x < w; x++) { enqueue(x); enqueue((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { enqueue(y * w); enqueue(y * w + w - 1); }

    while (head < tail) {
      const id = queue[head++];
      data[id * 4 + 3] = 0;
      const x = id % w;
      if (x > 0) enqueue(id - 1);
      if (x < w - 1) enqueue(id + 1);
      if (id >= w) enqueue(id - w);
      if (id < total - w) enqueue(id + w);
    }

    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  private static findContentBox(canvas: HTMLCanvasElement): ContentBox | null {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width; let minY = canvas.height; let maxX = -1; let maxY = -1;
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        if (data[(y * canvas.width + x) * 4 + 3] < 18) continue;
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    if (maxX < 0) return null;
    const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.025);
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(canvas.width - 1, maxX + pad); maxY = Math.min(canvas.height - 1, maxY + pad);
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  private static renderFitted(src: HTMLCanvasElement, box: ContentBox, w: number, h: number): HTMLCanvasElement {
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const ctx = out.getContext('2d');
    if (!ctx) return out;
    const scale = Math.min((w - 4) / box.w, (h - 4) / box.h);
    const dw = box.w * scale; const dh = box.h * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, box.x, box.y, box.w, box.h, (w - dw) / 2, h - dh - 2, dw, dh);
    return out;
  }
}
