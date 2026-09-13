const SESSION_KEY = 'asoul-developer-mode-v1';
const ACCESS_CODE = 'ftqd';

/** 开发者模式仅在当前浏览器会话内生效，不改写正常关卡进度。 */
export function isDeveloperMode(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'enabled';
  } catch {
    return false;
  }
}

/** 关闭开发者模式：清除会话标记，之后可随时重新输入口令开启。 */
export function deactivateDeveloperMode(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 存储不可用时保持原状，调用方会按未开启处理。
  }
}

export function activateDeveloperMode(code: string): boolean {
  if (code.trim().toLowerCase() !== ACCESS_CODE) return false;
  try {
    window.sessionStorage.setItem(SESSION_KEY, 'enabled');
  } catch {
    // 禁用存储时仍无法跨场景保留，调用方会按未开启处理。
    return false;
  }
  return true;
}
