import Phaser from 'phaser';
import { GRID } from '../config/GameConfig';
import { PLANTS, type PlantConfig, type PlantType } from '../data/plants';
import type { ProjectileOptions } from './Projectile';
import type { Zombie } from './Zombie';

export interface PlantContext {
  getNearestZombie(row: number, fromX: number): Zombie | null;
  spawnProjectile(x: number, y: number, texture: string, damage: number, row: number, options?: ProjectileOptions): void;
  spawnSun(x: number, y: number, amount: number): void;
  damageArea(x: number, y: number, radius: number, damage: number, stunMs?: number): void;
  freezeAll(durationMs: number): void;
  replacePlant(plant: Plant, type: PlantType | null): void;
}

export class Plant extends Phaser.GameObjects.Sprite {
  readonly config: PlantConfig;
  readonly row: number;
  readonly col: number;
  hp: number;
  maxHp: number;
  private attackTimer = 0;
  private produceTimer = 0;
  private specialTimer = 0;
  private transformed = false;
  private resolving = false;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly baseScale: number;
  private readonly dispW: number;
  private readonly dispH: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PlantType, row: number, col: number) {
    const config = PLANTS[type];
    super(scene, x, y, config.texture);
    const src = scene.textures.get(config.texture).getSourceImage() as HTMLImageElement;
    const srcW = src?.width || 78; const srcH = src?.height || 94;
    this.baseScale = Math.min((GRID.CELL_W - 6) / srcW, (GRID.CELL_H - 6) / srcH);
    this.dispW = srcW * this.baseScale; this.dispH = srcH * this.baseScale;
    this.config = config; this.row = row; this.col = col; this.hp = config.hp; this.maxHp = config.hp;
    this.shadow = scene.add.ellipse(x, y + 42, 57, 13, 0x071221, 0.24).setDepth(7 + row * 0.1);
    scene.add.existing(this);
    this.setDepth(14 + row * 0.1);
    this.hpBar = scene.add.graphics().setDepth(this.depth + 0.1);
    this.setScale(this.baseScale * 0.35).setAlpha(0);
    scene.tweens.add({ targets: this, scale: this.baseScale, alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }

  update(time: number, delta: number, ctx: PlantContext): void {
    if (!this.active) return;
    this.shadow.setPosition(this.x, this.y + 42);
    this.redrawHpBar();
    if (!this.resolving) this.angle = Math.sin(time / 360 + this.col * 0.7) * 1.4;
    const target = ctx.getNearestZombie(this.row, this.x);

    switch (this.config.behavior) {
      case 'producer':
        this.produceTimer += delta;
        if (this.produceTimer >= (this.config.produceInterval ?? Infinity)) {
          this.produceTimer = 0; ctx.spawnSun(this.x, this.y - 14, this.config.produceAmount ?? 25);
          this.pulse(1.18, 230);
        }
        break;
      case 'shooter':
        this.attackTimer += delta;
        if (target && this.attackTimer >= (this.config.attackInterval ?? Infinity)) {
          this.attackTimer = 0; this.fire(ctx, {}, false); this.recoil();
        }
        break;
      case 'lobber':
        this.attackTimer += delta;
        if (target && this.attackTimer >= (this.config.attackInterval ?? Infinity)) {
          this.attackTimer = 0;
          const cream = Math.random() < (this.config.stunChance ?? 0);
          ctx.spawnProjectile(this.x + 24, this.y - 18, cream ? 'projectile_cream' : (this.config.projectile ?? 'projectile_chocolate'), this.config.attackDamage ?? 30, this.row, { lobbed: true, stunMs: cream ? this.config.stunMs : undefined, splash: 35 });
          this.pulse(1.1, 150);
        }
        break;
      case 'bomb':
        this.specialTimer += delta;
        this.setScale(this.baseScale * (1 + Math.sin(time / 55) * 0.07));
        if (!this.resolving && this.specialTimer >= 520) {
          this.resolving = true; ctx.damageArea(this.x, this.y, 142, this.config.attackDamage ?? 1500, 350);
          this.burst(0xff5a91); ctx.replacePlant(this, null);
        }
        break;
      case 'bella':
        this.updateBella(delta, target, ctx);
        break;
      case 'eileen':
        this.updateEileen(delta, target, ctx);
        break;
      case 'rapid':
        if (target) {
          this.attackTimer += delta;
          const distance = Math.max(0, target.x - this.x);
          const baseInterval = this.config.attackInterval ?? 950;
          const distanceRatio = Phaser.Math.Clamp((distance - GRID.CELL_W) / (GRID.CELL_W * 7), 0, 1);
          const speedMultiplier = Phaser.Math.Linear(5, 1, distanceRatio);
          const interval = baseInterval / speedMultiplier;
          if (this.attackTimer >= interval) { this.attackTimer = 0; this.fireBurst(ctx); this.recoil(); }
        }
        break;
      case 'freeze':
        this.specialTimer += delta;
        if (!this.resolving && this.specialTimer >= 520) {
          this.resolving = true;
          ctx.freezeAll(this.config.freezeDuration ?? 4000);
          this.burst(0x8de8ff);
          const roll = Math.random();
          ctx.replacePlant(this, roll < 0.2 ? 'fiona' : roll < 0.4 ? 'xiaohainuo' : null);
        }
        break;
      case 'squash':
        if (!this.resolving && target && target.x - this.x < 165) this.resolveSquash(target, ctx);
        break;
      case 'wall':
      default:
        break;
    }
  }

  private updateBella(delta: number, target: Zombie | null, ctx: PlantContext): void {
    if (!target) return;
    const near = target.x - this.x <= GRID.CELL_W;
    if (near && !this.transformed) { this.transformed = true; this.setTint(0xff776f); this.pulse(1.18, 220); }
    if (this.transformed) {
      this.attackTimer += delta;
      if (target.x - this.x < 48) {
        ctx.damageArea(this.x, this.y, 100, 1050, 300); this.burst(0xff554f); ctx.replacePlant(this, null);
      }
      return;
    }
    this.attackTimer += delta;
    if (this.attackTimer >= (this.config.attackInterval ?? 2700)) {
      this.attackTimer = 0; this.fire(ctx, { lobbed: true, splash: 42 }, true); this.pulse(1.08, 150);
    }
  }

  private updateEileen(delta: number, target: Zombie | null, ctx: PlantContext): void {
    if (!target) return;
    const near = target.x - this.x <= GRID.CELL_W;
    this.attackTimer += delta;
    if (near) {
      if (!this.transformed) { this.transformed = true; this.setTint(0xc59aff); this.pulse(1.16, 200); }
      if (this.attackTimer >= 850) {
        this.attackTimer = 0; target.takeDamage(26); target.stunFor(520);
        const spike = this.scene.add.triangle(target.x, target.y + 30, 0, 28, 9, 0, 18, 28, 0xa76cff, 0.9).setDepth(33);
        this.scene.tweens.add({ targets: spike, y: spike.y - 20, alpha: 0, duration: 350, onComplete: () => spike.destroy() });
      }
    } else if (this.attackTimer >= (this.config.attackInterval ?? 1900)) {
      this.transformed = false; this.clearTint(); this.attackTimer = 0;
      this.fire(ctx, { piercing: true }, false); this.recoil();
    }
  }

  private resolveSquash(target: Zombie, ctx: PlantContext): void {
    this.resolving = true;
    this.scene.tweens.add({
      targets: this, x: target.x, y: target.y - 45, scale: this.baseScale * 1.15,
      duration: 300, ease: 'Quad.easeOut', yoyo: true,
      onComplete: () => {
        target.takeDamage(this.config.attackDamage ?? 1200); this.burst(0xff7fbd);
        const roll = Math.random();
        ctx.replacePlant(this, roll < 0.2 ? 'gladys' : roll < 0.4 ? 'xinqiuyi' : null);
      },
    });
  }

  private fire(ctx: PlantContext, options: ProjectileOptions, lobbed: boolean): void {
    ctx.spawnProjectile(this.x + this.dispW * 0.3, this.y - 12, this.config.projectile ?? 'projectile_candy', this.config.attackDamage ?? 20, this.row, { ...options, lobbed });
  }
  private fireBurst(ctx: PlantContext): void {
    const count = this.config.burstCount ?? 1;
    for (let i = 0; i < count; i++) {
      const offsetX = (i - (count - 1) / 2) * 8;
      ctx.spawnProjectile(this.x + this.dispW * 0.3 + offsetX, this.y - 12, this.config.projectile ?? 'projectile_candy', this.config.attackDamage ?? 20, this.row, {});
    }
  }
  private recoil(): void { this.scene.tweens.add({ targets: this, x: this.x - 4, duration: 65, yoyo: true, ease: 'Quad.easeOut' }); }
  private pulse(scale: number, duration: number): void { this.scene.tweens.add({ targets: this, scale: this.baseScale * scale, duration, yoyo: true, ease: 'Sine.easeInOut' }); }
  private burst(color: number): void {
    const ring = this.scene.add.circle(this.x, this.y, 20, color, 0.38).setDepth(70);
    this.scene.tweens.add({ targets: ring, scale: 6, alpha: 0, duration: 460, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }

  takeDamage(amount: number): void {
    if (!this.active) return;
    this.hp -= amount;
    if (this.hp <= 0) this.destroy();
  }

  private redrawHpBar(): void {
    this.hpBar.clear();
    if (this.hp >= this.maxHp) return;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1); const w = this.dispW * 0.66; const y = this.y + this.dispH * 0.42;
    this.hpBar.fillStyle(0x07101d, 0.75); this.hpBar.fillRoundedRect(this.x - w / 2 - 1, y - 1, w + 2, 7, 3);
    this.hpBar.fillStyle(ratio > 0.45 ? 0x65efad : ratio > 0.2 ? 0xffc95d : 0xff5b77, 1); this.hpBar.fillRoundedRect(this.x - w / 2, y, w * ratio, 5, 2);
  }

  destroy(fromScene?: boolean): void {
    this.scene?.tweens.killTweensOf(this); this.hpBar?.destroy(); this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
