import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TEX } from '../config/GameConfig';
import { activateDeveloperMode, deactivateDeveloperMode, isDeveloperMode } from '../core/DeveloperMode';
import { resetSessionAdvanceRanks } from '../core/Collection';
import { clearAllProgress } from '../core/ProgressReset';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { createFreshBackdrop, FRESH } from '../ui/FreshTheme';
import { CodexScene } from './CodexScene';
import { BackpackScene } from './BackpackScene';
import { RelicDrawScene } from './RelicDrawScene';
import { ShopScene } from './ShopScene';
import { openChildScene } from '../core/SceneNavigation';

export class MenuScene extends Phaser.Scene {
  static readonly KEY = 'MenuScene';
  private settingsButton!: Phaser.GameObjects.Text;
  /** 口令弹窗打开期间，设置面板让出 ESC 等按键，避免两层弹窗同时响应。 */
  private developerLoginOpen = false;

  constructor() { super(MenuScene.KEY); }

  create(): void {
    this.createBackground(); this.createCast(); this.createTitle(); this.createStartButton(); this.createIconBar(); this.createSettingsButton(); this.createFeedbackButton();
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'AI辅助创作 · 版权归A-SOUL官方及社区素材原作者所有', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#60758a' }).setOrigin(0.5);
    sharpenSceneText(this);
  }

  private createBackground(): void {
    const bg = createFreshBackdrop(this, 'sky');
    bg.fillStyle(0xffffff, 0.34); bg.fillEllipse(GAME_WIDTH / 2, 612, 790, 120);
    bg.lineStyle(5, 0xffffff, 0.38); bg.beginPath(); bg.arc(GAME_WIDTH / 2, 436, 360, Math.PI, Math.PI * 2); bg.strokePath();
    bg.lineStyle(2, FRESH.PINK, 0.24); bg.beginPath(); bg.arc(GAME_WIDTH / 2, 442, 330, Math.PI, Math.PI * 2); bg.strokePath();
    for (let i = 0; i < 8; i++) {
      const light = this.add.circle(180 + i * 132, 46, 5, i % 2 ? FRESH.PINK : FRESH.BLUE, 0.7);
      this.tweens.add({ targets: light, alpha: 0.25, scale: 1.45, duration: 900 + i * 90, yoyo: true, repeat: -1 });
    }
  }

  private createCast(): void {
    const left = [TEX.PLANT_JIAXINTANG, TEX.PLANT_BEIJIXING, TEX.PLANT_NAIQILIN];
    left.forEach((texture, index) => {
      const x = 106 + index * 104; const y = 445 + Math.abs(1 - index) * 22;
      const glow = this.add.circle(x, y, 52, index % 2 ? FRESH.PINK : FRESH.BLUE, 0.22);
      const image = this.add.image(x, y, texture).setScale(1.05).setDepth(3);
      this.tweens.add({ targets: [image, glow], y: y - 9, duration: 1200 + index * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    const enemyGlow = this.add.circle(1110, 422, 115, FRESH.PURPLE, 0.16).setDepth(1);
    const enemy = this.add.image(1110, 422, TEX.MENU_DRAGON).setScale(0.165).setDepth(3);
    this.tweens.add({ targets: enemy, angle: 2.5, y: enemy.y - 8, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: enemyGlow, scale: 1.18, alpha: 0.04, duration: 900, yoyo: true, repeat: -1 });
    this.add.text(1110, 552, '神区化龙 A87', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#885f9f', fontStyle: 'bold' }).setOrigin(0.5);
  }

  private createTitle(): void {
    this.add.text(GAME_WIDTH / 2, 108, '枝江舞台保卫战', { fontFamily: 'Microsoft YaHei', fontSize: '58px', color: '#42506d', fontStyle: 'bold', stroke: '#fffdf6', strokeThickness: 9 }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 171, 'A-SOUL 同人作品', { fontFamily: 'Microsoft YaHei', fontSize: '21px', color: '#e85f91', fontStyle: 'bold' }).setOrigin(0.5);
    const rule = this.add.graphics(); rule.lineStyle(3, FRESH.MINT, 0.72); rule.beginPath(); rule.moveTo(452, 205); rule.lineTo(828, 205); rule.strokePath();
    this.add.text(GAME_WIDTH / 2, 239, '枝江出现了邪恶的白色怪物，想夺走舞台自己当偶像！我们来阻止它们的阴谋！', { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#5f6d86' }).setOrigin(0.5);
  }

  private createStartButton(): void {
    const glow = this.add.rectangle(GAME_WIDTH / 2, 365, 250, 76, FRESH.PINK, 0.15).setStrokeStyle(2, 0xffffff, 0.7);
    const button = this.add.text(GAME_WIDTH / 2, 365, '开始舞台巡演', { fontFamily: 'Microsoft YaHei', fontSize: '24px', color: '#ffffff', backgroundColor: '#e85f91', padding: { x: 42, y: 16 }, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    button.on('pointerover', () => { button.setBackgroundColor('#f176a3').setScale(1.035); glow.setAlpha(0.3); });
    button.on('pointerout', () => { button.setBackgroundColor('#e85f91').setScale(1); glow.setAlpha(1); });
    button.on('pointerdown', () => openChildScene(this, 'ModeSelectScene'));
    this.tweens.add({ targets: glow, scaleX: 1.06, scaleY: 1.12, alpha: 0.05, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(GAME_WIDTH / 2, 429, '点击角色卡 → 点击草坪部署　｜　移动鼠标收集应援球', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#687991' }).setOrigin(0.5);
  }

  /** 底部功能图标栏：图鉴 / 背包 / 抽卡转盘 / 商店，与背包和图鉴同级。 */
  private createIconBar(): void {
    const entries = [
      { icon: '📖', label: '枝江图鉴', scene: CodexScene.KEY, color: '#4eb3cf', hover: '#e9f8fb' },
      { icon: '🎒', label: '角色背包', scene: BackpackScene.KEY, color: '#e85f91', hover: '#fcebf2' },
      { icon: '🎡', label: '抽卡转盘', scene: RelicDrawScene.KEY, color: '#a66b25', hover: '#fdf3e3' },
      { icon: '🛒', label: '商店', scene: ShopScene.KEY, color: '#348c72', hover: '#e8f5f2' },
    ];
    const startX = GAME_WIDTH / 2 - ((entries.length - 1) * 148) / 2;
    entries.forEach((entry, index) => {
      const x = startX + index * 148;
      const y = 500;
      const card = this.add.rectangle(x, y, 128, 108, 0xfffffb, 0.94)
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(entry.color).color, 0.45)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);
      const icon = this.add.text(x, y - 22, entry.icon, { fontSize: '40px' }).setOrigin(0.5).setDepth(6);
      const label = this.add.text(x, y + 28, entry.label, {
        fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6);
      card.on('pointerover', () => {
        card.setFillStyle(Phaser.Display.Color.HexStringToColor(entry.hover).color, 1).setScale(1.04);
        icon.setScale(1.1); label.setScale(1.05);
      });
      card.on('pointerout', () => {
        card.setFillStyle(0xfffffb, 0.94).setScale(1);
        icon.setScale(1); label.setScale(1);
      });
      card.on('pointerdown', () => openChildScene(this, entry.scene));
    });
  }

  /** 左上角「⚙ 设置」：开发者模式、清空进度等系统级入口都收进设置面板。 */
  private createSettingsButton(): void {
    this.settingsButton = this.add.text(28, 40, '⚙ 设置', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#52667d',
      padding: { x: 16, y: 9 }, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    this.refreshSettingsEntry();
    this.settingsButton.on('pointerover', () => this.settingsButton.setScale(1.04).setBackgroundColor('#dff4ef'));
    this.settingsButton.on('pointerout', () => { this.settingsButton.setScale(1); this.refreshSettingsEntry(); });
    this.settingsButton.on('pointerdown', () => this.openSettingsPanel());
  }

  /** 玩家意见反馈入口：跳转到外部问卷（问卷星）收集建议。 */
  private createFeedbackButton(): void {
    const button = this.add.text(GAME_WIDTH / 2, 594, '💬 意见反馈', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#6b57a8',
      backgroundColor: '#f0ecfb', padding: { x: 20, y: 8 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    button.on('pointerover', () => button.setScale(1.03).setBackgroundColor('#e3dbf8'));
    button.on('pointerout', () => button.setScale(1).setBackgroundColor('#f0ecfb'));
    button.on('pointerdown', () => window.open('https://v.wjx.cn/vm/YJXFnwB.aspx', '_blank', 'noopener'));
  }

  /** 设置图标随开发者模式变色，关掉面板也能一眼看出当前是否处于开发者模式。 */
  private refreshSettingsEntry(): void {
    const enabled = isDeveloperMode();
    this.settingsButton
      .setText(enabled ? '⚙ 设置 · 开发者模式' : '⚙ 设置')
      .setBackgroundColor(enabled ? '#d9f3e7' : '#edf5f5')
      .setColor(enabled ? '#317d67' : '#52667d');
  }

  /** 设置面板：开发者模式开关 + 清空所有进度（需再点一次确认，防误触）。 */
  private openSettingsPanel(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const modal = this.add.container(0, 0).setDepth(205);
    const blocker = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x42506d, 0.36).setInteractive();
    const panel = this.add.rectangle(cx, cy + 4, 480, 404, FRESH.CREAM, 0.99).setStrokeStyle(2, FRESH.BLUE, 0.72);
    const title = sharpenText(this.add.text(cx, cy - 150, '设置', {
      fontFamily: 'Microsoft YaHei', fontSize: '25px', color: '#42506d', fontStyle: 'bold',
    })).setOrigin(0.5);
    const rule = this.add.graphics();
    rule.lineStyle(2, FRESH.MINT, 0.6);
    rule.beginPath(); rule.moveTo(cx - 180, cy - 124); rule.lineTo(cx + 180, cy - 124); rule.strokePath();
    const devLabel = sharpenText(this.add.text(cx, cy - 104, '开发者模式', {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#42506d', fontStyle: 'bold',
    })).setOrigin(0.5);
    const devButton = sharpenText(this.add.text(cx, cy - 66, '', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', padding: { x: 20, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const devStatus = sharpenText(this.add.text(cx, cy - 28, '', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#71809a', align: 'center', lineSpacing: 4,
    })).setOrigin(0.5);
    const rule2 = this.add.graphics();
    rule2.lineStyle(2, FRESH.MINT, 0.6);
    rule2.beginPath(); rule2.moveTo(cx - 180, cy + 6); rule2.lineTo(cx + 180, cy + 6); rule2.strokePath();
    const progressLabel = sharpenText(this.add.text(cx, cy + 26, '进度管理', {
      fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#42506d', fontStyle: 'bold',
    })).setOrigin(0.5);
    const resetButton = sharpenText(this.add.text(cx, cy + 62, '清空所有进度', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#d64562', backgroundColor: '#fdecef',
      padding: { x: 20, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const resetHint = sharpenText(this.add.text(cx, cy + 100, '关卡、灵境币、藏品、图鉴与肉鸽残局全部回到初始状态，不可恢复', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#71809a',
    })).setOrigin(0.5);
    const close = sharpenText(this.add.text(cx, cy + 156, '关闭', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#52667d', backgroundColor: '#e6f4ef', padding: { x: 20, y: 9 },
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    modal.add([blocker, panel, title, rule, devLabel, devButton, devStatus, rule2, progressLabel, resetButton, resetHint, close]);

    const refreshDevRow = (): void => {
      const enabled = isDeveloperMode();
      devButton
        .setText(enabled ? '开发者模式 · 已启用' : '开发者模式')
        .setBackgroundColor(enabled ? '#d9f3e7' : '#edf5f5')
        .setColor(enabled ? '#317d67' : '#52667d');
      devStatus.setText(enabled
        ? '全部关卡直接进入 · 额外开放肉鸽模式\n灵境币与答题券按 9999 显示 · 不写入普通通关进度'
        : '开发测试入口');
    };
    refreshDevRow();

    let armed = false;
    let disarmEvent: Phaser.Time.TimerEvent | null = null;
    const disarm = (): void => {
      armed = false;
      resetButton.setText('清空所有进度').setBackgroundColor('#fdecef').setColor('#d64562');
    };
    const closePanel = (): void => {
      disarmEvent?.remove(false);
      this.input.keyboard?.off('keydown', onKey);
      modal.destroy(true);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (this.developerLoginOpen) return; // 口令弹窗在最上层时，ESC 交给它处理。
      if (event.key === 'Escape') closePanel();
    };

    devButton.on('pointerover', () => devButton.setScale(1.03));
    devButton.on('pointerout', () => devButton.setScale(1));
    devButton.on('pointerdown', () => {
      if (isDeveloperMode()) {
        // 已启用时再次点击即关闭，方便随时切回正常进度；会话级进阶预览一并丢弃。
        deactivateDeveloperMode();
        resetSessionAdvanceRanks();
        refreshDevRow();
        this.refreshSettingsEntry();
        this.cameras.main.flash(150, 255, 214, 232, false);
        return;
      }
      this.openDeveloperLogin(refreshDevRow);
    });
    resetButton.on('pointerover', () => resetButton.setScale(1.03));
    resetButton.on('pointerout', () => resetButton.setScale(1));
    resetButton.on('pointerdown', () => {
      if (!armed) {
        armed = true;
        resetButton.setText('再点一次确认清空').setBackgroundColor('#d64562').setColor('#ffffff');
        disarmEvent = this.time.delayedCall(3000, disarm);
        return;
      }
      clearAllProgress();
      closePanel();
      this.cameras.main.flash(200, 255, 168, 168, false);
      // 重启主界面，让所有入口按初始存档重新渲染。
      this.scene.restart();
    });
    close.on('pointerdown', closePanel);
    this.input.keyboard?.on('keydown', onKey);
  }

  /** 口令弹窗关闭（无论成败）后的回调：用于让设置面板刷新开发者模式那一行。 */
  private openDeveloperLogin(onClosed?: () => void): void {
    this.developerLoginOpen = true;
    let code = '';
    const modal = this.add.container(0, 0).setDepth(210);
    const blocker = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x42506d, 0.36).setInteractive();
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 470, 260, FRESH.CREAM, 0.99).setStrokeStyle(2, FRESH.BLUE, 0.72);
    const title = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 88, '开发者身份验证', {
      fontFamily: 'Microsoft YaHei', fontSize: '25px', color: '#42506d', fontStyle: 'bold',
    })).setOrigin(0.5);
    const subtitle = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '输入开发者口令后按回车', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#71809a',
    })).setOrigin(0.5);
    const inputBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 1, 330, 48, 0xffffff, 1).setStrokeStyle(2, FRESH.BLUE, 0.55);
    const inputText = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 1, '口令：', {
      fontFamily: 'Microsoft YaHei', fontSize: '18px', color: '#42506d',
    })).setOrigin(0.5);
    const hint = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 39, 'ESC 取消', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#71809a',
    })).setOrigin(0.5);
    const confirm = sharpenText(this.add.text(GAME_WIDTH / 2 - 62, GAME_HEIGHT / 2 + 83, '确认', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#ffffff', backgroundColor: '#e85f91', padding: { x: 20, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const cancel = sharpenText(this.add.text(GAME_WIDTH / 2 + 62, GAME_HEIGHT / 2 + 83, '取消', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#52667d', backgroundColor: '#e6f4ef', padding: { x: 20, y: 9 },
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    modal.add([blocker, panel, title, subtitle, inputBg, inputText, hint, confirm, cancel]);

    const refreshInput = (): void => { inputText.setText('口令：' + '●'.repeat(code.length)); };
    const close = (): void => {
      this.input.keyboard?.off('keydown', onKeyDown);
      modal.destroy(true);
      this.developerLoginOpen = false;
      this.refreshSettingsEntry();
      onClosed?.();
    };
    const submit = (): void => {
      if (activateDeveloperMode(code)) {
        close();
        this.cameras.main.flash(180, 105, 240, 196, false);
        return;
      }
      code = ''; refreshInput(); hint.setText('口令错误，请重新输入').setColor('#ff7895');
      this.tweens.add({ targets: modal, x: { from: -7, to: 7 }, duration: 45, yoyo: true, repeat: 3, onComplete: () => modal.setX(0) });
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault();
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'Enter') { submit(); return; }
      if (event.key === 'Backspace') { code = code.slice(0, -1); refreshInput(); return; }
      if (event.key.length === 1 && /^[a-z0-9]$/i.test(event.key) && code.length < 16) {
        code += event.key.toLowerCase(); refreshInput(); hint.setText('ESC 取消').setColor('#69899a');
      }
    };

    this.input.keyboard?.on('keydown', onKeyDown);
    confirm.on('pointerdown', submit);
    cancel.on('pointerdown', close);
  }
}
