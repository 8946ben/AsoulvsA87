import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { LEVEL_1, type LevelConfig } from '../data/levels';
import { PLANTS, type PlantType } from '../data/plants';
import { ZOMBIES } from '../data/zombies';
import { GameScene } from './GameScene';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';
import { CAMPAIGN_BATTLE, getUnitRank, type BattleSession } from '../core/BattleSession';

const MAX_LOADOUT = 8;

/** 仿 PVZ 的战前选卡：只允许从本关已解锁角色中组成出战阵容。 */
export class LoadoutScene extends Phaser.Scene {
  static readonly KEY = 'LoadoutScene';
  private level!: LevelConfig;
  private selected: PlantType[] = [];
  private selectedLayer!: Phaser.GameObjects.Container;
  private cardLayer!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;
  private battleSession: BattleSession = CAMPAIGN_BATTLE;

  constructor() { super(LoadoutScene.KEY); }

  init(data: { level?: LevelConfig; battleSession?: BattleSession }): void {
    this.level = data?.level ?? LEVEL_1;
    this.battleSession = data?.battleSession ?? CAMPAIGN_BATTLE;
    this.selected = [];
  }

  create(): void {
    this.createBackground(); this.createHeader(); this.createPanels(); this.createControls(); this.refresh();
    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.input.keyboard?.on('keydown-ENTER', () => this.startBattle());
    sharpenSceneText(this);
  }

  private createBackground(): void {
    createFreshBackdrop(this, 'garden');
  }

  private createHeader(): void {
    this.add.text(42, 24, '选择出战阵容', { fontFamily: 'Microsoft YaHei', fontSize: '32px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(43, 67, `${this.level.name}  ·  从已解锁角色中选择至多 ${MAX_LOADOUT} 张`, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#3c8ea8' });
    this.add.text(GAME_WIDTH - 42, 24, '本关来袭', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#e85f91', fontStyle: 'bold' }).setOrigin(1, 0);
    const enemyStart = GAME_WIDTH - 54 - (this.level.featuredEnemies.length - 1) * 42;
    this.level.featuredEnemies.forEach((type, index) => {
      const icon = this.add.image(enemyStart + index * 42, 70, ZOMBIES[type].texture);
      const source = icon.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      icon.setScale(Math.min(37 / source.width, 37 / source.height));
    });
  }

  private createPanels(): void {
    this.add.rectangle(GAME_WIDTH / 2, 171, 1000, 126, FRESH.CREAM, 0.94).setStrokeStyle(2, FRESH.BLUE, 0.42).setDepth(1);
    this.add.text(150, 106, '已选择', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#52667d', fontStyle: 'bold' }).setDepth(2);
    this.selectedLayer = this.add.container(0, 0).setDepth(2);
    this.add.rectangle(GAME_WIDTH / 2, 453, 1210, 316, FRESH.PAPER, 0.88).setStrokeStyle(2, FRESH.MINT, 0.32).setDepth(1);
    this.add.text(48, 285, '本关可选角色', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', fontStyle: 'bold' }).setDepth(2);
    this.cardLayer = this.add.container(0, 0).setDepth(2);
  }

  private createControls(): void {
    this.makeButton(105, 675, this.battleSession.mode === 'rogue' ? '← 返回路线' : '← 返回选关', () => this.goBack(), '#62cae8').setFontSize(14);
    this.statusText = this.add.text(GAME_WIDTH / 2, 617, '', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#52667d' }).setOrigin(0.5);
    this.startButton = this.makeButton(GAME_WIDTH / 2, 667, '开始演出  ENTER', () => this.startBattle(), '#e85f91');
    this.makeButton(1035, 667, '清空', () => { this.selected = []; this.refresh(); }, '#a997e8').setFontSize(14);
    this.makeButton(1165, 667, '推荐阵容', () => { this.selected = this.level.availablePlants.slice(0, MAX_LOADOUT); this.refresh(); }, '#58bd92').setFontSize(14);
  }

  private refresh(): void {
    this.renderSelected(); this.renderAvailable();
    const ready = this.selected.length > 0;
    this.statusText.setText(ready ? `已选择 ${this.selected.length} / ${MAX_LOADOUT} 张 · 点击已选卡可撤下` : '至少选择 1 张角色卡后才能开始');
    this.statusText.setColor(ready ? '#348c72' : '#d7527c');
    this.startButton.setBackgroundColor(ready ? '#e85f91' : '#aab8b2').setAlpha(ready ? 1 : 0.7);
    sharpenSceneText(this);
  }

  private renderSelected(): void {
    this.selectedLayer.removeAll(true);
    const slotW = 104; const gap = 8;
    const startX = (GAME_WIDTH - (slotW * MAX_LOADOUT + gap * (MAX_LOADOUT - 1))) / 2 + slotW / 2;
    for (let index = 0; index < MAX_LOADOUT; index++) {
      const x = startX + index * (slotW + gap); const y = 174; const type = this.selected[index];
      const slot = this.add.rectangle(x, y, slotW, 100, type ? 0xfff4f7 : 0xf1f7f3, 0.98).setStrokeStyle(2, type ? PLANTS[type].accent : 0xaac7bd, type ? 0.62 : 0.4);
      this.selectedLayer.add(slot);
      if (!type) {
        this.selectedLayer.add(this.add.text(x, y, String(index + 1), { fontFamily: 'Arial', fontSize: '16px', color: '#91a49d' }).setOrigin(0.5));
        continue;
      }
      const config = PLANTS[type];
      const icon = this.fitImage(this.add.image(x, y - 11, config.texture), 62, 66);
      const name = this.add.text(x, y + 37, config.name, { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#42506d', fontStyle: 'bold' }).setOrigin(0.5);
      slot.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.selected.splice(index, 1); this.refresh(); });
      this.selectedLayer.add([icon, name]);
    }
  }

  private renderAvailable(): void {
    this.cardLayer.removeAll(true);
    const cardW = 224; const cardH = 126; const gapX = 17; const gapY = 17; const cols = 5;
    const totalW = cols * cardW + (cols - 1) * gapX; const startX = (GAME_WIDTH - totalW) / 2;
    this.level.availablePlants.forEach((type, index) => {
      const config = PLANTS[type]; const selectedIndex = this.selected.indexOf(type);
      const col = index % cols; const row = Math.floor(index / cols);
      const x = startX + col * (cardW + gapX) + cardW / 2; const y = 316 + row * (cardH + gapY) + cardH / 2;
      const bg = this.add.rectangle(x, y, cardW, cardH, selectedIndex >= 0 ? 0xfff0f5 : FRESH.PAPER, 0.96)
        .setStrokeStyle(2, config.accent, selectedIndex >= 0 ? 0.9 : 0.32).setInteractive({ useHandCursor: true });
      const icon = this.fitImage(this.add.image(x - 72, y, config.texture), 68, 82);
      const name = this.add.text(x - 25, y - 42, config.name, { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#42506d', fontStyle: 'bold' });
      const unitRank = getUnitRank(this.battleSession, type);
      const rank = this.add.text(x + 96, y - 47, unitRank >= 2 ? 'Ⅱ' : 'Ⅰ', { fontFamily: 'Arial', fontSize: '11px', color: '#ffffff', backgroundColor: unitRank >= 2 ? '#e85f91' : '#58bd92', padding: { x: 6, y: 4 }, fontStyle: 'bold' }).setOrigin(1, 0);
      const role = this.add.text(x - 25, y - 14, config.role, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(config.accent).rgba });
      const stats = this.add.text(x - 25, y + 10, `应援 ${config.cost} · 生命 ${config.hp}`, { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: '#a66b25' });
      const hint = this.add.text(x - 25, y + 34, selectedIndex >= 0 ? `已选择 · 第 ${selectedIndex + 1} 位` : '点击加入阵容', { fontFamily: 'Microsoft YaHei', fontSize: '10px', color: selectedIndex >= 0 ? '#348c72' : '#71809a', fontStyle: 'bold' });
      bg.on('pointerover', () => bg.setFillStyle(0xeaf8f3, 1).setStrokeStyle(2, config.accent, 0.86));
      bg.on('pointerout', () => bg.setFillStyle(selectedIndex >= 0 ? 0xfff0f5 : FRESH.PAPER, 0.96).setStrokeStyle(2, config.accent, selectedIndex >= 0 ? 0.9 : 0.32));
      bg.on('pointerdown', () => this.toggleCard(type));
      this.cardLayer.add([bg, icon, name, rank, role, stats, hint]);
    });
  }

  private toggleCard(type: PlantType): void {
    const index = this.selected.indexOf(type);
    if (index >= 0) this.selected.splice(index, 1);
    else if (this.selected.length < MAX_LOADOUT) this.selected.push(type);
    else {
      this.statusText.setText(`最多携带 ${MAX_LOADOUT} 张角色卡，请先撤下一张`).setColor('#d7527c');
      this.tweens.add({ targets: this.statusText, x: { from: -5, to: 5 }, duration: 45, yoyo: true, repeat: 3, onComplete: () => this.statusText.setX(GAME_WIDTH / 2) });
      return;
    }
    this.refresh();
  }

  private startBattle(): void {
    if (this.selected.length === 0) return;
    this.scene.start(GameScene.KEY, { level: this.level, selectedPlants: [...this.selected], battleSession: this.battleSession });
  }

  private goBack(): void { this.scene.start(this.battleSession.mode === 'rogue' ? 'RogueMapScene' : 'LevelSelectScene'); }

  private fitImage(image: Phaser.GameObjects.Image, maxW: number, maxH: number): Phaser.GameObjects.Image {
    const source = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    return image.setScale(Math.min(maxW / source.width, maxH / source.height));
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, color: string): Phaser.GameObjects.Text {
    const button = sharpenText(this.add.text(x, y, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#f4fcff', backgroundColor: color,
      padding: { x: 20, y: 11 }, fontStyle: 'bold',
    })).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    button.on('pointerover', () => button.setScale(1.035)); button.on('pointerout', () => button.setScale(1)); button.on('pointerdown', onClick);
    return button;
  }
}
