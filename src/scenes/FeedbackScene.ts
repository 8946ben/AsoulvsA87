import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import {
  FEEDBACK_MAX_CONTENT,
  flushPending,
  pendingCount,
  submitFeedback,
} from '../core/Feedback';
import { type ParentSceneData, returnToParentScene } from '../core/SceneNavigation';
import { sharpenSceneText, sharpenText } from '../core/TextQuality';
import { createDomField, type DomField } from '../ui/DomField';
import { createFreshBackdrop, createFreshPanel, FRESH } from '../ui/FreshTheme';

const PANEL = { x: GAME_WIDTH / 2, y: 410, w: 980, h: 440 } as const;
const LABEL_X = 190;
const CONTENT_RECT = { x: LABEL_X, y: 292, width: 900, height: 236 } as const;

/** 主界面「意见反馈」入口：填写建议并提交到服务器，失败时转存本地待补交。 */
export class FeedbackScene extends Phaser.Scene {
  static readonly KEY = 'FeedbackScene';

  private returnScene?: string;
  private contentField?: DomField;
  private counter!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private submitButton!: Phaser.GameObjects.Text;
  private submitting = false;
  private alive = true;

  constructor() { super(FeedbackScene.KEY); }

  init(data: ParentSceneData): void { this.returnScene = data?.returnScene; }

  create(): void {
    this.alive = true;
    this.submitting = false;
    createFreshBackdrop(this, 'paper');
    this.createHeader();
    this.createPanel();
    this.createFields();
    this.createButtons();

    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    // Ctrl+Enter 快速提交：输入框里回车用于换行，组合键才不会冲突。
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        void this.onSubmit();
      }
    });
    this.events.on('sleep', () => this.setFieldsVisible(false));
    this.events.on('wake', () => this.setFieldsVisible(true));
    this.events.once('shutdown', () => {
      this.alive = false;
      this.contentField?.destroy();
    });

    sharpenSceneText(this);
    void this.retryPending();
  }

  private createHeader(): void {
    this.add.text(42, 26, '意见反馈', {
      fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#42506d', fontStyle: 'bold',
    });
    this.add.text(43, 72, 'FEEDBACK', {
      fontFamily: 'Arial', fontSize: '13px', color: '#e85f91', fontStyle: 'bold', letterSpacing: 2,
    });
  }

  private createPanel(): void {
    createFreshPanel(this, PANEL.x, PANEL.y, PANEL.w, PANEL.h, FRESH.PINK, 0.96);
    this.add.text(GAME_WIDTH / 2, 218, '告诉我们你对《枝江舞台保卫战》的想法', {
      fontFamily: 'Microsoft YaHei', fontSize: '19px', color: '#42506d', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 246, '可写建议、遇到的 Bug、想要的角色或关卡；我们会认真阅读每一条。', {
      fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#71809a',
    }).setOrigin(0.5);
    this.add.text(LABEL_X, 278, '你的建议　*', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#42506d', fontStyle: 'bold',
    });
    this.counter = sharpenText(this.add.text(
      CONTENT_RECT.x + CONTENT_RECT.width,
      CONTENT_RECT.y + CONTENT_RECT.height + 8,
      `0 / ${FEEDBACK_MAX_CONTENT}`,
      { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#9aa8b8' },
    ).setOrigin(1, 0));
  }

  private createFields(): void {
    this.contentField = createDomField(this, {
      rect: CONTENT_RECT,
      kind: 'textarea',
      maxLength: FEEDBACK_MAX_CONTENT,
      placeholder: '在这里写下你的想法…（支持中文输入法，Ctrl+Enter 提交）',
      onInput: (value) => this.counter.setText(`${value.length} / ${FEEDBACK_MAX_CONTENT}`),
    });
  }

  private setFieldsVisible(visible: boolean): void {
    this.contentField?.setVisible(visible);
  }

  private createButtons(): void {
    this.submitButton = sharpenText(this.add.text(556, 582, '提交', {
      fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#ffffff', backgroundColor: '#e85f91',
      padding: { x: 36, y: 13 }, fontStyle: 'bold',
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.submitButton.on('pointerover', () => { if (!this.submitting) this.submitButton.setBackgroundColor('#f176a3').setScale(1.03); });
    this.submitButton.on('pointerout', () => { if (!this.submitting) this.submitButton.setBackgroundColor('#e85f91').setScale(1); });
    this.submitButton.on('pointerdown', () => void this.onSubmit());

    const back = sharpenText(this.add.text(772, 582, '返回', {
      fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#52667d', backgroundColor: '#e6f4ef',
      padding: { x: 36, y: 13 },
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setBackgroundColor('#d7ece5').setScale(1.03));
    back.on('pointerout', () => back.setBackgroundColor('#e6f4ef').setScale(1));
    back.on('pointerdown', () => this.goBack());

    this.status = sharpenText(this.add.text(GAME_WIDTH / 2, 648, '', {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#71809a',
    })).setOrigin(0.5);
  }

  private async onSubmit(): Promise<void> {
    if (this.submitting) return;
    const content = this.contentField?.value().trim() ?? '';
    if (content.length === 0) {
      this.setStatus('先写点什么再提交吧～', '#e85f91');
      this.contentField?.focus();
      return;
    }
    this.submitting = true;
    this.submitButton.setText('提交中…').setBackgroundColor('#d9b7c5').disableInteractive();

    const result = await submitFeedback({ content });
    if (!this.alive) return;

    this.submitting = false;
    this.submitButton.setText('提交').setBackgroundColor('#e85f91').setInteractive({ useHandCursor: true });
    if (result.ok) {
      this.contentField?.setValue('');
      this.cameras.main.flash(180, 255, 214, 232, false);
      const rest = pendingCount();
      this.setStatus(rest > 0 ? `${result.message}（另有 ${rest} 条待补交）` : result.message, '#2f8066');
      return;
    }
    this.setStatus(result.message, result.queued ? '#b47724' : '#e85f91');
  }

  private setStatus(text: string, color: string): void {
    this.status.setText(text).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.status);
    this.tweens.add({ targets: this.status, alpha: 0.55, duration: 260, yoyo: true, repeat: 2 });
  }

  /** 打开页面时补交上次离线留下的反馈。 */
  private async retryPending(): Promise<void> {
    const pending = pendingCount();
    if (pending === 0) return;
    this.setStatus(`发现 ${pending} 条未送达的反馈，正在补交…`, '#71809a');
    const sent = await flushPending();
    if (!this.alive) return;
    if (sent > 0) this.setStatus(`已补交 ${sent} 条早前保存的反馈。`, '#2f8066');
    else this.setStatus('仍有反馈未能送达，服务器恢复后会自动重试。', '#b47724');
  }

  private goBack(): void {
    returnToParentScene(this, this.returnScene);
  }
}
