import { ENEMY_CODEX_ORDER } from '../data/zombies';
import type { ZombieType } from '../data/zombies';
import { isDeveloperMode } from './DeveloperMode';

/**
 * 图鉴解锁进度：记录战役中遭遇过的敌人。
 * 角色以「收录」为准、装备以「入库」为准（见各自的存储），此处只维护敌人遭遇记录。
 */
const STORAGE_KEY = 'asoul-codex-sightings-v1';

interface CodexState {
  version: 1;
  enemies: ZombieType[];
}

function readState(): CodexState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CodexState>;
      const enemies = Array.isArray(parsed.enemies) ? parsed.enemies.filter((id) => ENEMY_CODEX_ORDER.includes(id)) : [];
      return { version: 1, enemies };
    }
  } catch { /* 无痕模式下只保留当前会话 */ }
  return { version: 1, enemies: [] };
}

/** 战斗中生成该敌人时记录一次遭遇（图鉴解锁）。 */
export function recordEnemySeen(type: ZombieType): void {
  if (isDeveloperMode()) return;
  const state = readState();
  if (state.enemies.includes(type)) return;
  state.enemies.push(type);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* 无痕模式下无法记录 */ }
}

/** 该敌人是否已在图鉴中解锁。 */
export function isEnemyDiscovered(type: ZombieType): boolean {
  if (isDeveloperMode()) return true;
  return readState().enemies.includes(type);
}

/** 已解锁的敌人数（开发者模式返回全部）。 */
export function getDiscoveredEnemyCount(total: number): number {
  if (isDeveloperMode()) return total;
  return readState().enemies.length;
}

/** 清空敌人遭遇记录（清空进度用）：图鉴回到未解锁状态。 */
export function resetCodexProgress(): void {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* 无痕模式下本就没有持久化数据 */ }
}
