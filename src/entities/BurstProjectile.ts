import Phaser from 'phaser';
import type { Zombie } from './Zombie';

export interface BurstProjectileContext {
  findZombieAt(x: number, y: number, radius: number): Zombie | null;
  damageArea(x: number, y: number, radius: number, damage: number): void;
}

/** 冰淇淋主弹炸开后的八向实体子弹。 */
export class BurstProjectile extends Phaser.GameObjects.Sprite {
  private readonly velocityX: number;
  private readonly velocityY: number;
  private lifetime = 920;
  private age = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    angle: number,
    private readonly damage: number,
    private readonly explosive: boolean,
  ) {
    super(scene, x, y, texture);
    const speed = explosive ? 195 : 235;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    scene.add.existing(this);
    this.setDepth(38).setScale(explosive ? 0.78 : 0.72).setAngle(Phaser.Math.RadToDeg(angle));
    if (explosive) this.setTint(0xb9efff);
  }

  update(delta: number, ctx: BurstProjectileContext): void {
    if (!this.active) return;
    const dt = delta / 1000;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    this.angle += delta * (this.explosive ? 0.22 : 0.34);
    this.age += delta;
    this.lifetime -= delta;

    // 先飞离主弹爆点再启用碰撞，避免八枚子弹在第一帧重复命中原目标。
    const target = this.age >= 140 ? ctx.findZombieAt(this.x, this.y, this.explosive ? 25 : 20) : null;
    if (target) {
      if (this.explosive) ctx.damageArea(this.x, this.y, 58, this.damage);
      else target.takeDamage(this.damage);
      this.spawnHitEffect();
      this.destroy();
      return;
    }
    if (this.lifetime <= 0) this.destroy();
  }

  private spawnHitEffect(): void {
    const color = this.explosive ? 0xb9efff : 0xff8ab6;
    const ring = this.scene.add.circle(this.x, this.y, 6, color, 0.85).setDepth(48);
    this.scene.tweens.add({ targets: ring, scale: this.explosive ? 5 : 2.8, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
  }
}
