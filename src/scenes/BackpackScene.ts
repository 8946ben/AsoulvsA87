import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { ADVANCE_COST, advancePlant, getCollectedPlants, getCollectionRank, getStardust, isPlantCollected } from '../core/Collection';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { CODEX_PLANT_ORDER, PLANTS, type PlantType } from '../data/plants';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

/**
 * 明日方舟式的角色背包：左侧收录卡，右侧显示档案、角色立绘与进阶操作。
 * 有官方非 Q 版立绘的角色在详情区展示立绘，战斗中仍使用 Q 版模型。
 */
export class BackpackScene extends Phaser.Scene {
  static readonly KEY = 'BackpackScene';
  private selectedType: PlantType = 'beijixing';
  private listLayer!: Phaser.GameObjects.Container;
  private detailLayer!: Phaser.GameObjects.Container;
  private countText!: Phaser.GameObjects.Text;
  private stardustText!: Phaser.GameObjects.Text;

  constructor() { super(BackpackScene.KEY); }

  create(): void {
    createFreshBackdrop(this, 'paper');
    this.createHeader();
    this.add.rectangle(222, 404, 392, 548, FRESH.CREAM, 0.94).setStrokeStyle(2, FRESH.BLUE, 0.34);
    this.add.rectangle(847, 404, 813, 548, FRESH.PAPER, 0.96).setStrokeStyle(2, FRESH.MINT, 0.42);
    this.add.text(48, 140, '已收录档案', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(463, 140, '角色档案', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    this.listLayer = this.add.container(0, 0);
    this.detailLayer = this.add.container(0, 0);
    this.createBackButton();
    this.refresh();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
    sharpenSceneText(this);
  }

  private createHeader(): void {
    this.add.text(42, 28, '角色背包', { fontFamily: 'Microsoft YaHei', fontSize: '35px', color: '#42506d', fontStyle: 'bold' });
    this.add.text(43, 76, 'ZHIJIANG OPERATOR ARCHIVE', { fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2 });
    this.add.text(42, 110, '收录角色，查看档案，并使用星愿徽记完成进阶。战斗中始终展示对应的 Q 版模型。', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#60758a' });
    this.countText = this.add.text(GAME_WIDTH - 42, 39, '', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#52667d', fontStyle: 'bold' }).setOrigin(1, 0);
    this.stardustText = this.add.text(GAME_WIDTH - 42, 73, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#a66b25', fontStyle: 'bold' }).setOrigin(1, 0);
    const rule = this.add.graphics(); rule.lineStyle(2, FRESH.BLUE, 0.28); rule.beginPath(); rule.moveTo(34, 128); rule.lineTo(GAME_WIDTH - 34, 128); rule.strokePath();
  }

  private createBackButton(): void {
    const back = sharpenText(this.add.text(42, GAME_HEIGHT - 26, '← 返回主界面  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', backgroundColor: '#e6f5f4', padding: { x: 15, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d1eeee'));
    back.on('pointerout', () => back.setBackgroundColor('#e6f5f4'));
    back.on('pointerdown', () => this.scene.start('MenuScene'));
    this.add.text(GAME_WIDTH - 42, GAME_HEIGHT - 28, '主线通关收录角色 · 每次普通战役可获得星愿徽记', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a',
    }).setOrigin(1, 1);
  }

  private refresh(): void {
    const collected = getCollectedPlants();
    if (!isPlantCollected(this.selectedType)) this.selectedType = collected[0] ?? 'beijixing';
    this.countText.setText(`已收录 ${collected.length} / ${CODEX_PLANT_ORDER.length}`);
    this.stardustText.setText(`✦ 星愿徽记  ${getStardust()}`);
    this.renderList();
    this.renderDetail();
    sharpenSceneText(this);
  }

  private renderList(): void {
    this.listLayer.removeAll(true);
    const cardW = 164; const cardH = 58; const colX = [136, 308];
    CODEX_PLANT_ORDER.forEach((type, index) => {
      const config = PLANTS[type]; const col = index % 2; const row = Math.floor(index / 2);
      const x = colX[col]; const y = 199 + row * 68;
      const owned = isPlantCollected(type); const selected = type === this.selectedType;
      const fill = owned ? (selected ? 0xffeff5 : FRESH.PAPER) : 0xe9eeed;
      const card = this.add.rectangle(x, y, cardW, cardH, fill, owned ? 0.99 : 0.72)
        .setStrokeStyle(2, owned ? config.accent : 0xaebbb8, selected ? 0.95 : 0.3)
        .setInteractive({ useHandCursor: true });
      const icon = this.fitImage(this.add.image(x - 56, y, config.texture), 42, 43).setAlpha(owned ? 1 : 0.22);
      const name = this.add.text(x - 27, y - 14, owned ? config.name : '？？？', {
        fontFamily: 'Microsoft YaHei', fontSize: '12px', color: owned ? '#42506d' : '#879692', fontStyle: 'bold',
      });
      const rank = getCollectionRank(type);
      const state = this.add.text(x - 27, y + 8, owned ? `档案 · ${rank >= 2 ? 'Ⅱ 阶' : 'Ⅰ 阶'}` : '尚未收录', {
        fontFamily: 'Microsoft YaHei', fontSize: '10px', color: owned ? (rank >= 2 ? '#d7527c' : '#348c72') : '#9ba8a6',
      });
      card.on('pointerover', () => card.setStrokeStyle(2, owned ? config.accent : 0xaebbb8, 0.86));
      card.on('pointerout', () => card.setStrokeStyle(2, owned ? config.accent : 0xaebbb8, selected ? 0.95 : 0.3));
      card.on('pointerdown', () => { this.selectedType = type; this.refresh(); });
      this.listLayer.add([card, icon, name, state]);
    });
  }

  private renderDetail(): void {
    this.detailLayer.removeAll(true);
    const type = this.selectedType;
    const config = PLANTS[type];
    const owned = isPlantCollected(type);
    const rank = getCollectionRank(type);
    const accentText = Phaser.Display.Color.IntegerToColor(config.accent).rgba;

    // 详情区立绘：有非 Q 版动漫立绘的角色展示立绘卡片，其余维持战场 Q 版模型。
    const hasPortrait = !!config.portrait && this.textures.exists(config.portrait);
    if (hasPortrait) {
      // 卡片按立绘宽高比自适应，四周留 14px 白边，整体限制在详情区左栏内。
      const source = this.textures.get(config.portrait!).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const scale = Math.min(280 / source.width, 448 / source.height);
      const cardW = Math.min(source.width * scale + 28, 308);
      const cardH = Math.min(source.height * scale + 28, 476);
      const backing = this.add.graphics();
      backing.fillStyle(0xfffffb, 0.97);
      backing.fillRoundedRect(630 - cardW / 2, 396 - cardH / 2, cardW, cardH, 14);
      backing.lineStyle(2, owned ? config.accent : 0xaebbb8, owned ? 0.45 : 0.3);
      backing.strokeRoundedRect(630 - cardW / 2, 396 - cardH / 2, cardW, cardH, 14);
      const portrait = this.add.image(630, 396, config.portrait!).setScale(scale).setAlpha(owned ? 1 : 0.2);
      this.detailLayer.add([backing, portrait]);
    } else {
      const portraitHalo = this.add.ellipse(630, 392, 316, 420, owned ? config.accent : 0xaebbb8, owned ? 0.13 : 0.08).setStrokeStyle(2, owned ? config.accent : 0xaebbb8, 0.36);
      const portrait = this.fitImage(this.add.image(630, 390, config.texture), 280, 350).setAlpha(owned ? 1 : 0.2);
      this.detailLayer.add([portraitHalo, portrait]);
    }
    const modelTag = this.add.text(630, 650, hasPortrait ? '角色立绘 · 非 Q 版' : '战场模型 · Q版', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#52667d', backgroundColor: '#e8f5f2', padding: { x: 12, y: 6 }, fontStyle: 'bold',
    }).setOrigin(0.5);

    const index = CODEX_PLANT_ORDER.indexOf(type) + 1;
    const code = this.add.text(852, 166, `NO. ${String(index).padStart(2, '0')}`, { fontFamily: 'Arial', fontSize: '12px', color: '#71809a', fontStyle: 'bold' });
    const title = this.add.text(852, 190, owned ? config.name : '未收录角色', { fontFamily: 'Microsoft YaHei', fontSize: '30px', color: owned ? '#42506d' : '#82918e', fontStyle: 'bold' });
    const role = this.add.text(854, 240, owned ? config.role : this.unlockHint(type), { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: owned ? accentText : '#82918e', fontStyle: 'bold' });
    const line = this.add.graphics(); line.lineStyle(2, owned ? config.accent : 0xaebbb8, 0.38); line.beginPath(); line.moveTo(852, 266); line.lineTo(1236, 266); line.strokePath();
    const description = this.add.text(852, 286, owned ? config.desc : '完成主线篇章或解锁对应融合科技后，即可将该角色收录至背包。', {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#5e6f84', wordWrap: { width: 384, useAdvancedWrap: true }, lineSpacing: 5,
    });
    const quote = this.add.text(852, 354, owned && config.quote ? `“${config.quote}”` : '', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#8190a0', fontStyle: 'italic', wordWrap: { width: 384, useAdvancedWrap: true },
    });
    const stats = this.add.text(852, 412, owned ? `生命  ${config.hp}     部署应援  ${config.cost || '融合'}     冷却  ${config.cooldown ? `${(config.cooldown / 1000).toFixed(1)} 秒` : '即时'}` : '档案数据将在收录后开放', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: owned ? '#a66b25' : '#8b9997', fontStyle: 'bold',
    });
    const progressTitle = this.add.text(852, 458, '进阶档案', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#42506d', fontStyle: 'bold' });
    const progress = this.add.text(852, 488, owned
      ? (rank >= 2 ? 'Ⅱ 阶已解锁 · 战斗将以高阶角色部署，启用现有联动与分支效果。' : 'Ⅰ 阶档案 · 使用星愿徽记进阶至Ⅱ阶，解锁高阶战斗规则。')
      : '尚未收录，无法进阶。', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: owned ? '#52667d' : '#8b9997', wordWrap: { width: 384, useAdvancedWrap: true }, lineSpacing: 3,
    });
    const advance = this.add.text(1124, 640, !owned ? '尚未收录' : rank >= 2 ? 'Ⅱ 阶已完成' : `进阶至Ⅱ阶  ·  ${ADVANCE_COST} ✦`, {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: !owned ? '#aab8b2' : rank >= 2 ? '#58bd92' : '#e85f91', padding: { x: 21, y: 11 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: owned && rank < 2 });
    if (owned && rank < 2) {
      advance.on('pointerover', () => advance.setScale(1.035));
      advance.on('pointerout', () => advance.setScale(1));
      advance.on('pointerdown', () => this.tryAdvance(type));
    }
    this.detailLayer.add([modelTag, code, title, role, line, description, quote, stats, progressTitle, progress, advance]);
  }

  private tryAdvance(type: PlantType): void {
    const result = advancePlant(type);
    if (!result.ok && result.reason === 'insufficient-stardust') {
      this.cameras.main.shake(100, 0.004);
      this.stardustText.setColor('#d7527c').setText(`星愿徽记不足 · 还需 ${ADVANCE_COST - result.stardust}`);
      this.time.delayedCall(1150, () => this.refresh());
      return;
    }
    if (result.ok) this.cameras.main.flash(150, 255, 214, 232, false);
    this.refresh();
  }

  private unlockHint(type: PlantType): string {
    return type === 'xingkongtang' || type === 'xilanai' || type === 'jiaxinnaitang' || type === 'yigehun'
      ? '解锁对应融合科技后收录'
      : '推进主线以收录角色';
  }

  private fitImage(image: Phaser.GameObjects.Image, maxW: number, maxH: number): Phaser.GameObjects.Image {
    const source = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    return image.setScale(Math.min(maxW / source.width, maxH / source.height));
  }
}
