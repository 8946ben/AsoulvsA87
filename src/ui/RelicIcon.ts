import Phaser from 'phaser';
import type { RelicConfig } from '../data/relics';

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
  if (relic.iconTexture && scene.textures.exists(relic.iconTexture)) {
    const icon = scene.add.image(x, y, relic.iconTexture).setAlpha(alpha);
    const source = icon.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    return icon.setScale(Math.min(maxWidth / source.width, maxHeight / source.height));
  }
  return scene.add.text(x, y, relic.glyph, { fontSize: `${Math.round(Math.min(maxWidth, maxHeight))}px` })
    .setOrigin(0.5)
    .setAlpha(alpha);
}