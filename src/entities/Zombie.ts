import Phaser from 'phaser';
import { GAME_WIDTH, GRID, HOUSE_LINE_X, TEX } from '../config/GameConfig';
import { ZOMBIES, type ZombieConfig, type ZombieType } from '../data/zombies';
import type { Plant } from './Plant';

export type ZombieState = 'walking' | 'eating' | 'dead';
export interface ZombieContext {
  getBlockingPlant(row: number, zombieX: number, leadX: number, direction: -1 | 1, includeSpikeForm: boolean): Plant | null;
  onReachHouse(zombie: Zombie): void;
  spawnMinion(type: ZombieType, row: number, x: number): void;
  damagePlantsInRow(row: number, fromX: number, damage: number): void;
  damagePlantsAround(x: number, y: number, radius: number, damage: number): void;
}

export class Zombie extends Phaser.GameObjects.Sprite {
  readonly config: ZombieConfig;
  /** 化龙会换道、珈乐会游走，行号可变。 */
  row: number;
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
  private soulDebuffRemaining = 0;
  private soulDebuffStacks = 0;
  private summonTimer = 0;
  private laneTimer = 0;
  private spellTimer = 0;
  private roamTarget: { x: number; y: number } | null = null;
  private roamPause = 0;
  private baseY: number;
  private crawlPhase: number;
  private biteTimer = 0;
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
    this.shadow.setPosition(this.x + this.displayWidth * 0.08, (this.config.roaming ? this.y + 4 : this.baseY) + shadowOffset);
    this.redrawHpBar();

    if (this.soulDebuffRemaining > 0) {
      this.soulDebuffRemaining -= delta;
      if (this.soulDebuffRemaining <= 0) this.soulDebuffStacks = 0;
    }

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
        ctx.spawnMinion(this.config.summonType ?? 'knight', this.row, this.x + 36);
        this.scene.cameras.main.flash(180, 112, 35, 140, false);
      }
    }

    if (this.config.laneChangeInterval) {
      this.laneTimer += delta;
      if (this.laneTimer >= this.config.laneChangeInterval) {
        this.laneTimer = 0;
        this.changeLane(ctx);
      }
    }

    if (this.config.roaming) {
      this.updateRoaming(delta, ctx);
      return;
    }

    const dt = delta / 1000;
    if (this.state === 'eating') {
      // 乃琳在被接敌后会下沉成地刺；已经锁定她的普通敌人也必须立刻解除啃食。
      if (this.target?.isSpikeForm && !this.config.crushPlants) {
        this.target = null; this.biteTimer = 0; this.state = 'walking'; this.setScale(this.config.scale ?? 1);
      }
      if (this.target?.active && this.target.hp > 0) {
        if (this.target.isSpecialWall) {
          this.biteTimer += delta;
          if (this.biteTimer >= 1000) {
            this.biteTimer -= 1000;
            this.target.takeSpecialHit(this.config.attackDps * Math.pow(0.7, this.soulDebuffStacks));
          }
          return;
        }
        this.biteTimer = 0;
        this.target.takeDamage(this.config.attackDps * Math.pow(0.7, this.soulDebuffStacks) * dt);
        return;
      }
      this.target = null; this.biteTimer = 0; this.state = 'walking'; this.setScale(this.config.scale ?? 1);
    }

    if (this.vaulting) return;
    // 素材头部位于画面左侧，用头部前缘而非图片中心做接敌判定。
    const leadX = this.x + this.direction * this.displayWidth * 0.31;
    const underground = Boolean(this.config.tunneling && !this.surfaced);
    const blocker = (this.config.flying || underground) ? null : ctx.getBlockingPlant(this.row, this.x, leadX, this.direction, Boolean(this.config.crushPlants));
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
      this.target = blocker; this.biteTimer = 0; this.state = 'eating';
      return;
    }

    const rageModifier = this.accessoryBroken ? (this.config.enragedSpeedMultiplier ?? 1) : 1;
    const postVaultModifier = this.hasVaulted ? (this.config.postVaultSpeedMultiplier ?? 1) : 1;
    const soulSpeedModifier = Math.pow(0.5, this.soulDebuffStacks);
    const modifier = (this.charging ? 1.45 : 1) * rageModifier * postVaultModifier * (this.slowRemaining > 0 ? 0.48 : 1) * soulSpeedModifier;
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
  applySoulDebuff(ms: number, maxStacks = 3): void {
    this.soulDebuffStacks = Math.min(maxStacks, this.soulDebuffStacks + 1);
    this.soulDebuffRemaining = ms;
  }

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
    if (this.config.roaming) {
      // 游走 Boss 的位置由游走逻辑控制，这里只做呼吸式浮动。
      this.setScale(baseScale * (1 + wave * 0.02), baseScale * (1 - wave * 0.03));
      this.angle = Math.sin(time / 300) * 1.6;
      if (this.alpha < 1 && this.stunRemaining <= 0) { this.setAlpha(1); this.clearTint(); }
      this.shadow.setScale(1 + wave * 0.05, 1 - wave * 0.06).setAlpha(0.22);
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

  /** 化龙【不走寻常路】：先向当前行前方发射穿透射线，再随机换到另一行。 */
  private changeLane(ctx: ZombieContext): void {
    ctx.damagePlantsInRow(this.row, this.x, 100);
    const rows: number[] = [];
    for (let r = 0; r < GRID.ROWS; r++) if (r !== this.row) rows.push(r);
    this.row = rows[Phaser.Math.Between(0, rows.length - 1)];
    this.baseY = GRID.OFFSET_Y + this.row * GRID.CELL_H + GRID.CELL_H / 2 - 4;
    this.setDepth(24 + this.row * 0.1);
    this.shadow.setDepth(15 + this.row * 0.1);
    this.hpBar.setDepth(this.depth + 0.1);
  }

  /** 黑化珈乐：不进防御点，在场地右侧游走；停驻片刻后召唤 3 名黑化的骑士冲锋。 */
  private updateRoaming(delta: number, ctx: ZombieContext): void {
    this.spellTimer += delta;
    if (this.spellTimer >= 5000) {
      this.spellTimer = 0;
      ctx.damagePlantsAround(this.x, this.y, 195, 200);
    }
    if (this.roamPause > 0) {
      this.roamPause -= delta;
      if (this.roamPause <= 0) {
        for (let r = this.row - 1; r <= this.row + 1; r++) {
          if (r >= 0 && r < GRID.ROWS) ctx.spawnMinion('knight', r, this.x + 30);
        }
        this.scene.cameras.main.flash(180, 112, 35, 140, false);
        this.roamTarget = null;
      }
      return;
    }
    if (!this.roamTarget) {
      const row = Phaser.Math.Between(0, GRID.ROWS - 1);
      this.roamTarget = {
        x: Phaser.Math.Between(GRID.OFFSET_X + GRID.CELL_W * 4, GAME_WIDTH - 90),
        y: GRID.OFFSET_Y + row * GRID.CELL_H + GRID.CELL_H / 2 - 4,
      };
    }
    const dt = delta / 1000;
    const dx = this.roamTarget.x - this.x;
    const dy = this.roamTarget.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) { this.roamPause = 1600; return; }
    // 游走时使用 8 倍基础移速（5.5 是设计文档中接近防线的速度，游走需要更快的巡航）。
    const step = this.config.speed * 8 * dt * (this.slowRemaining > 0 ? 0.48 : 1) * Math.pow(0.5, this.soulDebuffStacks);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    const row = Phaser.Math.Clamp(Math.floor((this.y + 4 - GRID.OFFSET_Y) / GRID.CELL_H), 0, GRID.ROWS - 1);
    if (row !== this.row) {
      this.row = row;
      this.setDepth(24 + row * 0.1);
      this.shadow.setDepth(15 + row * 0.1);
      this.hpBar.setDepth(this.depth + 0.1);
    }
    this.setFlipX(dx > 0);
  }

  die(): void {
    if (this.state === 'dead') return;
    this.state = 'dead'; this.target = null; this.hpBar.clear();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, alpha: 0, angle: -80, y: this.y + 18, scale: 0.7, duration: 520, ease: 'Quad.easeIn', onComplete: () => this.destroy() });
  }

  private redrawHpBar(): void {
    this.hpBar.clear();
    if (this.state === 'dead') return;
    const w = this.config.boss ? 78 : 48;
    const y = this.y - (this.config.boss ? 62 : 49);
    if (this.hp < this.maxHp) {
      const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
      this.hpBar.fillStyle(0x07101d, 0.85); this.hpBar.fillRoundedRect(this.x - w / 2 - 2, y - 2, w + 4, 8, 3);
      this.hpBar.fillStyle(this.config.boss ? 0xc451ff : 0xff5578, 1); this.hpBar.fillRoundedRect(this.x - w / 2, y, w * ratio, 4, 2);
    }
    if (this.soulDebuffStacks > 0) {
      for (let i = 0; i < 3; i++) {
        this.hpBar.fillStyle(i < this.soulDebuffStacks ? 0xb594ff : 0x322a4a, i < this.soulDebuffStacks ? 1 : 0.65);
        this.hpBar.fillCircle(this.x - 10 + i * 10, y - 8, 3.2);
      }
    }
  }

  destroy(fromScene?: boolean): void {
    this.hpBar?.destroy(); this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
