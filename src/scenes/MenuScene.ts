import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TEX } from '../config/GameConfig';
import { activateDeveloperMode, isDeveloperMode } from '../core/DeveloperMode';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { CodexScene } from './CodexScene';
import { LevelSelectScene } from './LevelSelectScene';

export class MenuScene extends Phaser.Scene {
  static readonly KEY = 'MenuScene';
  private developerButton!: Phaser.GameObjects.Text;
  private developerStatus!: Phaser.GameObjects.Text;

  constructor() { super(MenuScene.KEY); }

  create(): void {
    this.createBackground(); this.createCast(); this.createTitle(); this.createStartButton(); this.createCodexButton(); this.createDeveloperButton();
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 38, 'ai辅助创作，版权归asoul官方及社区素材原作者所有', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#66869d' }).setOrigin(0.5);
    sharpenSceneText(this);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050b19, 0x10193a, 0x133b4b, 0x091523, 1); bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x62e6ff, 0.07); bg.fillTriangle(80, 0, 410, GAME_HEIGHT, 580, GAME_HEIGHT);
    bg.fillStyle(0xff68a5, 0.06); bg.fillTriangle(1200, 0, 700, GAME_HEIGHT, 980, GAME_HEIGHT);
    bg.lineStyle(2, 0x56dbff, 0.16);
    for (let y = 80; y < GAME_HEIGHT; y += 85) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(GAME_WIDTH, y + 50); bg.strokePath(); }
    bg.fillStyle(0x020610, 0.72); bg.fillRect(0, GAME_HEIGHT - 96, GAME_WIDTH, 96);
    for (let x = 0; x < GAME_WIDTH; x += 27) { bg.fillStyle(x % 81 ? 0x07101e : 0x101b32, 1); bg.fillCircle(x + 12, GAME_HEIGHT - 96 - (x % 4) * 4, 18); }
    for (let i = 0; i < 8; i++) {
      const light = this.add.circle(180 + i * 132, 40, 5, i % 2 ? 0xff6fa8 : 0x62e5ff, 0.85);
      this.tweens.add({ targets: light, alpha: 0.25, scale: 1.6, duration: 700 + i * 90, yoyo: true, repeat: -1 });
    }
  }

  private createCast(): void {
    const left = [TEX.PLANT_JIAXINTANG, TEX.PLANT_BEIJIXING, TEX.PLANT_NAIQILIN];
    left.forEach((texture, index) => {
      const x = 106 + index * 104; const y = 445 + Math.abs(1 - index) * 22;
      const glow = this.add.circle(x, y, 47, index % 2 ? 0xff6f9f : 0x58e2ff, 0.1);
      const image = this.add.image(x, y, texture).setScale(1.05).setDepth(3);
      this.tweens.add({ targets: [image, glow], y: y - 9, duration: 1200 + index * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    const enemyGlow = this.add.circle(1110, 422, 115, 0xff4f75, 0.12).setDepth(1);
    const enemy = this.add.image(1110, 422, TEX.ZOMBIE_DRAGON).setScale(1.55).setDepth(3).setTint(0xffd8e2);
    this.tweens.add({ targets: enemy, angle: 2.5, y: enemy.y - 8, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: enemyGlow, scale: 1.18, alpha: 0.04, duration: 900, yoyo: true, repeat: -1 });
    this.add.text(1110, 552, '神区化龙 A87', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#ff94ad', fontStyle: 'bold' }).setOrigin(0.5);
  }

  private createTitle(): void {
    this.add.text(GAME_WIDTH / 2, 108, '枝江舞台保卫战', { fontFamily: 'Microsoft YaHei', fontSize: '58px', color: '#f5fdff', fontStyle: 'bold', stroke: '#113652', strokeThickness: 10 }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 171, 'Asoul同人作品', { fontFamily: 'Microsoft YaHei', fontSize: '22px', color: '#70e8ff', fontStyle: 'bold' }).setOrigin(0.5);
    const rule = this.add.graphics(); rule.lineStyle(2, 0x6de7ff, 0.55); rule.beginPath(); rule.moveTo(452, 205); rule.lineTo(828, 205); rule.strokePath();
    this.add.text(GAME_WIDTH / 2, 224, '枝江出现了邪恶的白色怪物，想夺走属于asoul的舞台出道当偶像！', { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#a9c8d8' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 254, 'asoul与粉丝们必须并肩守住舞台！', { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#a9c8d8' }).setOrigin(0.5);
  }

  private createStartButton(): void {
    const glow = this.add.rectangle(GAME_WIDTH / 2, 365, 244, 72, 0x5ee7ff, 0.13).setStrokeStyle(2, 0x6decff, 0.45);
    const button = this.add.text(GAME_WIDTH / 2, 365, '选择巡演关卡', { fontFamily: 'Microsoft YaHei', fontSize: '24px', color: '#ffffff', backgroundColor: '#256487', padding: { x: 42, y: 16 }, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    button.on('pointerover', () => { button.setBackgroundColor('#337fa3').setScale(1.035); glow.setAlpha(0.28); });
    button.on('pointerout', () => { button.setBackgroundColor('#256487').setScale(1); glow.setAlpha(1); });
    button.on('pointerdown', () => this.scene.start(LevelSelectScene.KEY));
    this.tweens.add({ targets: glow, scaleX: 1.06, scaleY: 1.12, alpha: 0.05, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(GAME_WIDTH / 2, 429, '点击角色卡 → 点击草坪部署　｜　点击应援球收集资源', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#8bacbe' }).setOrigin(0.5);
  }

  private createCodexButton(): void {
    const button = this.add.text(GAME_WIDTH / 2, 482, '查看枝江图鉴', {
      fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#dff9ff',
      backgroundColor: '#172d43', padding: { x: 28, y: 11 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    button.on('pointerover', () => button.setBackgroundColor('#28526c').setScale(1.03));
    button.on('pointerout', () => button.setBackgroundColor('#172d43').setScale(1));
    button.on('pointerdown', () => this.scene.start(CodexScene.KEY));
  }

  private createDeveloperButton(): void {
    this.developerButton = this.add.text(GAME_WIDTH / 2, 540, '', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#cce9f4',
      padding: { x: 20, y: 8 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    this.developerStatus = this.add.text(GAME_WIDTH / 2, 573, '', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#718e9e',
    }).setOrigin(0.5);
    this.refreshDeveloperButton();
    this.developerButton.on('pointerover', () => this.developerButton.setScale(1.03).setBackgroundColor('#31536b'));
    this.developerButton.on('pointerout', () => { this.developerButton.setScale(1); this.refreshDeveloperButton(); });
    this.developerButton.on('pointerdown', () => {
      if (!isDeveloperMode()) this.openDeveloperLogin();
    });
  }

  private refreshDeveloperButton(): void {
    const enabled = isDeveloperMode();
    this.developerButton
      .setText(enabled ? '开发者模式 · 已启用' : '开发者模式')
      .setBackgroundColor(enabled ? '#285b50' : '#172d43')
      .setColor(enabled ? '#8ff2cf' : '#cce9f4');
    this.developerStatus.setText(enabled ? '全部关卡可直接进入 · 不写入普通通关进度' : '开发测试入口');
  }

  private openDeveloperLogin(): void {
    let code = '';
    const modal = this.add.container(0, 0).setDepth(210);
    const blocker = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020610, 0.78).setInteractive();
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 470, 260, 0x101d30, 0.99).setStrokeStyle(2, 0x65e7ff, 0.7);
    const title = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 88, '开发者身份验证', {
      fontFamily: 'Microsoft YaHei', fontSize: '25px', color: '#f4fcff', fontStyle: 'bold',
    })).setOrigin(0.5);
    const subtitle = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '输入开发者口令后按回车', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#83aabd',
    })).setOrigin(0.5);
    const inputBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 1, 330, 48, 0x07101e, 1).setStrokeStyle(2, 0x47748b, 0.8);
    const inputText = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 1, '口令：', {
      fontFamily: 'Microsoft YaHei', fontSize: '18px', color: '#dff8ff',
    })).setOrigin(0.5);
    const hint = sharpenText(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 39, 'ESC 取消', {
      fontFamily: 'Microsoft YaHei', fontSize: '11px', color: '#69899a',
    })).setOrigin(0.5);
    const confirm = sharpenText(this.add.text(GAME_WIDTH / 2 - 62, GAME_HEIGHT / 2 + 83, '确认', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#effcff', backgroundColor: '#256487', padding: { x: 20, y: 9 }, fontStyle: 'bold',
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const cancel = sharpenText(this.add.text(GAME_WIDTH / 2 + 62, GAME_HEIGHT / 2 + 83, '取消', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#b8d0dc', backgroundColor: '#26394a', padding: { x: 20, y: 9 },
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    modal.add([blocker, panel, title, subtitle, inputBg, inputText, hint, confirm, cancel]);

    const refreshInput = (): void => { inputText.setText('口令：' + '●'.repeat(code.length)); };
    const close = (): void => {
      this.input.keyboard?.off('keydown', onKeyDown);
      modal.destroy(true);
    };
    const submit = (): void => {
      if (activateDeveloperMode(code)) {
        close(); this.refreshDeveloperButton();
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
