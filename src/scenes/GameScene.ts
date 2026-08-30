import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRID, LAWNMOWER_X, SUN_RULES, TEX, ZOMBIE_SPAWN_X } from '../config/GameConfig';
import { Grid } from '../core/Grid';
import { isDeveloperMode } from '../core/DeveloperMode';
import { completeLevel } from '../core/LevelProgress';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { getNextLevel, LEVEL_1, type LevelConfig } from '../data/levels';
import { PLANTS, type PlantType } from '../data/plants';
import { ZOMBIES, type ZombieType } from '../data/zombies';
import { Plant, type PlantContext } from '../entities/Plant';
import { Projectile, type ProjectileContext, type ProjectileOptions } from '../entities/Projectile';
import { Sun } from '../entities/Sun';
import { Zombie, type ZombieContext } from '../entities/Zombie';
import { createSeedBankBackground, SeedBank } from '../ui/SeedBank';

interface SpawnTask { time: number; type: ZombieType; row: number; wave: number; }
interface WaveAlert { time: number; title: string; huge: boolean; wave: number; }
type GameState = 'playing' | 'win' | 'lose';

const BAR_X = 958;
const BAR_Y = 48;
const BAR_W = 292;
const BAR_H = 13;

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
  private sunAmount: number = SUN_RULES.START_SUN;
  private sunText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private enemyText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private alertText!: Phaser.GameObjects.Text;
  private previewRect!: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private skySunTimer = 0;
  private spawnSchedule: SpawnTask[] = [];
  private spawnIndex = 0;
  private alerts: WaveAlert[] = [];
  private lastProgress = -1;
  private gameState: GameState = 'playing';
  private preview: Phaser.GameObjects.Sprite | null = null;
  private previewType: PlantType | null = null;
  private currentWave = 0;
  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private shovelMode = false;
  private shovelButton!: Phaser.GameObjects.Text;

  private readonly plantCtx: PlantContext = {
    getNearestZombie: (row, fromX) => this.getNearestZombie(row, fromX),
    spawnProjectile: (x, y, texture, damage, row, options = {}) => this.spawnProjectile(x, y, texture, damage, row, options),
    spawnSun: (x, y, amount) => this.spawnPlantSun(x, y, amount),
    damageArea: (x, y, radius, damage, stunMs) => this.damageArea(x, y, radius, damage, stunMs),
    freezeAll: (durationMs) => this.freezeAll(durationMs),
    replacePlant: (plant, type) => this.replacePlant(plant, type),
  };
  private readonly zombieCtx: ZombieContext = {
    getBlockingPlant: (row, zombieX, leadX, direction) => this.getBlockingPlant(row, zombieX, leadX, direction),
    onReachHouse: (zombie) => this.onZombieReachHouse(zombie),
    spawnMinion: (type, row, x) => this.spawnZombie(type, row, x),
  };
  private readonly projectileCtx: ProjectileContext = {
    findTarget: (row, x, ignored) => this.findZombieTarget(row, x, ignored),
    damageSplash: (row, x, radius, damage, primary) => {
      for (const zombie of this.zombies) {
        if (zombie !== primary && zombie.active && zombie.state !== 'dead' && zombie.row === row && Math.abs(zombie.x - x) <= radius) zombie.takeDamage(damage);
      }
    },
  };

  constructor() { super(GameScene.KEY); }
  init(data: { level?: LevelConfig }): void { this.level = data?.level ?? LEVEL_1; }

  create(): void {
    this.resetState(); this.createBackground(); this.createLawn(); this.createMowers();
    this.createUI(); this.createSeedBank(); this.buildSpawnSchedule(); this.bindInput();
    this.showToast('选择角色卡，守住枝江舞台！', 0x67e8ff);
    sharpenSceneText(this);
  }

  update(time: number, delta: number): void {
    if (this.gameState !== 'playing' || this.isPaused) return;
    this.elapsed += delta; this.updateWaves(); this.updateSkySun(delta);
    for (const plant of this.plants) plant.update(time, delta, this.plantCtx);
    for (const zombie of this.zombies) zombie.update(time, delta, this.zombieCtx);
    for (const projectile of this.projectiles) projectile.update(time, delta, this.projectileCtx);
    for (const sun of this.suns) sun.update(time, delta);
    this.cleanup(); this.seedBank.update(delta, this.sunAmount); this.updateProgressBar(); this.checkWin();
  }

  private resetState(): void {
    this.grid = new Grid(); this.plants = []; this.zombies = []; this.projectiles = []; this.suns = []; this.mowers = [];
    this.sunAmount = this.level.startingSun ?? SUN_RULES.START_SUN; this.elapsed = 0; this.skySunTimer = 0; this.spawnSchedule = []; this.spawnIndex = 0;
    this.alerts = []; this.lastProgress = -1; this.gameState = 'playing'; this.preview = null; this.previewType = null; this.currentWave = 0; this.isPaused = false; this.shovelMode = false;
    this.time.paused = false;
  }

  private createBackground(): void {
    const bg = this.add.graphics().setDepth(-20);
    bg.fillGradientStyle(0x071225, 0x101c3d, 0x133c4c, 0x0b2536, 1); bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x4fe5ff, 0.06); bg.fillTriangle(80, 0, 340, GAME_HEIGHT, 520, GAME_HEIGHT);
    bg.fillStyle(0xff6ea9, 0.05); bg.fillTriangle(1180, 0, 760, GAME_HEIGHT, 1040, GAME_HEIGHT);
    for (let x = 22; x < GAME_WIDTH; x += 55) {
      bg.fillStyle(x % 110 ? 0x55d9ff : 0xff6fa8, 0.14); bg.fillCircle(x, 148 + (x % 4) * 5, 4);
    }
    bg.fillStyle(0x050b18, 0.62);
    for (let x = 0; x < GAME_WIDTH; x += 22) bg.fillCircle(x + 10, 158 + (x % 3) * 4, 15);
    bg.lineStyle(2, 0x67e7ff, 0.28); bg.strokeRoundedRect(GRID.OFFSET_X - 10, GRID.OFFSET_Y - 10, GRID.COLS * GRID.CELL_W + 20, GRID.ROWS * GRID.CELL_H + 20, 16);
    bg.fillStyle(0x020713, 0.4); bg.fillRoundedRect(GRID.OFFSET_X - 17, GRID.OFFSET_Y - 3, GRID.COLS * GRID.CELL_W + 34, GRID.ROWS * GRID.CELL_H + 18, 14);
    this.add.text(28, 166, 'STAGE\nDEFENSE', { fontFamily: 'Arial', fontSize: '22px', color: '#68e8ff', fontStyle: 'bold', align: 'center', lineSpacing: 4 }).setAlpha(0.72).setDepth(-5);
    this.add.text(1090, 177, 'A87\nENTRY', { fontFamily: 'Arial', fontSize: '18px', color: '#ff6f99', fontStyle: 'bold', align: 'center' }).setAlpha(0.62).setDepth(-5);
  }

  private createLawn(): void {
    for (let row = 0; row < GRID.ROWS; row++) {
      const lane = this.add.rectangle(GRID.OFFSET_X - 24, this.grid.rowToY(row), 30, GRID.CELL_H - 5, row % 2 ? 0x173b4a : 0x1e4855, 0.9).setDepth(0);
      lane.setStrokeStyle(1, 0x6fe7ff, 0.18);
      this.add.text(GRID.OFFSET_X - 24, this.grid.rowToY(row), String(row + 1).padStart(2, '0'), { fontFamily: 'Arial', fontSize: '12px', color: '#8eefff' }).setOrigin(0.5).setDepth(1).setAlpha(0.65);
      for (let col = 0; col < GRID.COLS; col++) {
        const texture = (row + col) % 2 === 0 ? TEX.LAWN_LIGHT : TEX.LAWN_DARK;
        const { x, y } = this.grid.cellToWorld(row, col);
        this.add.image(x, y, texture).setDepth(0).setAlpha(0.92);
      }
    }
  }

  private createMowers(): void {
    for (let row = 0; row < GRID.ROWS; row++) {
      const mower = this.add.image(LAWNMOWER_X, this.grid.rowToY(row) + 28, TEX.LAWNMOWER).setDepth(8 + row * 0.1);
      this.tweens.add({ targets: mower, x: mower.x + 3, duration: 850 + row * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.mowers.push(mower);
    }
  }

  private createUI(): void {
    const resource = this.add.graphics().setDepth(100);
    resource.fillStyle(0x101b2e, 0.97); resource.fillRoundedRect(854, 8, 88, 116, 14);
    resource.lineStyle(2, 0xffd86d, 0.45); resource.strokeRoundedRect(854, 8, 88, 116, 14);
    this.add.image(898, 45, TEX.SUN).setDisplaySize(48, 48).setDepth(104);
    this.add.text(898, 19, '应援值', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#ffe79b' }).setOrigin(0.5).setDepth(105);
    this.sunText = this.add.text(898, 94, String(this.sunAmount), { fontFamily: 'Arial', fontSize: '25px', color: '#fff4bf', fontStyle: 'bold' }).setOrigin(0.5).setDepth(105);

    const info = this.add.graphics().setDepth(100);
    info.fillStyle(0x101b2e, 0.97); info.fillRoundedRect(950, 8, 322, 116, 14);
    info.lineStyle(2, 0x67e8ff, 0.3); info.strokeRoundedRect(950, 8, 322, 116, 14);
    this.waveText = this.add.text(BAR_X, 18, 'WAVE 0 / ' + this.level.waves.length, { fontFamily: 'Arial', fontSize: '14px', color: '#84ecff', fontStyle: 'bold' }).setDepth(105);
    this.enemyText = this.add.text(1252, 18, '敌人 0', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#ff91af' }).setOrigin(1, 0).setDepth(105);
    this.progressBar = this.add.graphics().setDepth(105);
    this.add.text(BAR_X, 76, this.level.name, { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#effbff', fontStyle: 'bold' }).setDepth(105);
    this.add.text(BAR_X, 101, '空格 暂停  ·  ESC 取消', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#8fb5c9' }).setDepth(105);
    this.shovelButton = sharpenText(this.add.text(1220, 96, '铲子', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#dff8ff', backgroundColor: '#28445f',
      padding: { x: 13, y: 8 }, fontStyle: 'bold',
    })).setOrigin(0.5).setDepth(106).setInteractive({ useHandCursor: true });
    this.shovelButton.on('pointerover', () => this.shovelButton.setScale(1.04));
    this.shovelButton.on('pointerout', () => this.shovelButton.setScale(1));
    this.shovelButton.on('pointerdown', () => this.toggleShovelMode());

    this.alertText = this.add.text(GAME_WIDTH / 2, 295, '', { fontFamily: 'Microsoft YaHei', fontSize: '39px', color: '#ff678d', fontStyle: 'bold', stroke: '#091426', strokeThickness: 9, align: 'center' }).setOrigin(0.5).setDepth(170).setAlpha(0);
    this.previewRect = this.add.graphics().setDepth(62);

    const pauseShade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020713, 0.72).setOrigin(0).setInteractive();
    const pauseCard = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 540, 310, 0x101c31, 0.98).setStrokeStyle(3, 0x67e8ff, 0.7);
    const pauseTitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 105, '舞台暂时休息', { fontFamily: 'Microsoft YaHei', fontSize: '31px', color: '#f4fcff', fontStyle: 'bold' }).setOrigin(0.5);
    const pauseHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 57, '按空格键或点击按钮继续', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#73e8ff' }).setOrigin(0.5);
    const resumeButton = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2, '继续游戏', () => this.togglePause(), 211);
    const retryButton = this.makeButton(GAME_WIDTH / 2 - 112, GAME_HEIGHT / 2 + 76, '重新开始本关', () => this.restartCurrentLevel(), 211);
    const menuButton = this.makeButton(GAME_WIDTH / 2 + 112, GAME_HEIGHT / 2 + 76, '返回主页面', () => this.returnToMenu(), 211);
    this.pauseOverlay = this.add.container(0, 0, [pauseShade, pauseCard, pauseTitle, pauseHint, resumeButton, retryButton, menuButton]).setDepth(210).setVisible(false);
  }

  private createSeedBank(): void {
    createSeedBankBackground(this); this.seedBank = new SeedBank(this, this.level.availablePlants); this.seedBank.applyInitialCooldown(1700);
  }

  private buildSpawnSchedule(): void {
    let cursor = 0;
    this.level.waves.forEach((wave, waveIndex) => {
      cursor += wave.delay; const waveStart = cursor;
      this.alerts.push({ time: Math.max(0, waveStart - 2500), title: wave.title ?? `第 ${waveIndex + 1} 波`, huge: Boolean(wave.isHuge), wave: waveIndex + 1 });
      if (wave.isHuge) {
        this.spawnSchedule.push({ time: Math.max(0, waveStart - 650), type: 'flag', row: Phaser.Math.Between(0, GRID.ROWS - 1), wave: waveIndex + 1 });
      }
      for (const spawn of wave.spawns) {
        for (let i = 0; i < spawn.count; i++) this.spawnSchedule.push({ time: waveStart + i * spawn.gap, type: spawn.type, row: spawn.row ?? Phaser.Math.Between(0, GRID.ROWS - 1), wave: waveIndex + 1 });
      }
    });
    this.spawnSchedule.sort((a, b) => a.time - b.time);
  }

  private bindInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.handlePointerMove(pointer));
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointerDown(pointer));
    this.input.keyboard?.on('keydown-ESC', () => { this.seedBank.clearSelection(); this.setShovelMode(false); this.preview?.setVisible(false); this.previewRect.clear(); });
    this.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.repeat) return;
      this.togglePause();
    });
  }

  private togglePause(): void {
    if (this.gameState !== 'playing') return;
    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);
    if (this.isPaused) {
      this.seedBank.clearSelection();
      this.setShovelMode(false);
      this.preview?.setVisible(false);
      this.previewRect.clear();
      this.time.paused = true;
      this.tweens.pauseAll();
    } else {
      this.time.paused = false;
      this.tweens.resumeAll();
    }
  }

  private restartCurrentLevel(): void {
    this.time.paused = false; this.tweens.resumeAll();
    this.scene.restart({ level: this.level });
  }

  private returnToMenu(): void {
    this.time.paused = false; this.tweens.resumeAll();
    this.scene.start('MenuScene');
  }

  private toggleShovelMode(): void {
    if (this.gameState !== 'playing' || this.isPaused) return;
    this.setShovelMode(!this.shovelMode);
  }

  private setShovelMode(enabled: boolean): void {
    this.shovelMode = enabled;
    if (enabled) {
      this.seedBank.clearSelection();
      this.preview?.setVisible(false);
      this.showToast('铲子已拿起：点击要移除的角色', 0xffd46f);
    }
    this.previewRect?.clear();
    this.shovelButton?.setText(enabled ? '铲子 ✓' : '铲子').setBackgroundColor(enabled ? '#8a6120' : '#28445f').setColor(enabled ? '#fff0ae' : '#dff8ff');
  }

  private updateWaves(): void {
    while (this.alerts.length && this.elapsed >= this.alerts[0].time) {
      const alert = this.alerts.shift()!; this.currentWave = alert.wave; this.showWaveAlert(alert.title, alert.huge);
    }
    while (this.spawnIndex < this.spawnSchedule.length && this.elapsed >= this.spawnSchedule[this.spawnIndex].time) {
      const task = this.spawnSchedule[this.spawnIndex++]; this.currentWave = task.wave; this.spawnZombie(task.type, task.row);
    }
  }

  private updateSkySun(delta: number): void {
    this.skySunTimer += delta;
    if (this.skySunTimer < SUN_RULES.SKY_DROP_INTERVAL) return;
    this.skySunTimer = 0;
    const x = Phaser.Math.Between(SUN_RULES.DROP_MIN_X, SUN_RULES.DROP_MAX_X); const y = Phaser.Math.Between(SUN_RULES.DROP_MIN_Y, SUN_RULES.DROP_MAX_Y);
    this.registerSun(new Sun(this, x, -30, SUN_RULES.SKY_DROP_AMOUNT, y, false));
  }

  private updateProgressBar(): void {
    const ratio = Phaser.Math.Clamp(this.spawnIndex / Math.max(1, this.spawnSchedule.length), 0, 1);
    if (Math.abs(ratio - this.lastProgress) > 0.001) {
      this.lastProgress = ratio; this.progressBar.clear();
      this.progressBar.fillStyle(0x050b17, 0.9); this.progressBar.fillRoundedRect(BAR_X, BAR_Y, BAR_W, BAR_H, 6);
      this.progressBar.fillGradientStyle(0x50e3c2, 0x68e6ff, 0x50e3c2, 0x68e6ff, 1); this.progressBar.fillRoundedRect(BAR_X, BAR_Y, Math.max(5, BAR_W * ratio), BAR_H, 6);
      this.progressBar.lineStyle(1, 0x9cf4ff, 0.35); this.progressBar.strokeRoundedRect(BAR_X, BAR_Y, BAR_W, BAR_H, 6);
    }
    this.waveText.setText(`WAVE ${this.currentWave} / ${this.level.waves.length}`);
    this.enemyText.setText(`场上敌人 ${this.zombies.filter((z) => z.active && z.state !== 'dead').length}`);
  }

  private cleanup(): void {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i]; if (!p.active) { if (this.grid.get(p.row, p.col) === p) this.grid.remove(p.row, p.col); this.plants.splice(i, 1); }
    }
    for (let i = this.zombies.length - 1; i >= 0; i--) if (!this.zombies[i].active) this.zombies.splice(i, 1);
    for (let i = this.projectiles.length - 1; i >= 0; i--) if (!this.projectiles[i].active) this.projectiles.splice(i, 1);
    for (let i = this.suns.length - 1; i >= 0; i--) if (!this.suns[i].active) this.suns.splice(i, 1);
  }

  private checkWin(): void {
    if (this.gameState !== 'playing') return;
    if (this.spawnIndex >= this.spawnSchedule.length && this.zombies.every((z) => !z.active || z.state === 'dead')) this.gameOver(true);
  }

  private spawnZombie(type: ZombieType, row: number, x = ZOMBIE_SPAWN_X): void {
    const zombie = new Zombie(this, x, this.grid.rowToY(row) - 4, type, row); this.zombies.push(zombie);
    if (ZOMBIES[type].boss) this.showBossBanner(ZOMBIES[type]);
  }

  private spawnProjectile(x: number, y: number, texture: string, damage: number, row: number, options: ProjectileOptions): void {
    const target = options.lobbed ? this.getNearestZombie(row, x) : null;
    const trajectory = target ? { ...options, arcTargetX: target.x, arcTargetY: target.y - 10 } : options;
    this.projectiles.push(new Projectile(this, x, y, texture, damage, row, trajectory));
  }

  private spawnPlantSun(x: number, y: number, amount: number): void { this.registerSun(new Sun(this, x, y, amount, Math.min(y + 48, GAME_HEIGHT - 55), true)); }
  private registerSun(sun: Sun): void {
    sun.onCollect.on('collect', (value: number) => {
      this.sunAmount += value; this.sunText.setText(String(this.sunAmount));
      this.tweens.add({ targets: this.sunText, scale: 1.35, color: '#ffffff', duration: 100, yoyo: true });
    });
    this.suns.push(sun);
  }

  private getNearestZombie(row: number, fromX: number): Zombie | null {
    let best: Zombie | null = null;
    for (const z of this.zombies) if (z.targetable && z.active && z.state !== 'dead' && z.row === row && z.x > fromX - 25 && (!best || z.x < best.x)) best = z;
    return best;
  }
  private getBlockingPlant(row: number, zombieX: number, leadX: number, direction: -1 | 1): Plant | null {
    let best: Plant | null = null;
    for (let col = 0; col < GRID.COLS; col++) {
      const p = this.grid.get(row, col);
      if (!p?.active) continue;
      const zombieInsideCell = zombieX >= p.x - GRID.CELL_W / 2 && zombieX < p.x + GRID.CELL_W / 2;
      const touchingPlantFront = direction < 0
        ? p.x >= leadX - 43 && p.x <= leadX + 12
        : p.x <= leadX + 43 && p.x >= leadX - 12;
      const isCloser = !best || (direction < 0 ? p.x > best.x : p.x < best.x);
      if ((zombieInsideCell || touchingPlantFront) && isCloser) best = p;
    }
    return best;
  }
  private findZombieTarget(row: number, x: number, ignored = new Set<Zombie>()): Zombie | null {
    let best: Zombie | null = null;
    for (const z of this.zombies) if (z.targetable && !ignored.has(z) && z.active && z.state !== 'dead' && z.row === row && x >= z.x - 28 && x <= z.x + 30 && (!best || z.x < best.x)) best = z;
    return best;
  }

  private damageArea(x: number, y: number, radius: number, damage: number, stunMs = 0): void {
    for (const z of this.zombies) {
      if (!z.targetable || !z.active || z.state === 'dead') continue;
      if (Phaser.Math.Distance.Between(x, y, z.x, z.y) <= radius) { z.takeDamage(damage); if (stunMs) z.stunFor(stunMs); }
    }
    this.cameras.main.shake(180, 0.007);
  }

  private freezeAll(durationMs: number): void {
    let frozen = 0;
    for (const zombie of this.zombies) {
      if (!zombie.active || zombie.state === 'dead') continue;
      zombie.stunFor(durationMs); frozen++;
    }
    this.cameras.main.flash(260, 150, 225, 255, false);
    this.showToast(frozen > 0 ? `思诺冰冻了全场 ${frozen} 名敌人！` : '思诺的寒气笼罩了舞台', 0x8de8ff);
  }

  private replacePlant(plant: Plant, type: PlantType | null): void {
    const { row, col } = plant;
    const sourceName = plant.config.name;
    if (this.grid.get(row, col) === plant) this.grid.remove(row, col);
    plant.destroy();
    if (!type || this.grid.isOccupied(row, col)) return;
    const { x, y } = this.grid.cellToWorld(row, col); const next = new Plant(this, x, y - 5, type, row, col);
    this.grid.place(next, row, col); this.plants.push(next);
    this.showToast(`${sourceName}留下了${PLANTS[type].name}！`, PLANTS[type].accent);
  }

  private onZombieReachHouse(zombie: Zombie): void {
    if (this.gameState !== 'playing') return;
    const row = zombie.row; const mower = this.mowers[row];
    if (!mower) { this.gameOver(false); return; }
    this.mowers[row] = null; this.tweens.killTweensOf(mower);
    for (const z of this.zombies) if (z.active && z.state !== 'dead' && z.row === row && z.x <= LAWNMOWER_X + 65) z.die();
    this.tweens.add({ targets: mower, x: GAME_WIDTH + 100, angle: 720, duration: 1850, ease: 'Cubic.easeIn', onUpdate: () => {
      for (const z of this.zombies) if (z.active && z.state !== 'dead' && z.row === row && Math.abs(z.x - mower.x) < 55) z.die();
    }, onComplete: () => mower.destroy() });
  }

  private plantAt(row: number, col: number, type: PlantType): boolean {
    if (this.grid.isOccupied(row, col) || this.sunAmount < PLANTS[type].cost) return false;
    const { x, y } = this.grid.cellToWorld(row, col); const plant = new Plant(this, x, y - 5, type, row, col);
    this.grid.place(plant, row, col); this.plants.push(plant);
    this.sunAmount -= PLANTS[type].cost; this.sunText.setText(String(this.sunAmount)); this.seedBank.consumeSelected();
    return true;
  }

  private updatePreview(pointer: Phaser.Input.Pointer): void {
    if (this.shovelMode) {
      this.preview?.setVisible(false);
      const cell = this.grid.worldToCell(pointer.worldX, pointer.worldY);
      if (!cell) { this.previewRect.clear(); return; }
      const { x, y } = this.grid.cellToWorld(cell.row, cell.col);
      const hasPlant = Boolean(this.grid.get(cell.row, cell.col)?.active);
      this.previewRect.clear();
      this.previewRect.fillStyle(hasPlant ? 0xffd45f : 0xff667f, 0.14);
      this.previewRect.fillRoundedRect(x - GRID.CELL_W / 2 + 3, y - GRID.CELL_H / 2 + 3, GRID.CELL_W - 6, GRID.CELL_H - 6, 8);
      this.previewRect.lineStyle(3, hasPlant ? 0xffdc72 : 0xff667f, 0.95);
      this.previewRect.strokeRoundedRect(x - GRID.CELL_W / 2 + 3, y - GRID.CELL_H / 2 + 3, GRID.CELL_W - 6, GRID.CELL_H - 6, 8);
      return;
    }
    const type = this.seedBank.selectedType;
    if (!type) { this.preview?.setVisible(false); this.previewRect.clear(); return; }
    const cell = this.grid.worldToCell(pointer.worldX, pointer.worldY);
    if (!cell) { this.preview?.setVisible(false); this.previewRect.clear(); return; }
    if (!this.preview || this.previewType !== type) { this.preview?.destroy(); this.preview = this.add.sprite(0, 0, PLANTS[type].texture).setAlpha(0.58).setDepth(61); this.previewType = type; }
    const { x, y } = this.grid.cellToWorld(cell.row, cell.col); this.preview.setPosition(x, y - 5).setVisible(true);
    const canPlant = !this.grid.isOccupied(cell.row, cell.col) && this.sunAmount >= PLANTS[type].cost;
    this.previewRect.clear(); this.previewRect.fillStyle(canPlant ? 0x58f5b1 : 0xff5575, 0.12); this.previewRect.fillRoundedRect(x - GRID.CELL_W / 2 + 3, y - GRID.CELL_H / 2 + 3, GRID.CELL_W - 6, GRID.CELL_H - 6, 8);
    this.previewRect.lineStyle(3, canPlant ? 0x65efad : 0xff5b77, 0.9); this.previewRect.strokeRoundedRect(x - GRID.CELL_W / 2 + 3, y - GRID.CELL_H / 2 + 3, GRID.CELL_W - 6, GRID.CELL_H - 6, 8);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.gameState === 'playing' && !this.isPaused) {
      for (const sun of this.suns) {
        if (sun.containsPoint(pointer.worldX, pointer.worldY)) sun.collect();
      }
    }
    this.updatePreview(pointer);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameState !== 'playing' || this.isPaused) return;
    for (const sun of this.suns) if (sun.containsPoint(pointer.worldX, pointer.worldY)) { sun.collect(); return; }
    if (this.shovelMode) {
      const cell = this.grid.worldToCell(pointer.worldX, pointer.worldY);
      if (!cell) {
        if (this.seedBank.selectedType) this.setShovelMode(false);
        return;
      }
      const plant = this.grid.get(cell.row, cell.col);
      if (!plant?.active) { this.showToast('这个格子里没有可铲除的角色', 0xff738c); return; }
      const { x, y } = plant;
      this.grid.remove(cell.row, cell.col);
      plant.destroy();
      const ring = this.add.circle(x, y, 16, 0xffd36b, 0.38).setDepth(70);
      this.tweens.add({ targets: ring, scale: 3.5, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
      this.setShovelMode(false);
      this.showToast('角色已移除（不返还应援值）', 0xffd36b);
      return;
    }
    const type = this.seedBank.selectedType; if (!type) return;
    const cell = this.grid.worldToCell(pointer.worldX, pointer.worldY); if (!cell) return;
    if (this.plantAt(cell.row, cell.col, type)) { this.updatePreview(pointer); return; }
    this.cameras.main.shake(100, 0.0035); this.showToast('这里暂时无法部署', 0xff6585);
  }

  private showWaveAlert(title: string, huge: boolean): void {
    this.alertText.setText(`${huge ? '⚠ 大型波次' : '下一波'}\n${title}`);
    this.tweens.killTweensOf(this.alertText); this.alertText.setAlpha(0).setScale(0.6).setColor(huge ? '#ff5f83' : '#68e8ff');
    this.tweens.add({ targets: this.alertText, alpha: 1, scale: 1, duration: 360, ease: 'Back.easeOut', yoyo: true, hold: 1200, onComplete: () => this.alertText.setAlpha(0) });
  }

  private showBossBanner(config: (typeof ZOMBIES)[ZombieType]): void {
    const panel = this.add.rectangle(GAME_WIDTH / 2, 155, 680, 54, 0x170d27, 0.92).setDepth(165).setStrokeStyle(2, 0xd36aff, 0.75);
    const text = sharpenText(this.add.text(GAME_WIDTH / 2, 155, `BOSS · ${config.name}　「${config.quote}」`, { fontFamily: 'Microsoft YaHei', fontSize: '18px', color: '#f4d8ff', fontStyle: 'bold' })).setOrigin(0.5).setDepth(166);
    panel.setAlpha(0); text.setAlpha(0); this.tweens.add({ targets: [panel, text], alpha: 1, duration: 280, yoyo: true, hold: 1800, onComplete: () => { panel.destroy(); text.destroy(); } });
  }

  private showToast(message: string, color: number): void {
    const toast = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, message, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: Phaser.Display.Color.IntegerToColor(color).rgba, backgroundColor: '#081221dd', padding: { x: 16, y: 8 } })).setOrigin(0.5, 1).setDepth(190);
    this.tweens.add({ targets: toast, y: toast.y - 12, alpha: { from: 0, to: 1 }, duration: 220, yoyo: true, hold: 1100, onComplete: () => toast.destroy() });
  }

  private gameOver(win: boolean): void {
    if (this.gameState !== 'playing') return;
    const nextLevel = win ? getNextLevel(this.level) : null;
    if (win && !isDeveloperMode()) completeLevel(this.level.id);
    this.gameState = win ? 'win' : 'lose'; this.seedBank.clearSelection(); this.preview?.setVisible(false); this.previewRect.clear();
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030712, 0.84).setDepth(220).setAlpha(0);
    const card = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 620, 310, win ? 0x102f36 : 0x321327, 0.97).setDepth(221).setStrokeStyle(3, win ? 0x65efcf : 0xff648c, 0.8).setAlpha(0);
    const kicker = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 104, win ? 'STAGE SECURED' : 'STAGE LOST', { fontFamily: 'Arial', fontSize: '15px', color: win ? '#65efcf' : '#ff7598', fontStyle: 'bold', letterSpacing: 4 })).setOrigin(0.5).setDepth(222).setAlpha(0);
    const title = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 52, win ? '我们又守护了舞台！' : '哈哈哈，舞台是我们 A87 的了！', { fontFamily: 'Microsoft YaHei', fontSize: '31px', color: '#ffffff', fontStyle: 'bold', align: 'center' })).setOrigin(0.5).setDepth(222).setAlpha(0);
    const sub = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2, win ? this.level.reward : '重新集结应援，再夺回属于大家的舞台', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#a9c4d2' })).setOrigin(0.5).setDepth(222).setAlpha(0);
    const retry = this.makeButton(GAME_WIDTH / 2 - 88, GAME_HEIGHT / 2 + 80, '再次挑战', () => this.scene.restart({ level: this.level }), 223);
    const route = this.makeButton(
      GAME_WIDTH / 2 + 88,
      GAME_HEIGHT / 2 + 80,
      nextLevel ? '下一关' : '返回选关',
      () => nextLevel ? this.scene.start(GameScene.KEY, { level: nextLevel }) : this.scene.start('LevelSelectScene'),
      223,
    );
    retry.setAlpha(0); route.setAlpha(0);
    this.tweens.add({ targets: [overlay, card, kicker, title, sub, retry, route], alpha: 1, duration: 450, ease: 'Quad.easeOut' });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, depth: number): Phaser.GameObjects.Text {
    const button = sharpenText(this.add.text(x, y, label, { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#f5fcff', backgroundColor: '#28445f', padding: { x: 22, y: 12 } })).setOrigin(0.5).setDepth(depth).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor('#3c6687').setScale(1.04)); button.on('pointerout', () => button.setBackgroundColor('#28445f').setScale(1)); button.on('pointerdown', onClick); return button;
  }
}
