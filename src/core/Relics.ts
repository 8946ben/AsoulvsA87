import { isPlantCollected, spendStardust } from './Collection';
import { RELIC_ORDER, RELICS, type RelicConfig, type RelicEffects, type RelicId } from '../data/relics';
import type { PlantType } from '../data/plants';
import { isDeveloperMode } from './DeveloperMode';

/**
 * 枝江藏品的持有与装配状态。
 * 装配关系为「藏品 → 角色」的单向映射：一件藏品同一时间只能交给一名角色，
 * 一名角色同一时间也只能持有一件藏品（装配新藏品会自动归还原有藏品）。
 */
const STORAGE_KEY = 'asoul-relic-inventory-v1';

interface RelicState {
  version: 1;
  owned: RelicId[];
  equipped: Partial<Record<RelicId, PlantType>>;
}

export interface RelicPurchaseResult {
  ok: boolean;
  reason?: 'already-owned' | 'insufficient-stardust';
}

export interface RelicEquipResult {
  ok: boolean;
  reason?: 'not-owned' | 'not-allowed' | 'character-locked';
}

function readState(): RelicState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RelicState>;
      const owned = Array.isArray(parsed.owned) ? parsed.owned.filter((id) => id in RELICS) : [];
      return { version: 1, owned, equipped: parsed.equipped ?? {} };
    }
  } catch { /* 无痕模式或损坏存档时回退为本局默认值。 */ }
  return { version: 1, owned: [], equipped: {} };
}

function writeState(state: RelicState): void {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* 无痕模式下只保留当前会话。 */ }
}

/** 已持有的藏品清单；开发者模式视为全收藏。 */
export function getOwnedRelics(): RelicId[] {
  if (isDeveloperMode()) return [...RELIC_ORDER];
  return readState().owned;
}

export function isRelicOwned(id: RelicId): boolean {
  return getOwnedRelics().includes(id);
}

/** 购买藏品：扣减星愿徽记（由 Collection 统一管理余额）。 */
export function purchaseRelic(id: RelicId): RelicPurchaseResult {
  if (isRelicOwned(id)) return { ok: false, reason: 'already-owned' };
  if (!spendStardust(RELICS[id].price)) return { ok: false, reason: 'insufficient-stardust' };
  const state = readState();
  if (!state.owned.includes(id)) state.owned.push(id);
  writeState(state);
  return { ok: true };
}

/** 该藏品当前装配在哪名角色身上。 */
export function getRelicHolder(id: RelicId): PlantType | null {
  const holder = readState().equipped[id];
  return holder ?? null;
}

/** 角色当前装配的藏品配置；未装配返回 null。战斗侧经 getRelicEffects 消费同一份数据。 */
export function getEquippedRelic(type: PlantType): RelicConfig | null {
  const { equipped } = readState();
  for (const id of Object.keys(equipped) as RelicId[]) {
    if (equipped[id] === type) return RELICS[id] ?? null;
  }
  return null;
}

/** 战斗侧入口：返回该角色由藏品带来的数值加成。 */
export function getRelicEffects(type: PlantType): RelicEffects | null {
  return getEquippedRelic(type)?.effects ?? null;
}

/** 归还角色身上的任意藏品（内用）。 */
function unequipFrom(state: RelicState, type: PlantType): void {
  for (const id of Object.keys(state.equipped) as RelicId[]) {
    if (state.equipped[id] === type) delete state.equipped[id];
  }
}

export function unequipRelic(id: RelicId): void {
  const state = readState();
  if (!state.equipped[id]) return;
  delete state.equipped[id];
  writeState(state);
}

/** 装配藏品：要求已持有、角色已收录且在可装配名单内；角色原持有藏品会被自动归还。 */
export function equipRelic(id: RelicId, type: PlantType): RelicEquipResult {
  if (!isRelicOwned(id)) return { ok: false, reason: 'not-owned' };
  const config = RELICS[id];
  if (config.allowedTypes && !config.allowedTypes.includes(type)) return { ok: false, reason: 'not-allowed' };
  if (!isPlantCollected(type)) return { ok: false, reason: 'character-locked' };
  const state = readState();
  unequipFrom(state, type);
  state.equipped[id] = type;
  writeState(state);
  return { ok: true };
}
