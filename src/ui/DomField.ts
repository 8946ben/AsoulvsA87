import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

/**
 * 在游戏画布之上浮动一个原生 HTML 输入控件。
 *
 * 为什么不用 Phaser 的键盘事件自己画输入框：Phaser 收不到中文输入法的候选与合成过程，
 * 中文建议根本没法输入。真实 DOM 控件天然支持 IME、粘贴和移动端键盘。
 *
 * 坐标换算：游戏世界是 1280×720 逻辑坐标，画布被 Scale.FIT 缩放后又居中显示，
 * 因此每次都用 `canvas.getBoundingClientRect()` 反推当前缩放比，把逻辑矩形映射成
 * 屏幕像素矩形；窗口尺寸变化由 ResizeObserver 驱动复位。
 */

export interface DomFieldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DomFieldOptions {
  /** 游戏逻辑坐标下的位置与尺寸（左上角原点）。 */
  rect: DomFieldRect;
  kind?: 'textarea' | 'input';
  placeholder?: string;
  maxLength?: number;
  /** 每次输入后回调当前值。 */
  onInput?: (value: string) => void;
}

export interface DomField {
  value(): string;
  setValue(value: string): void;
  focus(): void;
  setVisible(visible: boolean): void;
  destroy(): void;
}

const FONT_STACK = "'Microsoft YaHei', 'Segoe UI', sans-serif";

/** 创建浮层；调用方必须负责在场景 shutdown/sleep 时 destroy()，否则会遮挡其它页面。 */
export function createDomField(scene: Phaser.Scene, options: DomFieldOptions): DomField {
  const { rect } = options;
  const canvas = scene.game.canvas;
  const element = document.createElement(options.kind === 'input' ? 'input' : 'textarea') as
    HTMLTextAreaElement | HTMLInputElement;

  if (element instanceof HTMLTextAreaElement) {
    element.rows = 1;
    element.wrap = 'soft';
  } else {
    element.type = 'text';
  }
  element.placeholder = options.placeholder ?? '';
  element.maxLength = options.maxLength ?? 500;
  element.autocomplete = 'off';
  element.spellcheck = false;

  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'position:fixed', 'z-index:40', 'pointer-events:auto',
    'display:flex', 'align-items:stretch',
  ].join(';');
  element.style.cssText = [
    'width:100%', 'height:100%', 'box-sizing:border-box',
    'border:2px solid rgba(98,202,232,0.55)', 'border-radius:12px',
    'background:#ffffff', 'color:#42506d', 'padding:9px 12px',
    'outline:none', 'resize:none', 'font-family:' + FONT_STACK,
    'line-height:1.5', 'box-shadow:0 4px 14px rgba(80,113,126,0.10)',
  ].join(';');
  element.addEventListener('focus', () => {
    element.style.borderColor = 'rgba(232,95,145,0.85)';
    element.style.boxShadow = '0 0 0 3px rgba(232,95,145,0.14)';
  });
  element.addEventListener('blur', () => {
    element.style.borderColor = 'rgba(98,202,232,0.55)';
    element.style.boxShadow = '0 4px 14px rgba(80,113,126,0.10)';
  });
  if (options.onInput) {
    element.addEventListener('input', () => options.onInput?.(element.value));
  }
  wrap.appendChild(element);
  document.body.appendChild(wrap);

  let visible = true;
  const reposition = (): void => {
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const sx = box.width / GAME_WIDTH;
    const sy = box.height / GAME_HEIGHT;
    wrap.style.left = `${box.left + rect.x * sx}px`;
    wrap.style.top = `${box.top + rect.y * sy}px`;
    wrap.style.width = `${rect.width * sx}px`;
    wrap.style.height = `${rect.height * sy}px`;
    // 字号与内边距跟着画布缩放，视觉密度才和 Phaser 绘制的文字一致。
    element.style.fontSize = `${Math.round(15 * sx)}px`;
    element.style.padding = `${Math.round(9 * sy)}px ${Math.round(12 * sx)}px`;
  };
  reposition();

  // 游戏内的 resize 处理走 requestAnimationFrame，所以这里用 ResizeObserver
  // 观察画布本身，等布局真正落定后再复位，避免和 Phaser 的缩放更新抢时序。
  const observer = new ResizeObserver(reposition);
  observer.observe(canvas);
  window.addEventListener('resize', reposition);

  return {
    value: () => element.value,
    setValue: (value: string) => {
      element.value = value;
      options.onInput?.(value);
    },
    focus: () => element.focus(),
    setVisible: (next: boolean) => {
      visible = next;
      wrap.style.display = visible ? 'flex' : 'none';
      if (visible) reposition();
    },
    destroy: () => {
      observer.disconnect();
      window.removeEventListener('resize', reposition);
      element.remove();
      wrap.remove();
    },
  };
}
