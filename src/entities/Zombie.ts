import Phaser from 'phaser';
import { HOUSE_LINE_X } from '../config/GameConfig';
import { ZOMBIES, type ZombieConfig, type ZombieType } from '../data/zombies';
import type { Plant } from './Plant';

export type ZombieState = 'walking' | 'eating' | 'dead';

export interface ZombieContext {
  /** 找到挡在前方啃食范围内的植物 */
  getBlockingPlant(row: number, zombieX: number): Plant | null;
  /** 越过房屋线时回调 */
  onReachHouse(zombie: Zombie): void;
}

export class Zombie extends Phaser.GameObjects.Sprite {
  readonly config: ZombieConfig;
  readonly row: number;
  hp: number;
  readonly maxHp: number;
  state: ZombieState = 'walking';

  private target: Plant | null = null;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  /** 突破房屋线只结算一次，避免重复判定 */
  private hasBreached = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: ZombieType, row: number) {
    const config = ZOMBIES[type];
    super(scene, x, y, config.texture);

    this.config = config;
    this.row = row;
    this.hp = config.hp;
    this.maxHp = config.hp;

    scene.add.existing(this);
    this.setDepth(20 + row * 0.1);

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(this.depth + 0.05);
    this.redrawHpBar();
  }

  update(_time: number, delta: number, ctx: ZombieContext): void {
    if (this.state === 'dead' || !this.active) return;

    const dt = delta / 1000;

    // 啃食状态：保持原地持续输出
    if (this.state === 'eating') {
      if (this.target && this.target.active && this.target.hp > 0) {
        this.target.takeDamage(this.config.attackDps * dt);
        return;
      }
      // 目标没了，恢复行走
      this.target = null;
      this.state = 'walking';
      return;
    }

    // 行走状态：先检查是否被植物挡住
    const blocker = ctx.getBlockingPlant(this.row, this.x);
    if (blocker) {
      this.target = blocker;
      this.state = 'eating';
      // 啃食时轻微上下晃动
      this.scene.tweens.add({
        targets: this,
        y: this.y - 3,
        duration: 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return;
    }

    this.x -= this.config.speed * dt;

    if (this.x <= HOUSE_LINE_X && !this.hasBreached) {
      this.hasBreached = true;
      ctx.onReachHouse(this);
    }

    // 越过房屋线后不再判定，但走出屏幕要回收，避免对象堆积
    if (this.x < -80) this.destroy();
  }

  takeDamage(amount: number): void {
    if (!this.active || this.state === 'dead') return;

    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    this.redrawHpBar();

    if (this.hp <= 0) this.die();
  }

  /** 触发死亡：播放倒地动画后销毁 */
  die(): void {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.target = null;
    this.hpBar.clear();

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: -90,
      y: this.y + 12,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  private redrawHpBar(): void {
    this.hpBar.clear();
    if (this.hp >= this.maxHp) return;

    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const w = 44;
    const h = 5;
    const x = this.x - w / 2;
    const y = this.y - 46;

    this.hpBar.fillStyle(0x000000, 0.55);
    this.hpBar.fillRect(x - 1, y - 1, w + 2, h + 2);
    this.hpBar.fillStyle(0xd32f2f, 1);
    this.hpBar.fillRect(x, y, w * ratio, h);
  }

  destroy(fromScene?: boolean): void {
    this.hpBar?.destroy();
    super.destroy(fromScene);
  }
}
