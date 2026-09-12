import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { ADVANCE_COST, advancePlant, getCollectedPlants, getCollectionRank, getStardust, isAdvanceable, isPlantCollected, revertPlant } from '../core/Collection';
import { equipRelic, getEquippedRelic, getOwnedRelics, getRelicHolder, isRelicOwned, unequipRelic } from '../core/Relics';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { describeRelicEffects, RARITY_COLOR, RARITY_LABEL, RELICS, RELIC_ORDER, type RelicId } from '../data/relics';
import { CODEX_PLANT_ORDER, PLANTS, type PlantType } from '../data/plants';
import { RelicDrawScene } from './RelicDrawScene';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';

type BackpackTab = 'characters' | 'relics';

/**
 * 明日方舟式的角色背包：分「角色 / 藏品」两个页签。
 * 角色页左侧收录卡、右侧档案立绘与进阶操作；藏品页展示抽卡获得的枝江藏品，
 * 点击角色名完成装配，装配后战斗中获得对应数值加成。
 */
export class BackpackScene extends Phaser.Scene {
  static readonly KEY = 'BackpackScene';
  private activeTab: BackpackTab = 'characters';
  private selectedType: PlantType = 'beijixing';
  private selectedRelic: RelicId = RELIC_ORDER[0];
  private listLayer!: Phaser.GameObjects.Container;
  private detailLayer!: Phaser.GameObjects.Container;
  private countText!: Phaser.GameObjects.Text;
  private stardustText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private listLabel!: Phaser.GameObjects.Text;
  private detailLabel!: Phaser.GameObjects.Text;
  private characterTab!: Phaser.GameObjects.Text;
  private relicTab!: Phaser.GameObjects.Text;

  constructor() { super(BackpackScene.KEY); }

  init(data: { tab?: BackpackTab }): void {
    this.activeTab = data?.tab === 'relics' ? 'relics' : 'characters';
  }

  create(): void {
    createFreshBackdrop(this, 'paper');
    this.createHeader();
    this.add.rectangle(222, 404, 392, 548, FRESH.CREAM, 0.94).setStrokeStyle(2, FRESH.BLUE, 0.34);
    this.add.rectangle(847, 404, 813, 548, FRESH.PAPER, 0.96).setStrokeStyle(2, FRESH.MINT, 0.42);
    this.listLabel = this.add.text(48, 140, '已收录档案', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    this.detailLabel = this.add.text(463, 140, '角色档案', { fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#42506d', fontStyle: 'bold' });
    this.listLayer = this.add.container(0, 0);
    this.detailLayer = this.add.container(0, 0);
    this.createBackButton();
    this.refresh();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.repeat) return;
      this.switchTab(this.activeTab === 'characters' ? 'relics' : 'characters');
    });
    sharpenSceneText(this);
  }

  private createHeader(): void {
    this.add.text(42, 28, '角色背包', { fontFamily: 'Microsoft YaHei', fontSize: '35px', color: '#42506d', fontStyle: 'bold' });
    this.subtitleText = this.add.text(43, 76, 'ZHIJIANG OPERATOR ARCHIVE', { fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2 });
    this.add.text(42, 110, '收录角色，采购枝江藏品并为角色装配，使用星愿徽记完成进阶。战斗中始终展示对应的 Q 版模型。', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#60758a' });
    this.countText = this.add.text(GAME_WIDTH - 42, 39, '', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#52667d', fontStyle: 'bold' }).setOrigin(1, 0);
    this.stardustText = this.add.text(GAME_WIDTH - 42, 73, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#a66b25', fontStyle: 'bold' }).setOrigin(1, 0);
    const rule = this.add.graphics(); rule.lineStyle(2, FRESH.BLUE, 0.28); rule.beginPath(); rule.moveTo(34, 128); rule.lineTo(GAME_WIDTH - 34, 128); rule.strokePath();
    this.characterTab = this.createTabButton(268, 47, '角色档案', () => this.switchTab('characters'));
    this.relicTab = this.createTabButton(430, 47, '枝江藏品', () => this.switchTab('relics'));
    this.add.text(542, 54, 'TAB 切换', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a' });
  }

  private createTabButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#52667d',
      backgroundColor: '#edf7f4', padding: { x: 20, y: 10 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor('#dff1ed'));
    button.on('pointerout', () => this.refreshTabs());
    button.on('pointerdown', onClick);
    return button;
  }

  private switchTab(tab: BackpackTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.refresh();
  }

  private createBackButton(): void {
    const back = sharpenText(this.add.text(42, GAME_HEIGHT - 26, '← 返回主界面  ESC', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', backgroundColor: '#e6f5f4', padding: { x: 15, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d1eeee'));
    back.on('pointerout', () => back.setBackgroundColor('#e6f5f4'));
    back.on('pointerdown', () => this.scene.start('MenuScene'));
    this.add.text(GAME_WIDTH - 42, GAME_HEIGHT - 28, '战役结算获得星愿徽记用于进阶 · 藏品经答题与抽卡转盘获得', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a',
    }).setOrigin(1, 1);
  }

  private refresh(): void {
    this.refreshTabs();
    if (this.activeTab === 'characters') {
      const collected = getCollectedPlants();
      if (!isPlantCollected(this.selectedType)) this.selectedType = collected[0] ?? 'beijixing';
      this.subtitleText.setText('ZHIJIANG OPERATOR ARCHIVE');
      this.listLabel.setText('已收录档案');
      this.detailLabel.setText('角色档案');
      this.countText.setText(`已收录 ${collected.length} / ${CODEX_PLANT_ORDER.length}`);
      this.renderCharacterList();
      this.renderCharacterDetail();
    } else {
      if (!(this.selectedRelic in RELICS)) this.selectedRelic = RELIC_ORDER[0];
      this.subtitleText.setText('ZHIJIANG RELIC ARCHIVE');
      this.listLabel.setText('藏品陈列');
      this.detailLabel.setText('藏品详情');
      const ownedCount = getOwnedRelics().length;
      this.countText.setText(`已入库 ${ownedCount} / ${RELIC_ORDER.length}`);
      this.renderRelicList();
      this.renderRelicDetail();
    }
    const stardust = getStardust();
    this.stardustText.setText(`✦ 星愿徽记  ${Number.isFinite(stardust) ? stardust : '∞'}`);
    sharpenSceneText(this);
  }

  private refreshTabs(): void {
    this.characterTab?.setColor(this.activeTab === 'characters' ? '#ffffff' : '#52667d')
      .setBackgroundColor(this.activeTab === 'characters' ? '#4eb3cf' : '#edf7f4');
    this.relicTab?.setColor(this.activeTab === 'relics' ? '#ffffff' : '#52667d')
      .setBackgroundColor(this.activeTab === 'relics' ? '#e85f91' : '#edf7f4');
  }

  // ── 角色页 ────────────────────────────────────────────────

  private renderCharacterList(): void {
    this.listLayer.removeAll(true);
    const cardW = 164; const cardH = 58; const colX = [136, 308];
    CODEX_PLANT_ORDER.forEach((type, index) => {
      const config = PLANTS[type]; const col = index % 2; const row = Math.floor(index / 2);
      const x = colX[col]; const y = 199 + row * 68;
      const owned = isPlantCollected(type); const selected = type === this.selectedType;
      if (!owned) {
        // 未收录：槽位空置，仅保留素色卡片占位。
        const slot = this.add.rectangle(x, y, cardW, cardH, 0xe9eeed, 0.72).setStrokeStyle(2, 0xaebbb8, 0.3);
        this.listLayer.add(slot);
        return;
      }
      const fill = selected ? 0xffeff5 : FRESH.PAPER;
      const card = this.add.rectangle(x, y, cardW, cardH, fill, 0.99)
        .setStrokeStyle(2, config.accent, selected ? 0.95 : 0.3)
        .setInteractive({ useHandCursor: true });
      const icon = this.fitImage(this.add.image(x - 56, y, config.texture), 42, 43);
      const rank = getCollectionRank(type);
      const name = this.add.text(x - 27, y - 14, config.name, {
        fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#42506d', fontStyle: 'bold',
      });
      const state = this.add.text(x - 27, y + 8, `档案 · ${rank >= 2 ? 'Ⅱ 阶' : 'Ⅰ 阶'}`, {
        fontFamily: 'Microsoft YaHei', fontSize: '10px', color: rank >= 2 ? '#d7527c' : '#348c72',
      });
      card.on('pointerover', () => card.setStrokeStyle(2, config.accent, 0.86));
      card.on('pointerout', () => card.setStrokeStyle(2, config.accent, selected ? 0.95 : 0.3));
      card.on('pointerdown', () => { this.selectedType = type; this.refresh(); });
      this.listLayer.add([card, icon, name, state]);
    });
  }

  private renderCharacterDetail(): void {
    this.detailLayer.removeAll(true);
    const type = this.selectedType;
    const config = PLANTS[type];
    const owned = isPlantCollected(type);
    const rank = getCollectionRank(type);
    const accentText = Phaser.Display.Color.IntegerToColor(config.accent).rgba;

    // 详情区：Ⅱ 阶优先显示专属进阶立绘；Ⅰ 阶保留原有立绘或战场 Q 版模型。
    const portraitTexture = rank >= 2 && config.advancedPortrait && this.textures.exists(config.advancedPortrait)
      ? config.advancedPortrait
      : config.portrait && this.textures.exists(config.portrait)
        ? config.portrait
        : undefined;
    const hasPortrait = !!portraitTexture;
    if (hasPortrait) {
      // 卡片按立绘宽高比自适应，四周留 14px 白边，整体限制在详情区左栏内。
      const source = this.textures.get(portraitTexture!).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const scale = Math.min(280 / source.width, 448 / source.height);
      const cardW = Math.min(source.width * scale + 28, 308);
      const cardH = Math.min(source.height * scale + 28, 476);
      const backing = this.add.graphics();
      backing.fillStyle(0xfffffb, 0.97);
      backing.fillRoundedRect(630 - cardW / 2, 396 - cardH / 2, cardW, cardH, 14);
      backing.lineStyle(2, owned ? config.accent : 0xaebbb8, owned ? 0.45 : 0.3);
      backing.strokeRoundedRect(630 - cardW / 2, 396 - cardH / 2, cardW, cardH, 14);
      const portrait = this.add.image(630, 396, portraitTexture!).setScale(scale).setAlpha(owned ? 1 : 0.2);
      this.detailLayer.add([backing, portrait]);
    } else {
      const portraitHalo = this.add.ellipse(630, 392, 316, 420, owned ? config.accent : 0xaebbb8, owned ? 0.13 : 0.08).setStrokeStyle(2, owned ? config.accent : 0xaebbb8, 0.36);
      const portrait = this.fitImage(this.add.image(630, 390, config.texture), 280, 350).setAlpha(owned ? 1 : 0.2);
      this.detailLayer.add([portraitHalo, portrait]);
    }
    const modelTag = this.add.text(630, 650, rank >= 2 && portraitTexture === config.advancedPortrait ? 'Ⅱ 阶进阶立绘' : hasPortrait ? '角色立绘 · 非 Q 版' : '战场模型 · Q版', {
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
    const advanceable = owned && isAdvanceable(type);
    const progressTitle = this.add.text(852, 458, owned ? (advanceable ? '进阶档案' : '角色特性') : '进阶档案', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#42506d', fontStyle: 'bold' });
    const traitTexts: Phaser.GameObjects.Text[] = [];
    if (owned) {
      const stage1 = this.add.text(852, 488, `Ⅰ 阶 · ${(config.stageTraits ?? []).join('；')}`, {
        fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#52667d', wordWrap: { width: 384, useAdvancedWrap: true }, lineSpacing: 4,
      });
      traitTexts.push(stage1);
      if (advanceable) {
        const reached = rank >= 2;
        traitTexts.push(this.add.text(852, 488 + stage1.height + 8, `Ⅱ 阶 · ${(config.advanceTraits ?? []).join('；')}${reached ? '' : '（进阶解锁）'}`, {
          fontFamily: 'Microsoft YaHei', fontSize: '12px', color: reached ? accentText : '#9aa8a4', wordWrap: { width: 384, useAdvancedWrap: true }, lineSpacing: 4, fontStyle: reached ? 'bold' : undefined,
        }));
      }
    } else {
      traitTexts.push(this.add.text(852, 488, '尚未收录，无法进阶。', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#8b9997' }));
    }

    // 装配藏品：只读展示，装配与采购在「枝江藏品」页完成。
    const equippedRelic = owned ? getEquippedRelic(type) : null;
    const relicLabel = this.add.text(852, 604, '装配藏品', { fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#71809a', fontStyle: 'bold' });
    const relicValue = this.add.text(852, 624, owned
      ? (equippedRelic ? `${equippedRelic.glyph} ${equippedRelic.name}` : '未装配 · 前往「枝江藏品」页装配')
      : '收录后可装配藏品', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: equippedRelic ? '#52667d' : '#9aa8a4',
      wordWrap: { width: 180, useAdvancedWrap: true },
    });

    let advance: Phaser.GameObjects.Text | null = null;
    if (!owned) {
      advance = this.add.text(1124, 640, '尚未收录', {
        fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: '#aab8b2', padding: { x: 21, y: 11 }, fontStyle: 'bold',
      }).setOrigin(0.5);
    } else if (advanceable) {
      if (rank >= 2) {
        advance = this.add.text(1124, 640, '切换至 Ⅰ 阶', {
          fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: '#58bd92', padding: { x: 21, y: 11 }, fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        advance.on('pointerover', () => advance!.setScale(1.035));
        advance.on('pointerout', () => advance!.setScale(1));
        advance.on('pointerdown', () => { revertPlant(type); this.refresh(); });
      } else {
        advance = this.add.text(1124, 640, `进阶至Ⅱ阶  ·  ${ADVANCE_COST} ✦`, {
          fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: '#e85f91', padding: { x: 21, y: 11 }, fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        advance.on('pointerover', () => advance!.setScale(1.035));
        advance.on('pointerout', () => advance!.setScale(1));
        advance.on('pointerdown', () => this.tryAdvance(type));
      }
    }
    const details: Phaser.GameObjects.GameObject[] = [modelTag, code, title, role, line, description, quote, stats, progressTitle, ...traitTexts, relicLabel, relicValue];
    if (advance) details.push(advance);
    this.detailLayer.add(details);
  }

  // ── 藏品页 ────────────────────────────────────────────────

  private renderRelicList(): void {
    this.listLayer.removeAll(true);
    const cardW = 164; const cardH = 58; const colX = [136, 308];
    RELIC_ORDER.forEach((id, index) => {
      const relic = RELICS[id]; const col = index % 2; const row = Math.floor(index / 2);
      const x = colX[col]; const y = 199 + row * 68;
      const owned = isRelicOwned(id); const selected = id === this.selectedRelic;
      const holder = getRelicHolder(id);
      if (!owned && !selected) {
        const slot = this.add.rectangle(x, y, cardW, cardH, 0xe9eeed, 0.72).setStrokeStyle(2, 0xaebbb8, 0.3);
        this.listLayer.add(slot);
        return;
      }
      const accent = RARITY_COLOR[relic.rarity];
      const fill = selected ? 0xffeff5 : FRESH.PAPER;
      const card = this.add.rectangle(x, y, cardW, cardH, fill, owned ? 0.99 : 0.86)
        .setStrokeStyle(2, owned ? accent : 0xaebbb8, selected ? 0.95 : 0.3)
        .setInteractive({ useHandCursor: true });
      const glyph = this.add.text(x - 56, y, relic.glyph, { fontSize: '22px' }).setOrigin(0.5).setAlpha(owned ? 1 : 0.3);
      const name = this.add.text(x - 27, y - 14, relic.name, {
        fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#42506d', fontStyle: 'bold',
      });
      const state = this.add.text(x - 27, y + 8, !owned ? '？？？' : holder ? `装配 · ${PLANTS[holder].name}` : '待装配', {
        fontFamily: 'Microsoft YaHei', fontSize: '10px', color: !owned ? '#9aa8a4' : holder ? '#d7527c' : '#348c72',
      });
      card.on('pointerover', () => card.setStrokeStyle(2, owned ? accent : 0xaebbb8, 0.86));
      card.on('pointerout', () => card.setStrokeStyle(2, owned ? accent : 0xaebbb8, selected ? 0.95 : 0.3));
      card.on('pointerdown', () => { this.selectedRelic = id; this.refresh(); });
      this.listLayer.add([card, glyph, name, state]);
    });
  }

  private renderRelicDetail(): void {
    this.detailLayer.removeAll(true);
    const relic = RELICS[this.selectedRelic];
    const owned = isRelicOwned(relic.id);
    const holder = getRelicHolder(relic.id);
    const accent = RARITY_COLOR[relic.rarity];
    const accentText = Phaser.Display.Color.IntegerToColor(accent).rgba;

    // 左栏：藏品图示卡（emoji 字形放大展示，稀有度描边）。
    const backing = this.add.graphics();
    backing.fillStyle(0xfffffb, 0.97);
    backing.fillRoundedRect(630 - 122, 372 - 122, 244, 244, 18);
    backing.lineStyle(2, owned ? accent : 0xaebbb8, owned ? 0.55 : 0.3);
    backing.strokeRoundedRect(630 - 122, 372 - 122, 244, 244, 18);
    const glyph = this.add.text(630, 366, relic.glyph, { fontSize: '100px' }).setOrigin(0.5).setAlpha(owned ? 1 : 0.35);
    const rarityTag = this.add.text(630, 524, `${RARITY_LABEL[relic.rarity]}藏品`, {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: owned ? '#ffffff' : '#f5f2ea', backgroundColor: accentText, padding: { x: 14, y: 7 }, fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(owned ? 1 : 0.45);
    const holderText = this.add.text(630, 566, !owned ? '？？？' : holder ? `当前持有 · ${PLANTS[holder].name}` : '尚未装配给任何角色', {
      fontFamily: 'Microsoft YaHei', fontSize: '12px', color: holder ? '#d7527c' : '#71809a', fontStyle: 'bold',
    }).setOrigin(0.5);
    const quote = this.add.text(630, 612, owned ? `“${relic.quote}”` : '“？？？”', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#8190a0', fontStyle: 'italic', align: 'center', wordWrap: { width: 300, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);

    // 右栏：档案与操作。
    const index = RELIC_ORDER.indexOf(relic.id) + 1;
    const code = this.add.text(852, 166, `NO. ${String(index).padStart(2, '0')}`, { fontFamily: 'Arial', fontSize: '12px', color: '#71809a', fontStyle: 'bold' });
    const title = this.add.text(852, 190, relic.name, { fontFamily: 'Microsoft YaHei', fontSize: '30px', color: '#42506d', fontStyle: 'bold' });
    const meta = this.add.text(854, 240, owned ? `${RARITY_LABEL[relic.rarity]} · 已入库` : `${RARITY_LABEL[relic.rarity]} · ？？？`, {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: owned ? '#348c72' : '#a66b25', fontStyle: 'bold',
    });
    const line = this.add.graphics(); line.lineStyle(2, accent, 0.38); line.beginPath(); line.moveTo(852, 266); line.lineTo(1236, 266); line.strokePath();

    const effectTitle = this.add.text(852, 286, '藏品效果', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#42506d', fontStyle: 'bold' });
    const effectLines = describeRelicEffects(relic.effects).map((text, i) => this.add.text(852, 316 + i * 24, `· ${text}`, {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#52667d',
    }));
    effectLines.forEach((line) => line.setAlpha(owned ? 1 : 0.3));
    const effectBottom = 316 + effectLines.length * 24;

    const allowTitle = this.add.text(852, effectBottom + 14, '可装配角色', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#42506d', fontStyle: 'bold' });
    const chips = this.createRelicChips(relic.id, effectBottom + 44);
    chips.forEach((chip) => chip.setAlpha(owned ? 1 : 0.3));
    const holderHint = this.add.text(852, 624, !owned ? '？？？' : holder ? '再次点击持有者的名字可卸下藏品' : '点击角色名即完成装配', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#8b9997', wordWrap: { width: 180, useAdvancedWrap: true },
    });

    let action: Phaser.GameObjects.Text;
    if (!owned) {
      action = this.add.text(1124, 640, '前往抽卡转盘 →', {
        fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: '#e85f91', padding: { x: 21, y: 11 }, fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      action.on('pointerover', () => action.setScale(1.035));
      action.on('pointerout', () => action.setScale(1));
      action.on('pointerdown', () => this.scene.start(RelicDrawScene.KEY));
    } else {
      action = this.add.text(1124, 640, holder ? '已装配' : '已入库', {
        fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ffffff', backgroundColor: '#aab8b2', padding: { x: 21, y: 11 }, fontStyle: 'bold',
      }).setOrigin(0.5);
    }
    this.detailLayer.add([backing, glyph, rarityTag, holderText, quote, code, title, meta, line, effectTitle, ...effectLines, allowTitle, ...chips, holderHint, action]);
  }

  /** 可装配角色名单：点击装配/卸下；未收录角色置灰。全体型藏品按收录名单展开。 */
  private createRelicChips(relicId: RelicId, startY: number): Phaser.GameObjects.Text[] {
    const relic = RELICS[relicId];
    const owned = isRelicOwned(relicId);
    const holder = getRelicHolder(relicId);
    const candidates = relic.allowedTypes ?? CODEX_PLANT_ORDER.filter((type) => type !== 'special_beijixing');
    if (relic.allowedTypes === null) {
      const allTag = this.add.text(852, startY, '全体已收录角色', {
        fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#71809a', fontStyle: 'bold',
      });
      return [allTag, ...this.layoutChips(relicId, candidates, startY + 26, owned, holder)];
    }
    return this.layoutChips(relicId, relic.allowedTypes, startY, owned, holder);
  }

  private layoutChips(relicId: RelicId, types: PlantType[], startY: number, owned: boolean, holder: PlantType | null): Phaser.GameObjects.Text[] {
    const chips: Phaser.GameObjects.Text[] = [];
    types.forEach((type, i) => {
      const config = PLANTS[type];
      const col = i % 4; const row = Math.floor(i / 4);
      const x = 852 + col * 98; const y = startY + row * 36;
      const collected = isPlantCollected(type);
      const holding = holder === type;
      const backgroundColor = holding ? '#ffd9e6' : collected ? '#e8f5f2' : '#eceff0';
      const color = holding ? '#d7527c' : collected ? '#348c72' : '#9aa8a4';
      const chip = this.add.text(x, y, holding ? `✦ ${config.name}` : config.name, {
        fontFamily: 'Microsoft YaHei', fontSize: '11px', color, backgroundColor, padding: { x: 10, y: 5 }, fontStyle: 'bold',
      });
      if (collected && owned) {
        chip.setInteractive({ useHandCursor: true });
        chip.on('pointerover', () => chip.setBackgroundColor(holding ? '#ffcadf' : '#d5efea'));
        chip.on('pointerout', () => chip.setBackgroundColor(backgroundColor));
        chip.on('pointerdown', () => {
          if (holding) {
            unequipRelic(relicId);
            this.cameras.main.flash(120, 214, 232, 246, false);
          } else if (equipRelic(relicId, type)) {
            this.cameras.main.flash(150, 255, 214, 232, false);
          } else {
            this.cameras.main.shake(100, 0.004);
            return;
          }
          this.refresh();
        });
      }
      chips.push(chip);
    });
    return chips;
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
