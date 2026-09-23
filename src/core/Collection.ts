import { ALL_LEVELS } from '../data/levels';
import { CODEX_PLANT_ORDER, PLANTS, type PlantType } from '../data/plants';
import { isTechUnlocked } from './Coins';
import { isDeveloperMode } from './DeveloperMode';
import { getLevelProgress } from './LevelProgress';

const STORAGE_KEY = 'asoul-character-collection-v1';
export const ADVANCE_COST = 6;

/**
 * 灵境币最小面额是 0.1（D 级重复兑换 0.1 ✦），因此按「一位小数」记账。
 * 0.1 在二进制浮点里无法精确表示，逐次相加会漂出 0.30000000000000004 这类脏值，
 * 所以每次写账（获得 / 消费 / 读档）都四舍五入回一位小数。
 */
export function roundStardust(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 灵境币显示文本：整数不补小数位（18 而非 18.0），小数保留一位。 */
export function formatStardust(value: number): string {
  return Number.isFinite(value) ? String(roundStardust(value)) : '∞';
}

export type CollectionRank = 0 | 1 | 2;

/**
 * 开发者模式的会话级阶位覆盖：进阶/回退只改这份内存态，
 * localStorage 全程不动。仅在开发者模式开启时参与读取，
 * 关闭开发者模式（resetSessionAdvanceRanks）或刷新页面即丢弃。
 */
const sessionRanks: Partial<Record<PlantType, CollectionRank>> = {};

/** 丢弃开发者模式的会话级阶位覆盖。 */
export function resetSessionAdvanceRanks(): void {
  for (const key of Object.keys(sessionRanks) as PlantType[]) delete sessionRanks[key];
}

/** 是否拥有Ⅱ阶进阶机制（由角色配置的Ⅱ阶特性决定）。 */
export function isAdvanceable(type: PlantType): boolean {
  return !!PLANTS[type].advanceTraits?.length;
}

interface CollectionState {
  version: 1;
  stardust: number;
  /** 当前处于 Ⅱ 阶的角色。 */
  ranks: Partial<Record<PlantType, 2>>;
  /** 曾支付过进阶费用的角色：切回 Ⅰ 阶后再进阶不重复收费。 */
  advancedPaid: Partial<Record<PlantType, true>>;
}

export interface AdvanceResult {
  ok: boolean;
  reason?: 'locked' | 'max-rank' | 'insufficient-stardust';
  stardust: number;
}

function readState(): CollectionState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CollectionState>;
      const ranks = parsed.ranks ?? {};
      // 旧存档迁移：处于 Ⅱ 阶即视为已支付过进阶费用。
      const advancedPaid: Partial<Record<PlantType, true>> = { ...(parsed.advancedPaid ?? {}) };
      for (const [id, value] of Object.entries(ranks)) {
        if (value === 2) advancedPaid[id as PlantType] = true;
      }
      return {
        version: 1,
        stardust: Math.max(0, roundStardust(parsed.stardust ?? 18)),
        ranks,
        advancedPaid,
      };
    }
  } catch { /* 无痕模式或损坏存档时回退为本局默认值。 */ }
  return { version: 1, stardust: 18, ranks: {}, advancedPaid: {} };
}

/** 该角色是否曾支付过进阶费用（切回 Ⅰ 阶后再进阶不重复收费）。 */
export function hasPaidForAdvance(type: PlantType): boolean {
  const state = readState();
  return state.advancedPaid[type] === true || state.ranks[type] === 2;
}

function writeState(state: CollectionState): void {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* 无痕模式下只保留当前会话。 */ }
}

function isFusion(type: PlantType): boolean {
  return type === 'xingkongtang' || type === 'xilanai' || type === 'jiaxinnaitang' || type === 'yigehun';
}

/** 已通关关卡决定基础角色收录；融合角色沿用现有科技树解锁条件；开发者模式直接全收录。 */
export function getCollectedPlants(): PlantType[] {
  if (isDeveloperMode()) return [...CODEX_PLANT_ORDER];
  const { unlocked } = getLevelProgress();
  const level = ALL_LEVELS[Math.max(0, Math.min(ALL_LEVELS.length - 1, unlocked - 1))];
  const campaignCollection = level?.availablePlants ?? [];
  return CODEX_PLANT_ORDER.filter((type) => isFusion(type) ? isTechUnlocked(type) : campaignCollection.includes(type));
}

export function isPlantCollected(type: PlantType): boolean {
  return getCollectedPlants().includes(type);
}

export function getCollectionRank(type: PlantType): CollectionRank {
  // 开发者模式的会话覆盖优先：进阶预览不落盘，但界面/装备槽/战斗都能看到。
  if (isDeveloperMode()) {
    const overlay = sessionRanks[type];
    if (overlay !== undefined) return overlay;
  }
  if (!isPlantCollected(type)) return 0;
  if (!isAdvanceable(type)) return 1;
  return readState().ranks[type] === 2 ? 2 : 1;
}

/** 灵境币余额；开发者模式显示固定 9999（消费仍不走账，避免改写正常存档）。 */
export function getStardust(): number {
  if (isDeveloperMode()) return 9999;
  return readState().stardust;
}

/** 清空角色收藏存档（清空进度用）：灵境币与进阶状态回到初始值。 */
export function resetCollection(): void {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* 无痕模式下本就没有持久化数据 */ }
}

/** Ⅱ 阶切回 Ⅰ 阶：免费撤销进阶状态，随时可再次进阶。开发者模式只改会话覆盖。 */
export function revertPlant(type: PlantType): AdvanceResult {
  if (isDeveloperMode()) {
    if (!isAdvanceable(type) || getCollectionRank(type) !== 2) {
      return { ok: false, reason: 'max-rank', stardust: getStardust() };
    }
    sessionRanks[type] = 1;
    return { ok: true, stardust: getStardust() };
  }
  const state = readState();
  if (!isPlantCollected(type)) return { ok: false, reason: 'locked', stardust: state.stardust };
  if (!isAdvanceable(type) || state.ranks[type] !== 2) return { ok: false, reason: 'max-rank', stardust: state.stardust };
  delete state.ranks[type];
  writeState(state);
  return { ok: true, stardust: state.stardust };
}

/** 每场普通战役结算提供进阶材料；重复装备兑换也走这里，故支持小数。开发者模式不写真实余额。 */
export function awardStardust(amount: number): number {
  if (isDeveloperMode()) return getStardust();
  const state = readState();
  state.stardust = roundStardust(state.stardust + Math.max(0, amount));
  writeState(state);
  return state.stardust;
}

/** 扣减灵境币（进阶与藏品采购共用）；余额不足时不扣减并返回 false。开发者模式不校验。 */
export function spendStardust(amount: number): boolean {
  if (isDeveloperMode()) return true;
  const state = readState();
  if (state.stardust < amount) return false;
  state.stardust = roundStardust(state.stardust - amount);
  writeState(state);
  return true;
}

export function advancePlant(type: PlantType): AdvanceResult {
  if (isDeveloperMode()) {
    // 开发者模式：只写会话级覆盖，Ⅱ阶形态与双装备槽本会话内可预览，存档零写入。
    if (!isAdvanceable(type) || getCollectionRank(type) === 2) {
      return { ok: false, reason: 'max-rank', stardust: getStardust() };
    }
    sessionRanks[type] = 2;
    return { ok: true, stardust: getStardust() };
  }
  const state = readState();
  if (!isPlantCollected(type)) return { ok: false, reason: 'locked', stardust: state.stardust };
  if (!isAdvanceable(type) || state.ranks[type] === 2) return { ok: false, reason: 'max-rank', stardust: state.stardust };
  // 曾支付过进阶费用的角色再次进阶免费；仅首次收费。
  if (state.advancedPaid[type] === true) {
    state.ranks[type] = 2;
    writeState(state);
    return { ok: true, stardust: state.stardust };
  }
  if (state.stardust < ADVANCE_COST) return { ok: false, reason: 'insufficient-stardust', stardust: state.stardust };
  state.stardust = roundStardust(state.stardust - ADVANCE_COST);
  state.advancedPaid[type] = true;
  state.ranks[type] = 2;
  writeState(state);
  return { ok: true, stardust: state.stardust };
}
