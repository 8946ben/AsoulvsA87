import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import type { Zombie } from './Zombie';

export interface ProjectileOptions {
  piercing?: boolean;
  stunMs?: number;
  splash?: number;
  empowered?: boolean;
  lobbed?: boolean;
}

export interface ProjectileContext {
  findTarget(row: number, x: number, ignored?: Set<Zombie>): Zombie | null;
  damageSplash(row: number, x: number, radius: number, damage: number, primary: Zombie): void;
}

export class Projectile extends Phaser.GameObjects.Sprite {
  readonly damage: number;
  readonly row: number;
  readonly speed: number;
  readonly options: ProjectileOptions;
  private readonly hit = new Set<Zombie>();
  private flight = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, damage: number, row: number, options: ProjectileOptions = {}, speed = 390) {
    super(scene, x, y, texture);
    this.damage = damage;
    this.row = row;
    this.options = options;
    this.speed = speed;
    scene.add.existing(this);
    this.setDepth(35 + row * 0.1);
    if (options.empowered) {
      this.setTint(0xffa94d).setScale(1.22);
      const glow = scene.add.circle(x, y, 14, 0xff9b42, 0.22).setDepth(this.depth - 0.1);
      scene.tweens.add({ targets: glow, alpha: 0, scale: 1.8, duration: 420, repeat: -1 });
      this.once('destroy', () => glow.destroy());
    }
  }

  update(_time: number, delta: number, ctx: ProjectileContext): void {
    if (!this.active) return;
    this.flight += delta;
    this.x += this.speed * delta / 1000;
    if (this.options.lobbed) {
      this.y += Math.sin(this.flight / 130) * 0.55;
      this.angle += delta * 0.18;
    }
    if (this.x > GAME_WIDTH + 40) { this.destroy(); return; }

    const target = ctx.findTarget(this.row, this.x, this.hit);
    if (!target) return;
    this.hit.add(target);
    target.takeDamage(this.damage);
    if (this.options.stunMs) target.stunFor(this.options.stunMs);
    if (this.options.splash) ctx.damageSplash(this.row, target.x, this.options.splash, this.damage * 0.45, target);
    this.spawnHitEffect(this.options.empowered ? 0xff9b42 : this.options.stunMs ? 0xfff2cf : 0xff87bd);
    if (!this.options.piercing) this.destroy();
  }

  private spawnHitEffect(color: number): void {
    const ring = this.scene.add.circle(this.x, this.y, 5, color, 0.9).setDepth(45);
    this.scene.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 220, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
}
