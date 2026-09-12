import { getCollectionRank, isPlantCollected } from './Collection';
import { RELIC_ORDER, RELICS, type RelicConfig, type RelicEffects, type RelicId, type RelicRarity } from '../data/relics';
import type { PlantType } from '../data/plants';
import { isDeveloperMode } from './DeveloperMode';

/**
 * 枝江藏品的持有、装配与抽卡状态。
 * 藏品只能通过「抽卡转盘」获得：消耗星愿徽记或答题赢得的抽奖券。
 * 装配关系为「藏品 → 角色」的单向映射：一件藏品同一时间只能交给一名角色，
 * 一名角色同一时间也只能持有一件藏品（装配新藏品会自动归还原有藏品） */
const STORAGE_KEY = 'asoul-relic-inventory-v1';

/** 星愿徽记抽卡定价（答题券抽卡固定消耗 1 张）。 */
export const RELIC_DRAW_STARDUST_COST = 3;

/** 抽卡时各稀有度的权重：稀有更容易出，传说最稀有。 */
export const RARITY_DRAW_WEIGHT: Record<RelicRarity, number> = { rare: 45, epic: 35, legend: 20 };

interface RelicState {
  version: 1;
  owned: RelicId[];
  equipped: Partial<Record<RelicId, PlantType>>;
  /** 答题奖励的抽奖券张数。 */
  tickets: number;
}

export interface RelicDrawResult {
  ok: boolean;
  reason?: 'all-collected';
  relic?: RelicConfig;
}

function readState(): RelicState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RelicState>;
      const owned = Array.isArray(parsed.owned) ? parsed.owned.filter((id) => id in RELICS) : [];
      return {
        version: 1,
        owned,
        equipped: parsed.equipped ?? {},
        tickets: Math.max(0, Math.floor(parsed.tickets ?? 0)),
      };
    }
  } catch { /* 无痕模式或损坏存档时回退为本局默认值。 */ }
  return { version: 1, owned: [], equipped: {}, tickets: 0 };
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

/** 答题抽奖券余额；开发者模式不限量。 */
export function getDrawTickets(): number {
  if (isDeveloperMode()) return Number.POSITIVE_INFINITY;
  return readState().tickets;
}

/** 答题达标（10 题对 8 题）后的奖励入账。 */
export function awardDrawTickets(amount: number): number {
  const state = readState();
  state.tickets += Math.max(0, Math.floor(amount));
  writeState(state);
  return state.tickets;
}

/** 消耗一张答题抽奖券；不足返回 false。 */
export function consumeDrawTicket(): boolean {
  const state = readState();
  if (!isDeveloperMode()) {
    if (state.tickets < 1) return false;
    state.tickets -= 1;
    writeState(state);
  }
  return true;
}

/** 从未持有的藏品中按稀有度权重随机抽取；全部集齐返回 null。 */
export function drawRandomRelic(): RelicConfig | null {
  const owned = new Set(getOwnedRelics());
  const pool = RELIC_ORDER.filter((id) => !owned.has(id)).map((id) => RELICS[id]);
  if (pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, relic) => sum + RARITY_DRAW_WEIGHT[relic.rarity], 0);
  let roll = Math.random() * totalWeight;
  for (const relic of pool) {
    roll -= RARITY_DRAW_WEIGHT[relic.rarity];
    if (roll <= 0) {
      const state = readState();
      if (!state.owned.includes(relic.id)) state.owned.push(relic.id);
      writeState(state);
      return relic;
    }
  }
  return pool[pool.length - 1];
}

/** 该藏品当前装配在哪名角色身上。 */
export function getRelicHolder(id: RelicId): PlantType | null {
  const holder = readState().equipped[id];
  return holder ?? null;
}

/** 角色当前装配的全部藏品（Ⅰ阶1件、Ⅱ阶2件）；未装配返回空数组。战斗侧经 getRelicEffects 消费同一份数据。 */
export function getEquippedRelics(type: PlantType): RelicConfig[] {
  const { equipped } = readState();
  const result: RelicConfig[] = [];
  for (const id of Object.keys(equipped) as RelicId[]) {
    if (equipped[id] === type) result.push(RELICS[id]);
  }
  return result;
}

/** 角色当前装配的第一件藏品配置（兼容旧接口）；未装配返回 null。 */
export function getEquippedRelic(type: PlantType): RelicConfig | null {
  return getEquippedRelics(type)[0] ?? null;
}

/** 战斗侧入口：返回该角色由藏品带来的数值加成（多藏品叠加）。 */
export function getRelicEffects(type: PlantType): RelicEffects | null {
  const relics = getEquippedRelics(type);
  if (relics.length === 0) return null;
  const merged: RelicEffects = {};
  for (const relic of relics) {
    const e = relic.effects;
    if (e.hpRegenPerSec) merged.hpRegenPerSec = (merged.hpRegenPerSec ?? 0) + e.hpRegenPerSec;
    if (e.hpMultiplier) merged.hpMultiplier = (merged.hpMultiplier ?? 1) * e.hpMultiplier;
    if (e.damageMultiplier) merged.damageMultiplier = (merged.damageMultiplier ?? 1) * e.damageMultiplier;
    if (e.attackSpeedMultiplier) merged.attackSpeedMultiplier = (merged.attackSpeedMultiplier ?? 1) * e.attackSpeedMultiplier;
    if (e.produceBonus) merged.produceBonus = (merged.produceBonus ?? 0) + e.produceBonus;
  }
  return merged;
}

export function unequipRelic(id: RelicId): void {
  const state = readState();
  if (!state.equipped[id]) return;
  delete state.equipped[id];
  writeState(state);
}

/** 装配藏品：要求已持有、角色已收录且在可装配名单内；角色原持有藏品会被自动归还。 */
export function equipRelic(id: RelicId, type: PlantType): boolean {
  if (!isRelicOwned(id)) return false;
  const config = RELICS[id];
  if (config.allowedTypes && !config.allowedTypes.includes(type)) return false;
  if (!isPlantCollected(type)) return false;
  const state = readState();
  // 若该角色已装配此藏品，直接成功（幂等）
  if (state.equipped[id] === type) return true;
  // 检查角色当前装配数量是否已达上限（Ⅰ阶1件、Ⅱ阶2件）
  const currentCount = Object.values(state.equipped).filter((t) => t === type).length;
  const maxSlots = getCollectionRank(type) >= 2 ? 2 : 1;
  if (currentCount >= maxSlots) return false;
  state.equipped[id] = type;
  writeState(state);
  return true;
}
