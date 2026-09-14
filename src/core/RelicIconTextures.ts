import Phaser from 'phaser';
import { RENDER_SCALE } from '../config/GameConfig';
import { RELICS, RELIC_ORDER } from '../data/relics';

/**
 * 装备图标按显示尺寸预缩放。
 *
 * 源图是 1254×1254 的出图，却常常只以 15 世界像素（=30 设备像素）显示：
 * GPU 一次双线性采样只取 4 个纹素，40 倍降采样等于把细节全丢掉，看上去就是糊的。
 * 浏览器 drawImage 的逐级折半缩放（每级 2 倍，等效盒式滤波）质量远好于一次性大比例缩放，
 * 所以启动时预生成若干档，渲染时挑最接近显示尺寸的一档，做到接近 1:1 采样。
 */
const TIERS = [32, 64, 96, 192, 384] as const;
const MASTER_TIER = TIERS[TIERS.length - 1];

function tierKey(textureKey: string, tier: number): string {
  return `${textureKey}@${tier}`;
}

function drawInto(src: CanvasImageSource, sw: number, sh: number, dw: number, dh: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, sw, sh, 0, 0, dw, dh);
  return canvas;
}

/**
 * 等比缩放到长边 = longSide。
 * 先逐级折半到目标的 2 倍以内，再走最后一步，避免一次性大比例缩放的粗糙采样。
 */
function resizeLongSide(src: HTMLImageElement | HTMLCanvasElement, longSide: number): HTMLCanvasElement {
  const sw = src.width;
  const sh = src.height;
  const factor = longSide / Math.max(sw, sh);
  const dw = Math.max(1, Math.round(sw * factor));
  const dh = Math.max(1, Math.round(sh * factor));

  let canvas = drawInto(src, sw, sh, sw, sh);
  let w = sw;
  let h = sh;
  while (w > dw * 2 && h > dh * 2) {
    const nw = Math.max(dw, Math.floor(w / 2));
    const nh = Math.max(dh, Math.floor(h / 2));
    canvas = drawInto(canvas, w, h, nw, nh);
    w = nw;
    h = nh;
  }
  return w === dw && h === dh ? canvas : drawInto(canvas, w, h, dw, dh);
}

/**
 * 选一档最接近显示尺寸的图标纹理 key。
 * 优先取「不小于显示尺寸」的最小档（宁可有富余，也不要放大发虚），没有更大的就用最大档。
 */
export function resolveRelicIconTexture(
  scene: Phaser.Scene,
  textureKey: string,
  maxWidth: number,
  maxHeight: number,
): string | undefined {
  const desired = Math.max(maxWidth, maxHeight) * RENDER_SCALE;
  const tier = TIERS.find((value) => value >= desired) ?? MASTER_TIER;
  const scaled = tierKey(textureKey, tier);
  if (scene.textures.exists(scaled)) return scaled;
  return scene.textures.exists(textureKey) ? textureKey : undefined;
}

/**
 * 为所有已加载的装备图标生成各档纹理，并释放原图纹理（1254² 一张约 6MB 显存，
 * 生成后已无用武之地）。启动时调用一次，重复调用安全。
 */
export function installRelicIconTextures(scene: Phaser.Scene): void {
  for (const id of RELIC_ORDER) {
    const textureKey = RELICS[id].iconTexture;
    if (!textureKey || !scene.textures.exists(textureKey)) continue;
    if (scene.textures.exists(tierKey(textureKey, TIERS[0]))) continue;

    const source = scene.textures.get(textureKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement | null;
    if (!source?.width || !source?.height) continue;

    const master = resizeLongSide(source, MASTER_TIER);
    let built = false;
    for (const tier of TIERS) {
      const key = tierKey(textureKey, tier);
      if (scene.textures.exists(key)) continue;
      scene.textures.addCanvas(key, tier === MASTER_TIER ? master : resizeLongSide(master, tier));
      built = true;
    }
    if (built) scene.textures.remove(textureKey);
  }
}
