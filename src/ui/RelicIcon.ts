import Phaser from 'phaser';
import type { RelicConfig } from '../data/relics';
import { resolveRelicIconTexture } from '../core/RelicIconTextures';

/** Creates an equipment visual, preferring approved icon art and falling back to its emoji glyph. */
export function createRelicIcon(
  scene: Phaser.Scene,
  relic: RelicConfig,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  alpha = 1,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  // 按显示尺寸选预缩放档位，避免 1254px 源图直接压到十几像素发糊。
  const textureKey = relic.iconTexture
    ? resolveRelicIconTexture(scene, relic.iconTexture, maxWidth, maxHeight)
    : undefined;
  if (textureKey) {
    const icon = scene.add.image(x, y, textureKey).setAlpha(alpha);
    const source = icon.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    return icon.setScale(Math.min(maxWidth / source.width, maxHeight / source.height));
  }
  return scene.add.text(x, y, relic.glyph, { fontSize: `${Math.round(Math.min(maxWidth, maxHeight))}px` })
    .setOrigin(0.5)
    .setAlpha(alpha);
}