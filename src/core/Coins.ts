import type { PlantType } from '../data/plants';
import { getTechNode } from '../data/techTree';
import { isDeveloperMode } from './DeveloperMode';

const COIN_KEY = 'asoul-coins-v1';
const TECH_KEY = 'asoul-tech-tree-v1';

export function getCoins(): number {
  try {
    const value = Number.parseInt(window.localStorage.getItem(COIN_KEY) ?? '0', 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function addCoins(amount: number): number {
  const total = getCoins() + Math.max(0, Math.round(amount));
  try { window.localStorage.setItem(COIN_KEY, String(total)); } catch { /* 无痕模式下只保留本局结果 */ }
  return total;
}

function readTech(): PlantType[] {
  try {
    const raw = window.localStorage.getItem(TECH_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PlantType[]) : [];
  } catch {
    return [];
  }
}

/** 开发者模式下全部配方视为已解锁，便于测试。 */
export function isTechUnlocked(id: PlantType): boolean {
  if (isDeveloperMode()) return true;
  return readTech().includes(id);
}

/** 前置条件是否满足（不检查金币）。 */
export function techRequiresMet(id: PlantType): boolean {
  const node = getTechNode(id);
  return !node?.requires || node.requires.every((dep) => isTechUnlocked(dep));
}

/** 购买科技树节点：前置满足且金币足够才扣费生效。 */
export function unlockTech(id: PlantType): boolean {
  const node = getTechNode(id);
  if (!node || isDeveloperMode() || readTech().includes(id)) return false;
  if (!techRequiresMet(id)) return false;
  const coins = getCoins();
  if (coins < node.cost) return false;
  try {
    window.localStorage.setItem(COIN_KEY, String(coins - node.cost));
    window.localStorage.setItem(TECH_KEY, JSON.stringify([...readTech(), id]));
  } catch { /* 无痕模式下只保留本局结果 */ }
  return true;
}
