import Phaser from 'phaser';

const TEXT_RESOLUTION = Math.min(window.devicePixelRatio || 1, 2);

/** 提高 Text 内部 Canvas 纹理分辨率；同时递归处理 Container 内的卡片文字。 */
export function sharpenText<T extends Phaser.GameObjects.Text>(text: T): T {
  text.setResolution(TEXT_RESOLUTION);
  return text;
}

export function sharpenSceneText(scene: Phaser.Scene): void {
  const visit = (item: Phaser.GameObjects.GameObject): void => {
    if (item instanceof Phaser.GameObjects.Text) {
      sharpenText(item);
      return;
    }
    if (item instanceof Phaser.GameObjects.Container) {
      for (const child of item.list) visit(child);
    }
  };
  for (const child of scene.children.list) visit(child);
}
