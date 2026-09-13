import Phaser from 'phaser';

export interface ParentSceneData { returnScene?: string; }

/** Opens a child page while preserving the current page and its state. */
export function openChildScene(scene: Phaser.Scene, key: string, data: Record<string, unknown> = {}): void {
  const parentKey = scene.scene.key;
  scene.scene.launch(key, { ...data, returnScene: parentKey });
  scene.scene.sleep(parentKey);
}

/** Closes the child page and restores the exact page that opened it. */
export function returnToParentScene(scene: Phaser.Scene, returnScene?: string, fallback = 'MenuScene'): void {
  const currentKey = scene.scene.key;
  if (returnScene && scene.scene.isSleeping(returnScene)) {
    scene.scene.stop(currentKey);
    scene.scene.wake(returnScene);
    return;
  }
  scene.scene.start(fallback);
}

/** 被唤醒的页面不会重跑 create，注册 wake 刷新以同步子页面期间变化的持久化数据。 */
export function refreshOnWake(scene: Phaser.Scene, onWake: () => void): void {
  scene.events.on('wake', onWake);
  scene.events.once('shutdown', () => scene.events.off('wake', onWake));
}
