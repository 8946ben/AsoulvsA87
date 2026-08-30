import Phaser from 'phaser';
import { SUN_RULES } from '../config/GameConfig';

/** 阳光：从天空掉落，或从植物产出，鼠标移入即可收集 */
export class Sun extends Phaser.GameObjects.Sprite {
  readonly amount: number;
  private targetY: number;
  private lifetime: number;
  private collected = false;
  /** 植物产出的阳光由弹出动画接管位移，此时跳过自由落体 */
  private landing = false;

  /** 收集成功时触发，参数为阳光值 */
  readonly onCollect = new Phaser.Events.EventEmitter();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    amount: number,
    targetY: number,
    /** 植物产出的阳光用小幅度弹出，而不是从天而降 */
    fromPlant = false,
  ) {
    super(scene, x, y, 'sun');
    this.amount = amount;
    this.targetY = targetY;
    this.lifetime = SUN_RULES.LIFETIME;

    scene.add.existing(this);
    this.setDepth(40);
    this.setScale(0.9);

    // 鼠标悬停与点击由 GameScene 统一命中判定，避免与种植操作冲突

    // 待机旋转/呼吸
    scene.tweens.add({
      targets: this,
      scale: 1.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    if (fromPlant) {
      // 从植物身上弹出一个小抛物线
      this.landing = true;
      scene.tweens.add({
        targets: this,
        x: x + Phaser.Math.Between(-26, 26),
        y: targetY,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.landing = false;
        },
      });
    }
  }

  update(_time: number, delta: number): void {
    if (this.collected || !this.active) return;
    // 弹出动画期间由 tween 独占控制位移
    if (this.landing) return;

    // 掉落阶段
    if (this.y < this.targetY) {
      this.y += (SUN_RULES.FALL_SPEED * delta) / 1000;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
      }
      return;
    }

    // 停留阶段：临近消失前闪烁提示
    this.lifetime -= delta;
    if (this.lifetime <= 3000) {
      this.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(this.lifetime / 160)));
    }
    if (this.lifetime <= 0) {
      this.fadeOut();
    }
  }

  /** 场景统一命中判定：某个世界坐标是否点中本阳光 */
  containsPoint(x: number, y: number): boolean {
    return (
      !this.collected && this.active && Phaser.Math.Distance.Between(x, y, this.x, this.y) < 34
    );
  }

  /** 玩家将鼠标移入或点击后收集 */
  collect(): void {
    if (this.collected || !this.active) return;
    this.collected = true;

    this.scene.tweens.killTweensOf(this);
    this.onCollect.emit('collect', this.amount);

    // 飞向左上角阳光计数器后消失
    this.scene.tweens.add({
      targets: this,
      x: 60,
      y: 40,
      scale: 0.45,
      alpha: 0.6,
      duration: 420,
      ease: 'Cubic.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  private fadeOut(): void {
    this.disableInteractive();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 400,
      onComplete: () => this.destroy(),
    });
  }

  destroy(fromScene?: boolean): void {
    this.onCollect.removeAllListeners();
    super.destroy(fromScene);
  }
}
