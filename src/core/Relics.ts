import { awardStardust, getCollectionRank, isPlantCollected } from './Collection';
import { RELIC_ORDER, RELICS, type RelicConfig, type RelicEffects, type RelicId, type RelicRarity } from '../data/relics';
import type { PlantType } from '../data/plants';
import { isDeveloperMode } from './DeveloperMode';

/**
 * 枝江装备的持有、装配与抽卡状态。
 * 藏品只能通过「抽卡转盘」获得：消耗灵境币或答题赢得的抽奖券。
 * 装配关系为「藏品 → 角色」的单向映射：一件藏品同一时间只能交给一名角色，
 * 一名角色同一时间也只能持有一件藏品（装配新藏品会自动归还原有藏品） */
const STORAGE_KEY = 'asoul-relic-inventory-v1';

/** 灵境币抽卡定价（答题券抽卡固定消耗 1 张）。 */
export const RELIC_DRAW_STARDUST_COST = 3;

/** 抽卡各稀有度概率（%）：S 2% / A 8% / B 20% / C 40% / D 30%，合计 100。 */
export const RARITY_DRAW_WEIGHT: Record<RelicRarity, number> = { s: 2, a: 8, b: 20, c: 40, d: 30 };

/** 重复获得藏品时按稀有度兑换的灵境币。 */
export const RARITY_DUPLICATE_REFUND: Record<RelicRarity, number> = { s: 15, a: 8, b: 4, c: 2, d: 1 };

interface RelicState {
  version: 1;
  owned: RelicId[];
  equipped: Partial<Record<RelicId, PlantType>>;
  /** 答题奖励的抽奖券张数。 */
  tickets: number;
}

export interface RelicDrawResult {
  ok: boolean;
  relic: RelicConfig;
  /** true 表示重复获得：不再入库，已自动兑换灵境币。 */
  duplicate: boolean;
  /** 重复兑换获得的灵境币数量。 */
  refund: number;
}

function readState(): RelicState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RelicState>;
      const owned = Array.isArray(parsed.owned) ? parsed.owned.filter((id) => id in RELICS) : [];
      // 版本更迭后已下架的装备不再出现在存档引用中。
      const equipped: Partial<Record<RelicId, PlantType>> = {};
      for (const [id, holder] of Object.entries(parsed.equipped ?? {})) {
        if (id in RELICS) equipped[id as RelicId] = holder as PlantType;
      }
      return {
        version: 1,
        owned,
        equipped,
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

/**
 * 放回抽取：每次都从完整奖池按稀有度概率随机，奖池永不枯竭。
 * 每件藏品仅可入库一次；重复获得时自动按稀有度兑换灵境币（S15/A8/B4/C2/D1）。
 */
export function drawRandomRelic(): RelicDrawResult {
  const totalWeight = RELIC_ORDER.reduce((sum, id) => sum + RARITY_DRAW_WEIGHT[RELICS[id].rarity], 0);
  let roll = Math.random() * totalWeight;
  let picked = RELICS[RELIC_ORDER[RELIC_ORDER.length - 1]];
  for (const id of RELIC_ORDER) {
    roll -= RARITY_DRAW_WEIGHT[RELICS[id].rarity];
    if (roll <= 0) {
      picked = RELICS[id];
      break;
    }
  }
  const state = readState();
  if (state.owned.includes(picked.id)) {
    const refund = RARITY_DUPLICATE_REFUND[picked.rarity];
    awardStardust(refund);
    return { ok: true, relic: picked, duplicate: true, refund };
  }
  state.owned.push(picked.id);
  writeState(state);
  return { ok: true, relic: picked, duplicate: false, refund: 0 };
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

/** 合并多份效果（倍率相乘、增量相加、布尔取或）。 */
export function mergeRelicEffects(list: RelicEffects[]): RelicEffects {
  const merged: RelicEffects = {};
  const apply = (effects: RelicEffects): void => {
    if (effects.hpRegenPerSec) merged.hpRegenPerSec = (merged.hpRegenPerSec ?? 0) + effects.hpRegenPerSec;
    if (effects.hpMultiplier) merged.hpMultiplier = (merged.hpMultiplier ?? 1) * effects.hpMultiplier;
    if (effects.damageMultiplier) merged.damageMultiplier = (merged.damageMultiplier ?? 1) * effects.damageMultiplier;
    if (effects.attackSpeedMultiplier) merged.attackSpeedMultiplier = (merged.attackSpeedMultiplier ?? 1) * effects.attackSpeedMultiplier;
    if (effects.produceBonus) merged.produceBonus = (merged.produceBonus ?? 0) + effects.produceBonus;
    if (effects.costMultiplier) merged.costMultiplier = (merged.costMultiplier ?? 1) * effects.costMultiplier;
    if (effects.extraShots) merged.extraShots = (merged.extraShots ?? 0) + effects.extraShots;
    if (effects.creamStunMultiplier) merged.creamStunMultiplier = (merged.creamStunMultiplier ?? 1) * effects.creamStunMultiplier;
    if (effects.cooldownMultiplier) merged.cooldownMultiplier = (merged.cooldownMultiplier ?? 1) * effects.cooldownMultiplier;
    if (effects.eileenSpikeDamageMultiplier) merged.eileenSpikeDamageMultiplier = (merged.eileenSpikeDamageMultiplier ?? 1) * effects.eileenSpikeDamageMultiplier;
    if (effects.eileenSpikeAreaNine) merged.eileenSpikeAreaNine = true;
    if (effects.eileenBeamBidirectional) merged.eileenBeamBidirectional = true;
    if (effects.eileenBeamTripleRow) merged.eileenBeamTripleRow = true;
    if (effects.grants) merged.grants = [...(merged.grants ?? []), ...effects.grants];
  };
  for (const effects of list) apply(effects);
  return merged;
}

/** 战斗侧入口：返回该角色由装备带来的数值加成（多装备叠加，支持联合装配）。
 *  extra 用于部署时追加的条件增援效果（见装备的 grants 字段）。 */
export function getRelicEffects(type: PlantType, extra?: RelicEffects): RelicEffects | null {
  const relics = getEquippedRelics(type);
  if (relics.length === 0 && !extra) return null;
  const merged: RelicEffects = {};
  const apply = (effects: RelicEffects): void => {
    if (effects.hpRegenPerSec) merged.hpRegenPerSec = (merged.hpRegenPerSec ?? 0) + effects.hpRegenPerSec;
    if (effects.hpMultiplier) merged.hpMultiplier = (merged.hpMultiplier ?? 1) * effects.hpMultiplier;
    if (effects.damageMultiplier) merged.damageMultiplier = (merged.damageMultiplier ?? 1) * effects.damageMultiplier;
    if (effects.attackSpeedMultiplier) merged.attackSpeedMultiplier = (merged.attackSpeedMultiplier ?? 1) * effects.attackSpeedMultiplier;
    if (effects.produceBonus) merged.produceBonus = (merged.produceBonus ?? 0) + effects.produceBonus;
    if (effects.costMultiplier) merged.costMultiplier = (merged.costMultiplier ?? 1) * effects.costMultiplier;
    if (effects.extraShots) merged.extraShots = (merged.extraShots ?? 0) + effects.extraShots;
    if (effects.creamStunMultiplier) merged.creamStunMultiplier = (merged.creamStunMultiplier ?? 1) * effects.creamStunMultiplier;
    if (effects.cooldownMultiplier) merged.cooldownMultiplier = (merged.cooldownMultiplier ?? 1) * effects.cooldownMultiplier;
    if (effects.eileenSpikeDamageMultiplier) merged.eileenSpikeDamageMultiplier = (merged.eileenSpikeDamageMultiplier ?? 1) * effects.eileenSpikeDamageMultiplier;
    if (effects.eileenSpikeAreaNine) merged.eileenSpikeAreaNine = true;
    if (effects.eileenBeamBidirectional) merged.eileenBeamBidirectional = true;
    if (effects.eileenBeamTripleRow) merged.eileenBeamTripleRow = true;
    if (effects.grants) merged.grants = [...(merged.grants ?? []), ...effects.grants];
  };
  const relicIds = new Set(relics.map((r) => r.id));
  for (const relic of relics) {
    // 检查联合装配：若联动装备也已装配，使用联合效果
    let effects = relic.effects;
    if (relic.synergy && relicIds.has(relic.synergy.with)) {
      effects = relic.synergy.effects;
    }
    apply(effects);
  }
  if (extra) apply(extra);
  return merged;
}

/** 检查角色是否同时装配了指定两件藏品（联合装配）。 */
export function hasRelicSynergy(type: PlantType, relicA: RelicId, relicB: RelicId): boolean {
  const relics = getEquippedRelics(type);
  const ids = new Set(relics.map((r) => r.id));
  return ids.has(relicA) && ids.has(relicB);
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
