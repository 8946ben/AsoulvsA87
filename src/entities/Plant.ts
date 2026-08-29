import Phaser from 'phaser';
import { GRID } from '../config/GameConfig';
import { PLANTS, type PlantConfig, type PlantType } from '../data/plants';

/**
 * 植物与场景之间的交互契约。
 * 通过上下文回调注入，避免实体层反向依赖 GameScene。
 */
export interface PlantContext {
  /** 该行指定 x 右侧是否存在存活僵尸 */
  hasZombieInRow(row: number, fromX: number): boolean;
  /** 发射子弹 */
  spawnProjectile(x: number, y: number, texture: string, damage: number, row: number): void;
  /** 产出阳光 */
  spawnSun(x: number, y: number, amount: number): void;
}

export class Plant extends Phaser.GameObjects.Sprite {
  readonly config: PlantConfig;
  readonly row: number;
  readonly col: number;
  hp: number;
  readonly maxHp: number;

  private attackTimer = 0;
  private produceTimer = 0;
  private readonly hpBar: Phaser.GameObjects.Graphics;

  /**
   * 纹理原始尺寸 → 格子尺寸的适配系数。
   * 占位纹理本身就是 80×96（系数≈1），而 AI 生成的素材通常是 1024×1024，
   * 用 fit 方式统一计算，两种来源都不必改动逻辑。
   */
  private readonly baseScale: number;
  /** 适配后的实际显示尺寸，用于定位血条与子弹出发点 */
  private readonly dispW: number;
  private readonly dispH: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PlantType,
    row: number,
    col: number,
  ) {
    const config = PLANTS[type];
    super(scene, x, y, config.texture);

    const src = scene.textures.get(config.texture).getSourceImage() as HTMLImageElement;
    const srcW = src?.width || GRID.CELL_W;
    const srcH = src?.height || GRID.CELL_H;
    this.baseScale = Math.min(GRID.CELL_W / srcW, GRID.CELL_H / srcH);
    this.dispW = srcW * this.baseScale;
    this.dispH = srcH * this.baseScale;

    this.config = config;
    this.row = row;
    this.col = col;
    this.hp = config.hp;
    this.maxHp = config.hp;

    scene.add.existing(this);
    this.setDepth(10 + row * 0.1);

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(this.depth + 0.05);
    this.redrawHpBar();

    // 种下时的弹入动画
    this.setScale(this.baseScale * 0.5);
    scene.tweens.add({
      targets: this,
      scale: this.baseScale,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  update(_time: number, delta: number, ctx: PlantContext): void {
    switch (this.config.behavior) {
      case 'producer': {
        this.produceTimer += delta;
        if (this.produceTimer >= (this.config.produceInterval ?? Infinity)) {
          this.produceTimer = 0;
          ctx.spawnSun(this.x, this.y - 10, this.config.produceAmount ?? 25);
          this.scene.tweens.add({
            targets: this,
            scaleX: this.baseScale * 1.18,
            scaleY: this.baseScale * 1.18,
            duration: 160,
            yoyo: true,
            ease: 'Sine.easeInOut',
          });
        }
        break;
      }

      case 'shooter': {
        this.attackTimer += delta;
        if (this.attackTimer >= (this.config.attackInterval ?? Infinity)) {
          // 只在有目标时开火，并重置计时，避免「憋子弹」
          if (ctx.hasZombieInRow(this.row, this.x)) {
            this.attackTimer = 0;
            ctx.spawnProjectile(
              this.x + this.dispW * 0.325, // 占位图 80 → 26，从嘴部出发
              this.y - 8,
              this.config.projectile ?? 'pea',
              this.config.attackDamage ?? 20,
              this.row,
            );
            // 后坐力
            this.scene.tweens.add({
              targets: this,
              x: this.x - 4,
              duration: 60,
              yoyo: true,
              ease: 'Quad.easeOut',
            });
          } else {
            this.attackTimer = this.config.attackInterval ?? 0;
          }
        }
        break;
      }

      case 'wall':
      default:
        break;
    }
  }

  takeDamage(amount: number): void {
    if (!this.active) return;
    this.hp -= amount;
    // 僵尸是持续啃食（每帧触发），这里只掉血条，不做闪烁，否则会变成频闪
    this.redrawHpBar();
    if (this.hp <= 0) this.destroy();
  }

  private redrawHpBar(): void {
    this.hpBar.clear();
    if (this.hp >= this.maxHp) return;

    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const w = this.dispW * 0.575; // 占位图 80 → 46，与历史观感一致
    const h = 5;
    const x = this.x - w / 2;
    const y = this.y + this.dispH * 0.35; // 落在植物下缘附近

    this.hpBar.fillStyle(0x000000, 0.55);
    this.hpBar.fillRect(x - 1, y - 1, w + 2, h + 2);
    this.hpBar.fillStyle(ratio > 0.5 ? 0x4caf50 : ratio > 0.25 ? 0xffc107 : 0xf44336, 1);
    this.hpBar.fillRect(x, y, w * ratio, h);
  }

  destroy(fromScene?: boolean): void {
    this.scene?.tweens.killTweensOf(this);
    this.hpBar?.destroy();
    super.destroy(fromScene);
  }
}
