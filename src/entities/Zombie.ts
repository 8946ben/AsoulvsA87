import Phaser from 'phaser';
import { GAME_WIDTH, GRID, HOUSE_LINE_X, TEX } from '../config/GameConfig';
import { ZOMBIES, type ZombieConfig, type ZombieType } from '../data/zombies';
import type { Plant } from './Plant';

export type ZombieState = 'walking' | 'eating' | 'dead';
export interface ZombieContext {
  getBlockingPlant(row: number, zombieX: number, leadX: number, direction: -1 | 1): Plant | null;
  onReachHouse(zombie: Zombie): void;
  spawnMinion(type: ZombieType, row: number, x: number): void;
}

export class Zombie extends Phaser.GameObjects.Sprite {
  readonly config: ZombieConfig;
  readonly row: number;
  hp: number;
  readonly maxHp: number;
  state: ZombieState = 'walking';
  private target: Plant | null = null;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private hasBreached = false;
  private hasVaulted = false;
  private accessoryBroken = false;
  private vaulting = false;
  private charging: boolean;
  private stunRemaining = 0;
  private slowRemaining = 0;
  private summonTimer = 0;
  private readonly baseY: number;
  private crawlPhase: number;
  private direction: -1 | 1 = -1;
  private surfaced = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: ZombieType, row: number) {
    const config = ZOMBIES[type];
    const spawnY = y - (config.flying ? 34 : 0);
    super(scene, x, spawnY, config.texture);
    this.config = config; this.row = row; this.hp = config.hp; this.maxHp = config.hp;
    this.baseY = spawnY;
    this.crawlPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.charging = Boolean(config.charge);
    this.shadow = scene.add.ellipse(x, y + 43, config.boss ? 76 : 52, 14, 0x091221, config.flying ? 0.12 : 0.28).setDepth(15 + row * 0.1);
    scene.add.existing(this);
    this.setDepth(24 + row * 0.1).setScale(config.scale ?? 1);
    this.hpBar = scene.add.graphics().setDepth(this.depth + 0.1);

    this.setAlpha(0).setScale((config.scale ?? 1) * 0.7);
    scene.tweens.add({ targets: this, alpha: 1, scale: config.scale ?? 1, duration: 420, ease: 'Back.easeOut' });
  }

  update(time: number, delta: number, ctx: ZombieContext): void {
    if (this.state === 'dead' || !this.active) return;
    this.animateBody(time, delta);
    const shadowOffset = this.config.flying ? 77 : this.config.boss ? 52 : 43;
    this.shadow.setPosition(this.x + this.displayWidth * 0.08, this.baseY + shadowOffset);
    this.redrawHpBar();

    if (this.stunRemaining > 0) {
      this.stunRemaining -= delta;
      this.setTint(0xb8ecff);
      if (this.stunRemaining <= 0) this.clearTint();
      return;
    }
    if (this.slowRemaining > 0) this.slowRemaining -= delta;

    if (this.config.summonInterval) {
      this.summonTimer += delta;
      if (this.summonTimer >= this.config.summonInterval) {
        this.summonTimer = 0;
        ctx.spawnMinion('knight', this.row, this.x + 36);
        this.scene.cameras.main.flash(180, 112, 35, 140, false);
      }
    }

    const dt = delta / 1000;
    if (this.state === 'eating') {
      if (this.target?.active && this.target.hp > 0) {
        this.target.takeDamage(this.config.attackDps * dt);
        return;
      }
      this.target = null; this.state = 'walking'; this.setScale(this.config.scale ?? 1);
    }

    if (this.vaulting) return;
    // 素材头部位于画面左侧，用头部前缘而非图片中心做接敌判定。
    const leadX = this.x + this.direction * this.displayWidth * 0.31;
    const underground = Boolean(this.config.tunneling && !this.surfaced);
    const blocker = (this.config.flying || underground) ? null : ctx.getBlockingPlant(this.row, this.x, leadX, this.direction);
    if (blocker) {
      if (this.config.crushPlants) {
        blocker.takeDamage(blocker.hp + 1);
        this.scene.cameras.main.shake(90, 0.0035);
        return;
      }
      if (this.config.canVault && !this.hasVaulted) {
        this.hasVaulted = true; this.vaulting = true;
        const startY = this.baseY;
        const landingX = blocker.x + this.direction * 78;
        const vaultHeight = this.config.vaultHeight ?? 62;
        this.scene.tweens.add({
          targets: this, x: landingX, duration: 520, ease: 'Linear',
          onUpdate: (tween: Phaser.Tweens.Tween) => {
            const arc = Math.sin(tween.progress * Math.PI);
            this.y = startY - arc * vaultHeight;
            this.angle = -arc * 16;
          },
          onComplete: () => {
            this.vaulting = false; this.x = landingX; this.y = this.baseY; this.angle = 0;
            if (this.config.dropGearAfterVault) this.setTexture(TEX.ZOMBIE_BASIC);
          },
        });
        return;
      }
      this.charging = false;
      this.target = blocker; this.state = 'eating';
      return;
    }

    const rageModifier = this.accessoryBroken ? (this.config.enragedSpeedMultiplier ?? 1) : 1;
    const postVaultModifier = this.hasVaulted ? (this.config.postVaultSpeedMultiplier ?? 1) : 1;
    const modifier = (this.charging ? 1.45 : 1) * rageModifier * postVaultModifier * (this.slowRemaining > 0 ? 0.48 : 1);
    // 蠕动时交替“收缩蓄力—伸展滑行”，不再保持匀速平移。
    const stride = 0.68 + 0.58 * (0.5 + 0.5 * Math.cos(this.crawlPhase));
    this.x += this.direction * this.config.speed * modifier * stride * dt;
    if (underground && leadX <= GRID.OFFSET_X - 15) {
      this.surfaced = true;
      this.direction = 1;
      this.x = GRID.OFFSET_X - 22;
      this.setFlipX(true);
      this.scene.cameras.main.shake(120, 0.003);
      return;
    }
    if (!this.config.tunneling && this.direction < 0 && leadX <= HOUSE_LINE_X && !this.hasBreached) {
      this.hasBreached = true; ctx.onReachHouse(this);
    }
    if (this.x < -100 || (this.direction > 0 && this.x > GAME_WIDTH + 100)) this.destroy();
  }

  takeDamage(amount: number): void {
    if (!this.active || this.state === 'dead') return;
    this.hp -= amount;
    if (!this.accessoryBroken && this.config.accessoryBreakHp !== undefined && this.hp <= this.config.accessoryBreakHp) {
      this.accessoryBroken = true;
      if (this.config.breakTexture) this.setTexture(this.config.breakTexture);
      this.scene.cameras.main.shake(90, 0.0025);
    }
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(55, () => { if (this.active && this.stunRemaining <= 0) this.clearTint(); });
    if (this.hp <= 0) this.die();
  }

  stunFor(ms: number): void { this.stunRemaining = Math.max(this.stunRemaining, ms); }
  slowFor(ms: number): void { this.slowRemaining = Math.max(this.slowRemaining, ms); }

  get targetable(): boolean { return !this.config.tunneling || this.surfaced; }

  /** 用整体的压缩、伸展、重心起伏和阴影变化模拟软体虫蠕动。 */
  private animateBody(time: number, delta: number): void {
    if (this.vaulting) return;
    const moving = this.state === 'walking' && this.stunRemaining <= 0;
    const underground = Boolean(this.config.tunneling && !this.surfaced);
    this.crawlPhase += delta * (moving ? 0.0105 : 0.0042);
    const wave = Math.sin(this.crawlPhase);
    const ripple = Math.sin(this.crawlPhase * 2 + 0.7);
    const baseScale = this.config.scale ?? 1;
    if (this.config.flying) {
      this.setScale(baseScale * (1 + wave * 0.025), baseScale * (1 - wave * 0.035));
      this.y = this.baseY + Math.sin(time / 210) * 6;
      this.angle = Math.sin(time / 280) * 2.2;
      this.shadow.setScale(0.75 + wave * 0.06, 0.72).setAlpha(0.1 + Math.max(0, wave) * 0.05);
      return;
    }
    const stretchX = 1 + wave * (moving ? 0.065 : 0.018);
    const squashY = 1 - wave * (moving ? 0.085 : 0.025);
    this.setScale(baseScale * stretchX, baseScale * squashY);
    this.y = this.baseY + (moving ? ripple * 3.5 + Math.max(0, wave) * 1.5 : Math.sin(time / 180) * 1.2);
    if (underground) {
      this.y += 20;
      this.setAlpha(0.58);
      this.setTint(0xbfa98c);
    } else if (this.alpha < 1 && this.stunRemaining <= 0) {
      this.setAlpha(1);
      this.clearTint();
    }
    this.angle = moving ? ripple * 2.4 : Math.sin(time / 220) * 0.8;
    this.shadow.setScale(1 + wave * 0.09, 1 - wave * 0.12).setAlpha(0.2 + (1 - squashY) * 0.7);
  }

  die(): void {
    if (this.state === 'dead') return;
    this.state = 'dead'; this.target = null; this.hpBar.clear();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, alpha: 0, angle: -80, y: this.y + 18, scale: 0.7, duration: 520, ease: 'Quad.easeIn', onComplete: () => this.destroy() });
  }

  private redrawHpBar(): void {
    this.hpBar.clear();
    if (this.hp >= this.maxHp || this.state === 'dead') return;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const w = this.config.boss ? 78 : 48;
    const y = this.y - (this.config.boss ? 62 : 49);
    this.hpBar.fillStyle(0x07101d, 0.85); this.hpBar.fillRoundedRect(this.x - w / 2 - 2, y - 2, w + 4, 8, 3);
    this.hpBar.fillStyle(this.config.boss ? 0xc451ff : 0xff5578, 1); this.hpBar.fillRoundedRect(this.x - w / 2, y, w * ratio, 4, 2);
  }

  destroy(fromScene?: boolean): void {
    this.hpBar?.destroy(); this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
