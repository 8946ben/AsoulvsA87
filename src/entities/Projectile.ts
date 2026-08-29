import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import type { Zombie } from './Zombie';

export interface ProjectileContext {
  /** 查找本行中与子弹碰撞的僵尸（取最靠左的一只） */
  findTarget(row: number, x: number): Zombie | null;
}

/** 豌豆等直线飞行的子弹 */
export class Projectile extends Phaser.GameObjects.Sprite {
  readonly damage: number;
  readonly row: number;
  /** 飞行速度（像素/秒） */
  readonly speed: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    damage: number,
    row: number,
    speed = 380,
  ) {
    super(scene, x, y, texture);
    this.damage = damage;
    this.row = row;
    this.speed = speed;

    scene.add.existing(this);
    this.setDepth(30 + row * 0.1);
  }

  update(_time: number, delta: number, ctx: ProjectileContext): void {
    if (!this.active) return;

    this.x += (this.speed * delta) / 1000;

    // 飞出屏幕
    if (this.x > GAME_WIDTH + 30) {
      this.destroy();
      return;
    }

    const target = ctx.findTarget(this.row, this.x);
    if (target) {
      target.takeDamage(this.damage);
      this.spawnHitEffect();
      this.destroy();
    }
  }

  private spawnHitEffect(): void {
    const splash = this.scene.add.circle(this.x, this.y, 6, 0xa5d6a7, 0.9);
    splash.setDepth(35);
    this.scene.tweens.add({
      targets: splash,
      scale: 2.2,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => splash.destroy(),
    });
  }
}
