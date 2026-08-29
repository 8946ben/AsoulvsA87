import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID,
  LAWNMOWER_X,
  SUN_RULES,
  TEX,
  ZOMBIE_SPAWN_X,
} from '../config/GameConfig';
import { Grid } from '../core/Grid';
import { LEVEL_1, type LevelConfig } from '../data/levels';
import { PLANTS, STARTER_PLANT_ORDER, type PlantType } from '../data/plants';
import type { ZombieType } from '../data/zombies';
import { Plant, type PlantContext } from '../entities/Plant';
import { Projectile, type ProjectileContext } from '../entities/Projectile';
import { Sun } from '../entities/Sun';
import { Zombie, type ZombieContext } from '../entities/Zombie';
import { createSeedBankBackground, SeedBank } from '../ui/SeedBank';

/** 一条待执行的僵尸生成任务 */
interface SpawnTask {
  time: number;
  type: ZombieType;
  row: number;
}

const BAR_X = 620;
const BAR_Y = 26;
const BAR_W = 360;
const BAR_H = 14;

type GameState = 'playing' | 'win' | 'lose';

/** 主战斗场景：网格、阳光经济、波次调度、胜负判定都在这里编排 */
export class GameScene extends Phaser.Scene {
  static readonly KEY = 'GameScene';

  private level!: LevelConfig;

  private grid!: Grid;
  private seedBank!: SeedBank;

  private plants: Plant[] = [];
  private zombies: Zombie[] = [];
  private projectiles: Projectile[] = [];
  private suns: Sun[] = [];
  private mowers: (Phaser.GameObjects.Image | null)[] = [];

  private sunAmount = SUN_RULES.START_SUN;
  private sunText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private alertText!: Phaser.GameObjects.Text;
  private previewRect!: Phaser.GameObjects.Graphics;

  private elapsed = 0;
  private skySunTimer = 0;
  private spawnSchedule: SpawnTask[] = [];
  private spawnIndex = 0;
  private hugeWaveAlerts: number[] = [];
  private lastProgress = -1;
  private gameState: GameState = 'playing';

  private preview: Phaser.GameObjects.Sprite | null = null;
  private previewType: PlantType | null = null;

  /** 植物 → 场景 的交互实现 */
  private readonly plantCtx: PlantContext = {
    hasZombieInRow: (row, fromX) =>
      this.zombies.some(
        (z) => z.active && z.state !== 'dead' && z.row === row && z.x > fromX - 30,
      ),
    spawnProjectile: (x, y, texture, damage, row) => {
      this.projectiles.push(new Projectile(this, x, y, texture, damage, row));
    },
    spawnSun: (x, y, amount) => this.spawnPlantSun(x, y, amount),
  };

  /** 僵尸 → 场景 的交互实现 */
  private readonly zombieCtx: ZombieContext = {
    getBlockingPlant: (row, zombieX) => this.getBlockingPlant(row, zombieX),
    onReachHouse: (zombie) => this.onZombieReachHouse(zombie),
  };

  /** 子弹 → 场景 的交互实现 */
  private readonly projectileCtx: ProjectileContext = {
    findTarget: (row, x) => this.findZombieTarget(row, x),
  };

  constructor() {
    super(GameScene.KEY);
  }

  init(data: { level?: LevelConfig }): void {
    this.level = data?.level ?? LEVEL_1;
  }

  create(): void {
    this.resetState();

    this.createBackground();
    this.createLawn();
    this.createMowers();
    this.createUI();
    this.createSeedBank();
    this.buildSpawnSchedule();
    this.bindInput();
  }

  update(time: number, delta: number): void {
    if (this.gameState !== 'playing') return;

    this.elapsed += delta;
    this.updateWaves();
    this.updateSkySun(delta);

    for (const plant of this.plants) plant.update(time, delta, this.plantCtx);
    for (const zombie of this.zombies) zombie.update(time, delta, this.zombieCtx);
    for (const projectile of this.projectiles) {
      projectile.update(time, delta, this.projectileCtx);
    }
    for (const sun of this.suns) sun.update(time, delta);

    this.cleanup();
    this.seedBank.update(delta, this.sunAmount);
    this.updateProgressBar();
    this.checkWin();
  }

  // ------------------------------------------------------------------
  // 初始化
  // ------------------------------------------------------------------

  /** 场景 restart 时类字段不会自动重置，这里统一清空 */
  private resetState(): void {
    this.grid = new Grid();
    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.mowers = [];
    this.sunAmount = SUN_RULES.START_SUN;
    this.elapsed = 0;
    this.skySunTimer = 0;
    this.spawnSchedule = [];
    this.spawnIndex = 0;
    this.hugeWaveAlerts = [];
    this.lastProgress = -1;
    this.gameState = 'playing';
    this.preview = null;
    this.previewType = null;
  }

  private createBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x9fd8ef, 0x9fd8ef, 0xd7f0d5, 0xd7f0d5, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    sky.setDepth(-10);
  }

  private createLawn(): void {
    for (let row = 0; row < GRID.ROWS; row++) {
      for (let col = 0; col < GRID.COLS; col++) {
        const texture = (row + col) % 2 === 0 ? TEX.LAWN_LIGHT : TEX.LAWN_DARK;
        const { x, y } = this.grid.cellToWorld(row, col);
        this.add.image(x, y, texture).setDepth(0);
      }
    }
  }

  private createMowers(): void {
    for (let row = 0; row < GRID.ROWS; row++) {
      const mower = this.add.image(
        LAWNMOWER_X,
        this.grid.rowToY(row) + 26,
        TEX.LAWNMOWER,
      );
      mower.setDepth(5 + row * 0.1);
      this.mowers.push(mower);
    }
  }

  private createUI(): void {
    // 阳光计数器
    const panel = this.add.graphics();
    panel.fillStyle(0x3d2f1f, 0.95);
    panel.fillRoundedRect(8, 12, 94, 76, 6);
    panel.lineStyle(2, 0x8b6f47, 1);
    panel.strokeRoundedRect(8, 12, 94, 76, 6);
    panel.setDepth(90);

    this.add.image(55, 40, TEX.SUN).setDisplaySize(46, 46).setDepth(95);

    this.sunText = this.add
      .text(55, 76, String(this.sunAmount), {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFF8DC',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(95);

    // 关卡进度条
    this.add
      .text(BAR_X, BAR_Y - 18, '关卡进度', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#2b2b2b',
        fontStyle: 'bold',
      })
      .setDepth(95);

    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(95);

    // 大波提示
    this.alertText = this.add
      .text(GAME_WIDTH / 2, 220, '', {
        fontFamily: 'Arial',
        fontSize: '38px',
        color: '#ff3b3b',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(150)
      .setAlpha(0);

    this.previewRect = this.add.graphics();
    this.previewRect.setDepth(60);
  }

  private createSeedBank(): void {
    createSeedBankBackground(this);
    this.seedBank = new SeedBank(this, STARTER_PLANT_ORDER);
    // 开局给一点冷却，避免瞬间铺满场地
    this.seedBank.applyInitialCooldown(2500);
  }

  /** 把关卡的波次配置拍平成按时间排序的生成任务表 */
  private buildSpawnSchedule(): void {
    let cursor = 0;
    for (const wave of this.level.waves) {
      cursor += wave.delay;
      const waveStart = cursor;

      if (wave.isHuge) {
        this.hugeWaveAlerts.push(Math.max(0, waveStart - 3500));
      }

      for (const spawn of wave.spawns) {
        for (let i = 0; i < spawn.count; i++) {
          this.spawnSchedule.push({
            time: waveStart + i * spawn.gap,
            type: spawn.type,
            row: spawn.row ?? Phaser.Math.Between(0, GRID.ROWS - 1),
          });
        }
      }
    }
    this.spawnSchedule.sort((a, b) => a.time - b.time);
  }

  private bindInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) =>
      this.updatePreview(pointer),
    );
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.handlePointerDown(pointer),
    );
    this.input.keyboard?.on('keydown-ESC', () => {
      this.seedBank.clearSelection();
      this.preview?.setVisible(false);
      this.previewRect.clear();
    });
  }

  // ------------------------------------------------------------------
  // 每帧逻辑
  // ------------------------------------------------------------------

  private updateWaves(): void {
    while (this.hugeWaveAlerts.length > 0 && this.elapsed >= this.hugeWaveAlerts[0]) {
      this.hugeWaveAlerts.shift();
      this.showHugeWaveAlert();
    }

    while (
      this.spawnIndex < this.spawnSchedule.length &&
      this.elapsed >= this.spawnSchedule[this.spawnIndex].time
    ) {
      const task = this.spawnSchedule[this.spawnIndex++];
      this.spawnZombie(task.type, task.row);
    }
  }

  private updateSkySun(delta: number): void {
    this.skySunTimer += delta;
    if (this.skySunTimer < SUN_RULES.SKY_DROP_INTERVAL) return;

    this.skySunTimer = 0;
    const x = Phaser.Math.Between(SUN_RULES.DROP_MIN_X, SUN_RULES.DROP_MAX_X);
    const targetY = Phaser.Math.Between(SUN_RULES.DROP_MIN_Y, SUN_RULES.DROP_MAX_Y);
    const sun = new Sun(this, x, -30, SUN_RULES.SKY_DROP_AMOUNT, targetY, false);
    this.registerSun(sun);
  }

  private updateProgressBar(): void {
    const total = this.spawnSchedule.length || 1;
    const ratio = Phaser.Math.Clamp(this.spawnIndex / total, 0, 1);
    if (Math.abs(ratio - this.lastProgress) < 0.001) return;
    this.lastProgress = ratio;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x2b2b2b, 0.85);
    this.progressBar.fillRoundedRect(BAR_X, BAR_Y, BAR_W, BAR_H, 5);
    this.progressBar.fillStyle(0x8bc34a, 1);
    this.progressBar.fillRoundedRect(BAR_X, BAR_Y, Math.max(4, BAR_W * ratio), BAR_H, 5);
    this.progressBar.lineStyle(2, 0x5d4037, 1);
    this.progressBar.strokeRoundedRect(BAR_X, BAR_Y, BAR_W, BAR_H, 5);
  }

  /** 清理本帧内被销毁的实体，并同步网格占用状态 */
  private cleanup(): void {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const plant = this.plants[i];
      if (!plant.active) {
        if (this.grid.get(plant.row, plant.col) === plant) {
          this.grid.remove(plant.row, plant.col);
        }
        this.plants.splice(i, 1);
      }
    }
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      if (!this.zombies[i].active) this.zombies.splice(i, 1);
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].active) this.projectiles.splice(i, 1);
    }
    for (let i = this.suns.length - 1; i >= 0; i--) {
      if (!this.suns[i].active) this.suns.splice(i, 1);
    }
  }

  private checkWin(): void {
    if (this.gameState !== 'playing') return;

    const allSpawned = this.spawnIndex >= this.spawnSchedule.length;
    const cleared = this.zombies.every((z) => !z.active || z.state === 'dead');
    if (allSpawned && cleared) this.gameOver(true);
  }

  // ------------------------------------------------------------------
  // 实体操作
  // ------------------------------------------------------------------

  private spawnZombie(type: ZombieType, row: number): void {
    const zombie = new Zombie(this, ZOMBIE_SPAWN_X, this.grid.rowToY(row) - 4, type, row);
    this.zombies.push(zombie);
  }

  private spawnPlantSun(x: number, y: number, amount: number): void {
    const targetY = Math.min(y + 44, GAME_HEIGHT - 60);
    this.registerSun(new Sun(this, x, y, amount, targetY, true));
  }

  private registerSun(sun: Sun): void {
    sun.onCollect.on('collect', (value: number) => {
      this.sunAmount += value;
      this.sunText.setText(String(this.sunAmount));
      this.tweens.add({ targets: this.sunText, scale: 1.3, duration: 90, yoyo: true });
    });
    this.suns.push(sun);
  }

  /** 找到挡在僵尸啃食范围内的植物 */
  private getBlockingPlant(row: number, zombieX: number): Plant | null {
    for (let col = 0; col < GRID.COLS; col++) {
      const plant = this.grid.get(row, col);
      if (plant && plant.active && plant.x >= zombieX - 38 && plant.x <= zombieX + 10) {
        return plant;
      }
    }
    return null;
  }

  /** 子弹命中判定：取本行内最靠左的一只僵尸 */
  private findZombieTarget(row: number, x: number): Zombie | null {
    let best: Zombie | null = null;
    for (const zombie of this.zombies) {
      if (!zombie.active || zombie.state === 'dead' || zombie.row !== row) continue;
      if (x >= zombie.x - 22 && x <= zombie.x + 24) {
        if (!best || zombie.x < best.x) best = zombie;
      }
    }
    return best;
  }

  private onZombieReachHouse(zombie: Zombie): void {
    if (this.gameState !== 'playing') return;

    const row = zombie.row;
    const mower = this.mowers[row];

    if (mower) {
      // 该行小推车还在：推车出动碾掉整行，此后本行再无兜底
      this.mowers[row] = null;
      // 推车就位的瞬间先碾掉已越过防线的僵尸，
      // 否则同一行第二只僵尸会在推车撞到它之前抢先触发判负
      for (const other of this.zombies) {
        if (
          other.active &&
          other.state !== 'dead' &&
          other.row === row &&
          other.x <= LAWNMOWER_X + 60
        ) {
          other.die();
        }
      }
      this.runMower(row, mower);
    } else {
      // 推车已用掉，再次被突破即判负
      this.gameOver(false);
    }
  }

  /** 小推车向右冲刺，碾死整行僵尸 */
  private runMower(row: number, mower: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: mower,
      x: GAME_WIDTH + 80,
      duration: 2000,
      ease: 'Linear',
      onUpdate: () => {
        for (const zombie of this.zombies) {
          if (
            zombie.active &&
            zombie.state !== 'dead' &&
            zombie.row === row &&
            Math.abs(zombie.x - mower.x) < 48
          ) {
            zombie.die();
          }
        }
      },
      onComplete: () => mower.destroy(),
    });
  }

  private plantAt(row: number, col: number, type: PlantType): boolean {
    if (this.grid.isOccupied(row, col)) return false;

    const config = PLANTS[type];
    if (this.sunAmount < config.cost) return false;

    const { x, y } = this.grid.cellToWorld(row, col);
    const plant = new Plant(this, x, y - 6, type, row, col);
    this.grid.place(plant, row, col);
    this.plants.push(plant);

    this.sunAmount -= config.cost;
    this.sunText.setText(String(this.sunAmount));
    this.seedBank.consumeSelected();
    return true;
  }

  // ------------------------------------------------------------------
  // 交互
  // ------------------------------------------------------------------

  private updatePreview(pointer: Phaser.Input.Pointer): void {
    const type = this.seedBank.selectedType;

    if (!type) {
      this.preview?.setVisible(false);
      this.previewRect.clear();
      return;
    }

    const cell = this.grid.worldToCell(pointer.worldX, pointer.worldY);
    if (!cell) {
      this.preview?.setVisible(false);
      this.previewRect.clear();
      return;
    }

    if (!this.preview || this.previewType !== type) {
      this.preview?.destroy();
      this.preview = this.add.sprite(0, 0, PLANTS[type].texture).setAlpha(0.6).setDepth(50);
      this.previewType = type;
    }

    const { x, y } = this.grid.cellToWorld(cell.row, cell.col);
    this.preview.setPosition(x, y - 6).setVisible(true);

    const canPlant =
      !this.grid.isOccupied(cell.row, cell.col) && this.sunAmount >= PLANTS[type].cost;

    this.previewRect.clear();
    this.previewRect.lineStyle(3, canPlant ? 0x00e676 : 0xff5252, 0.9);
    this.previewRect.strokeRect(
      x - GRID.CELL_W / 2 + 2,
      y - GRID.CELL_H / 2 + 2,
      GRID.CELL_W - 4,
      GRID.CELL_H - 4,
    );
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameState !== 'playing') return;

    // 阳光优先响应
    for (const sun of this.suns) {
      if (sun.containsPoint(pointer.worldX, pointer.worldY)) {
        sun.collect();
        return;
      }
    }

    const type = this.seedBank.selectedType;
    if (!type) return;

    const cell = this.grid.worldToCell(pointer.worldX, pointer.worldY);
    if (!cell) return;

    if (this.plantAt(cell.row, cell.col, type)) {
      // 种植成功后卡片进入冷却并取消选中，这里同步清掉预览
      this.updatePreview(pointer);
      return;
    }

    // 失败反馈
    this.cameras.main.shake(120, 0.004);
  }

  // ------------------------------------------------------------------
  // 结算
  // ------------------------------------------------------------------

  private showHugeWaveAlert(): void {
    this.alertText.setText('一大波僵尸正在接近！');
    this.tweens.killTweensOf(this.alertText);
    this.alertText.setAlpha(0).setScale(0.6);
    this.tweens.add({
      targets: this.alertText,
      alpha: 1,
      scale: 1,
      duration: 380,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1500,
      onComplete: () => this.alertText.setAlpha(0),
    });
  }

  private gameOver(win: boolean): void {
    if (this.gameState !== 'playing') return;
    this.gameState = win ? 'win' : 'lose';

    this.seedBank.clearSelection();
    this.preview?.setVisible(false);
    this.previewRect.clear();

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setDepth(200);

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, win ? '防守成功！' : '僵尸吃掉了你的脑子…', {
        fontFamily: 'Arial',
        fontSize: '38px',
        color: win ? '#8bc34a' : '#ff5252',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(201);

    const button = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, '重新开始', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#6d4c41',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => this.scene.restart({ level: this.level }));

    this.tweens.add({
      targets: [overlay, title, button],
      alpha: { from: 0, to: 1 },
      duration: 380,
    });
  }
}
