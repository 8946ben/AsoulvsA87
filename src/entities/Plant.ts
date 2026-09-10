import Phaser from 'phaser';
import { GRID, PLANT_DISPLAY, TEX } from '../config/GameConfig';
import { PLANTS, type PlantConfig, type PlantType } from '../data/plants';
import type { ProjectileOptions } from './Projectile';
import type { Zombie } from './Zombie';

export interface PlantContext {
  getNearestZombie(row: number, fromX: number): Zombie | null;
  getNearbyZombie(row: number, x: number, maxGap: number): Zombie | null;
  spawnProjectile(x: number, y: number, texture: string, damage: number, row: number, options?: ProjectileOptions): void;
  spawnSun(x: number, y: number, amount: number): void;
  damageArea(x: number, y: number, radius: number, damage: number, stunMs?: number): void;
  damageGridArea(row: number, col: number, damage: number, stunMs?: number): void;
  freezeAll(durationMs: number): void;
  replacePlant(plant: Plant, type: PlantType | null): void;
  getCreamChanceBonus(): number;
  getDamageMultiplier(type: PlantType): number;
  hasActivePlant(type: PlantType): boolean;
  spawnSpecialBeijixing(row: number, worldX: number): boolean;
}

export class Plant extends Phaser.GameObjects.Sprite {
  readonly config: PlantConfig;
  readonly rank: 1 | 2;
  readonly row: number;
  readonly col: number;
  hp: number;
  maxHp: number;
  private attackTimer = 0;
  private produceTimer = 0;
  private specialTimer = 0;
  private transformed = false;
  private resolving = false;
  private synergyEmpowered = false;
  private lastCtx: PlantContext | null = null;
  private readonly baseY: number;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly baseScale: number;
  private readonly dispW: number;
  private readonly dispH: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PlantType, row: number, col: number, rank: 1 | 2 = 2) {
    const config = PLANTS[type];
    super(scene, x, y, config.texture);
    const src = scene.textures.get(config.texture).getSourceImage() as HTMLImageElement;
    const srcW = src?.width || 78; const srcH = src?.height || 94;
    this.baseScale = Math.min(PLANT_DISPLAY.MAX_W / srcW, PLANT_DISPLAY.MAX_H / srcH);
    this.dispW = srcW * this.baseScale; this.dispH = srcH * this.baseScale;
    this.config = config; this.rank = rank; this.row = row; this.col = col; this.hp = config.hp; this.maxHp = config.hp;
    this.baseY = y;
    this.shadow = scene.add.ellipse(x, y + PLANT_DISPLAY.SHADOW_Y, 48, 10, 0x071221, 0.22).setDepth(7 + row * 0.1);
    scene.add.existing(this);
    this.setDepth(14 + row * 0.1);
    this.hpBar = scene.add.graphics().setDepth(this.depth + 0.1);
    this.setScale(this.baseScale * 0.35).setAlpha(0);
    scene.tweens.add({ targets: this, scale: this.baseScale, alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }

  update(time: number, delta: number, ctx: PlantContext): void {
    if (!this.active) return;
    this.lastCtx = ctx;
    this.shadow.setPosition(this.x, this.y + PLANT_DISPLAY.SHADOW_Y);
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
          const cream = Math.random() < (this.config.stunChance ?? 0) + ctx.getCreamChanceBonus();
          ctx.spawnProjectile(this.x + 24, this.y - 18, cream ? 'projectile_cream' : (this.config.projectile ?? 'projectile_chocolate'), this.config.attackDamage ?? 30, this.row, { lobbed: true, stunMs: cream ? this.config.stunMs : undefined, splash: 35 });
          this.pulse(1.1, 150);
        }
        break;
      case 'bomb':
        this.specialTimer += delta;
        this.setScale(this.baseScale * (1 + Math.sin(time / 55) * 0.07));
        if (!this.resolving && this.specialTimer >= 500) {
          this.resolving = true; ctx.damageGridArea(this.row, this.col, this.config.attackDamage ?? 1500, 350);
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
          ctx.replacePlant(this, this.rank >= 2 ? (roll < 0.2 ? 'fiona' : roll < 0.4 ? 'xiaohainuo' : null) : null);
        }
        break;
      case 'squash':
        if (!this.resolving && target && target.x - this.x < 165) this.resolveSquash(target, ctx);
        break;
      case 'lifesteal':
        this.updateStarCandy(delta, target, ctx);
        break;
      case 'sunlobber':
        this.updateXiLanai(delta, target, ctx);
        break;
      case 'burstlobber':
        this.updateJiaXinNaiTang(delta, target, ctx);
        break;
      case 'soulshooter':
        this.updateYiGeHun(delta, target, ctx);
        break;
      case 'specialwall':
        break;
      case 'wall':
      default:
        break;
    }
  }

  private updateBella(delta: number, target: Zombie | null, ctx: PlantContext): void {
    const nearby = ctx.getNearbyZombie(this.row, this.x, GRID.CELL_W);
    if (nearby && !this.transformed) this.enterBellaMineForm();
    if (this.transformed) {
      this.attackTimer += delta;
      // 与阻挡判定保持同一接敌宽度；大型虫的图片中心很远，但头部已碰到贝拉。
      const contact = ctx.getNearbyZombie(this.row, this.x, 43);
      if (contact) {
        ctx.damageArea(this.x, this.y, 100, 1050, 300); this.burst(0xff554f); ctx.replacePlant(this, null);
      }
      return;
    }
    if (!target) return;
    this.attackTimer += delta;
    if (this.attackTimer >= (this.config.attackInterval ?? 2700)) {
      this.attackTimer = 0; this.fire(ctx, { lobbed: true, splash: 42 }, true); this.pulse(1.08, 150);
    }
  }

  /** 土豆雷形态：贝拉下沉，只露出紫发、眼睛和兔耳等待近身引爆。 */
  private enterBellaMineForm(): void {
    this.transformed = true;
    this.scene.tweens.killTweensOf(this);
    this.setTexture(TEX.BELLA_MINE);
    const src = this.scene.textures.get(TEX.BELLA_MINE).getSourceImage() as HTMLImageElement;
    const scale = Math.min(PLANT_DISPLAY.MAX_W / (src?.width || 84), (GRID.CELL_H * 0.58) / (src?.height || 68));
    // 如果角色落地第一帧就接敌，入场透明度动画会被 killTweensOf 中止；
    // 形态切换必须主动恢复可见性，不能继承尚为 0 的 alpha。
    this.setPosition(this.x, this.baseY + 17).setScale(scale * 0.4).setAlpha(1).setVisible(true).clearTint();
    this.shadow.setVisible(false);
    this.scene.tweens.add({ targets: this, scale, duration: 220, ease: 'Back.easeOut' });
  }

  private updateEileen(delta: number, target: Zombie | null, ctx: PlantContext): void {
    const nearby = ctx.getNearbyZombie(this.row, this.x, GRID.CELL_W);
    if (!nearby) {
      if (this.transformed) this.exitSpikeForm();
      if (!target) return;
      this.attackTimer += delta;
      if (this.attackTimer >= (this.config.attackInterval ?? 1900)) {
        this.attackTimer = 0;
        this.fire(ctx, { piercing: true }, false); this.recoil();
      }
      return;
    }
    this.attackTimer += delta;
    if (!this.transformed) this.enterSpikeForm();
    if (this.attackTimer >= 850) {
      this.attackTimer = 0; nearby.takeDamage(26); nearby.stunFor(520);
      const spike = this.scene.add.triangle(nearby.x, nearby.y + 30, 0, 28, 9, 0, 18, 28, 0xa76cff, 0.9).setDepth(33);
      this.scene.tweens.add({ targets: spike, y: spike.y - 20, alpha: 0, duration: 350, onComplete: () => spike.destroy() });
    }
  }

  /** 地刺形态：角色消失，原地替换为一碗番茄牛肉汤，普通僵尸啃不到，仅车碾致命。 */
  private enterSpikeForm(): void {
    this.transformed = true;
    this.scene.tweens.killTweensOf(this);
    this.setTexture(TEX.EILEEN_SOUP);
    const src = this.scene.textures.get(TEX.EILEEN_SOUP).getSourceImage() as HTMLImageElement;
    const scale = Math.min(PLANT_DISPLAY.MAX_W / (src?.width || 84), (GRID.CELL_H * 0.52) / (src?.height || 58));
    this.setPosition(this.x, this.baseY + 15).setScale(scale * 0.4).setAlpha(1).setVisible(true).clearTint();
    this.shadow.setVisible(false);
    this.scene.tweens.add({ targets: this, scale, duration: 220, ease: 'Back.easeOut' });
  }

  private exitSpikeForm(): void {
    this.transformed = false;
    this.scene.tweens.killTweensOf(this);
    this.setTexture(this.config.texture);
    this.setPosition(this.x, this.baseY).setScale(this.baseScale).setAlpha(1).setVisible(true).clearTint();
    this.shadow.setVisible(true);
  }

  private updateStarCandy(delta: number, target: Zombie | null, ctx: PlantContext): void {
    const advanced = this.rank >= 2;
    const empowered = advanced && ctx.hasActivePlant('bella') && ctx.hasActivePlant('diana');
    if (empowered !== this.synergyEmpowered) {
      const nextMax = this.config.hp * (empowered ? 2 : 1);
      this.hp = Math.max(1, Math.round(this.hp * nextMax / this.maxHp));
      this.maxHp = nextMax;
      this.synergyEmpowered = empowered;
      this.pulse(1.16, 260);
    }
    if (!target) return;
    this.attackTimer += delta;
    const interval = empowered ? 500 : (this.config.attackInterval ?? 1000);
    if (this.attackTimer < interval) return;
    this.attackTimer = 0;
    const critical = advanced && Math.random() < 0.3;
    const damage = (this.config.attackDamage ?? 30) * (critical ? 3 : 1);
    const lifestealRatio = empowered ? 1 : 0.5;
    ctx.spawnProjectile(
      this.x + this.dispW * 0.3, this.y - 12,
      this.config.projectile ?? 'projectile_star_candy', damage, this.row,
      { empowered: critical, onHit: (dealt) => this.heal(dealt * lifestealRatio) },
    );
    this.recoil();
  }

  private updateXiLanai(delta: number, target: Zombie | null, ctx: PlantContext): void {
    this.produceTimer += delta;
    if (this.produceTimer >= (this.config.produceInterval ?? 20000)) {
      this.produceTimer = 0;
      ctx.spawnSun(this.x, this.y - 14, this.config.produceAmount ?? 50);
      this.pulse(1.16, 230);
    }
    if (!target) return;
    this.attackTimer += delta;
    if (this.attackTimer < (this.config.attackInterval ?? 2100)) return;
    this.attackTimer = 0;
    const specialChance = this.rank >= 2 ? (ctx.hasActivePlant('bella') && ctx.hasActivePlant('eileen') ? 0.3 : 0.15) : 0;
    ctx.spawnProjectile(
      this.x + this.dispW * 0.3, this.y - 16,
      this.config.projectile ?? 'projectile_star_candy', this.config.attackDamage ?? 40, this.row,
      { lobbed: true, onHit: (_dealt, hitTarget) => {
        if (Math.random() < specialChance) ctx.spawnSpecialBeijixing(hitTarget.row, hitTarget.x);
      } },
    );
    this.pulse(1.1, 150);
  }

  private updateJiaXinNaiTang(delta: number, target: Zombie | null, ctx: PlantContext): void {
    if (!target) return;
    this.attackTimer += delta;
    if (this.attackTimer < (this.config.attackInterval ?? 2000)) return;
    this.attackTimer = 0;
    const synergy = this.rank >= 2 && ctx.hasActivePlant('eileen') && ctx.hasActivePlant('diana');
    const critical = synergy && Math.random() < 0.3;
    const damage = Math.round((this.config.attackDamage ?? 40) * (critical ? 1.5 : 1));
    ctx.spawnProjectile(
      this.x + this.dispW * 0.3, this.y - 16,
      this.config.projectile ?? 'projectile_candy_ice_cream', damage, this.row,
      { lobbed: true, empowered: critical, candyBurst: { count: 8, damage: 30, explosive: critical } },
    );
    this.pulse(critical ? 1.16 : 1.1, 170);
  }

  private updateYiGeHun(delta: number, target: Zombie | null, ctx: PlantContext): void {
    if (!target) return;
    this.attackTimer += delta;
    if (this.attackTimer < (this.config.attackInterval ?? 1500)) return;
    this.attackTimer = 0;
    ctx.spawnProjectile(
      this.x + this.dispW * 0.3, this.y - 14,
      this.config.projectile ?? 'projectile_soul_candy', this.config.attackDamage ?? 20, this.row,
      { soulDebuff: { durationMs: 3000, maxStacks: this.rank >= 2 ? 3 : 1 } },
    );
    this.recoil();
  }

  private heal(amount: number): void {
    if (!this.active || amount <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  get isSpecialWall(): boolean { return this.config.behavior === 'specialwall'; }
  /** 乃琳地刺形态：不被普通僵尸当作啃食目标，只有 crushPlants 的车辆能碾毁。 */
  get isSpikeForm(): boolean { return this.config.behavior === 'eileen' && this.transformed; }

  takeSpecialHit(attackPower: number): void {
    if (!this.active || !this.isSpecialWall) return;
    this.hp -= 1;
    this.lastCtx?.spawnSun(this.x, this.y - 12, Math.max(1, Math.round(attackPower * 0.3)));
    this.pulse(1.12, 140);
    if (this.hp <= 0) this.destroy();
  }

  private resolveSquash(target: Zombie, ctx: PlantContext): void {
    this.resolving = true;
    this.scene.tweens.add({
      targets: this, x: target.x, y: target.y - 45, scale: this.baseScale * 1.15,
      duration: 300, ease: 'Quad.easeOut', yoyo: true,
      onComplete: () => {
        target.takeDamage(this.config.attackDamage ?? 1200); this.burst(0xff7fbd);
        const roll = Math.random();
        ctx.replacePlant(this, this.rank >= 2 ? (roll < 0.2 ? 'gladys' : roll < 0.4 ? 'xinqiuyi' : null) : null);
      },
    });
  }

  private fire(ctx: PlantContext, options: ProjectileOptions, lobbed: boolean): void {
    const damage = Math.round((this.config.attackDamage ?? 20) * ctx.getDamageMultiplier(this.config.type));
    ctx.spawnProjectile(this.x + this.dispW * 0.3, this.y - 12, this.config.projectile ?? 'projectile_candy', damage, this.row, { ...options, lobbed });
  }
  private fireBurst(ctx: PlantContext): void {
    const count = this.config.burstCount ?? 1;
    const damage = Math.round((this.config.attackDamage ?? 20) * ctx.getDamageMultiplier(this.config.type));
    for (let i = 0; i < count; i++) {
      const offsetX = (i - (count - 1) / 2) * 8;
      ctx.spawnProjectile(this.x + this.dispW * 0.3 + offsetX, this.y - 12, this.config.projectile ?? 'projectile_candy', damage, this.row, {});
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
    if (this.isSpecialWall) return;
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
