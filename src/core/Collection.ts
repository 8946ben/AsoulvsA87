import { ALL_LEVELS } from '../data/levels';
import { CODEX_PLANT_ORDER, PLANTS, type PlantType } from '../data/plants';
import { isTechUnlocked } from './Coins';
import { isDeveloperMode } from './DeveloperMode';
import { getLevelProgress } from './LevelProgress';

const STORAGE_KEY = 'asoul-character-collection-v1';
export const ADVANCE_COST = 6;

export type CollectionRank = 0 | 1 | 2;

/** 是否拥有Ⅱ阶进阶机制（由角色配置的Ⅱ阶特性决定）。 */
export function isAdvanceable(type: PlantType): boolean {
  return !!PLANTS[type].advanceTraits?.length;
}

interface CollectionState {
  version: 1;
  stardust: number;
  ranks: Partial<Record<PlantType, 2>>;
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
      return {
        version: 1,
        stardust: Math.max(0, Math.floor(parsed.stardust ?? 18)),
        ranks: parsed.ranks ?? {},
      };
    }
  } catch { /* 无痕模式或损坏存档时回退为本局默认值。 */ }
  return { version: 1, stardust: 18, ranks: {} };
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
  if (!isPlantCollected(type)) return 0;
  if (!isAdvanceable(type)) return 1;
  return readState().ranks[type] === 2 ? 2 : 1;
}

export function getStardust(): number {
  if (isDeveloperMode()) return Number.POSITIVE_INFINITY;
  return readState().stardust;
}

/** Ⅱ 阶切回 Ⅰ 阶：免费撤销进阶状态，随时可再次进阶。 */
export function revertPlant(type: PlantType): AdvanceResult {
  const state = readState();
  if (!isPlantCollected(type)) return { ok: false, reason: 'locked', stardust: state.stardust };
  if (!isAdvanceable(type) || state.ranks[type] !== 2) return { ok: false, reason: 'max-rank', stardust: state.stardust };
  delete state.ranks[type];
  writeState(state);
  return { ok: true, stardust: state.stardust };
}

/** 每场普通战役结算提供进阶材料。 */
export function awardStardust(amount: number): number {
  const state = readState();
  state.stardust += Math.max(0, Math.floor(amount));
  writeState(state);
  return state.stardust;
}

/** 扣减灵境币（进阶与藏品采购共用）；余额不足时不扣减并返回 false。开发者模式不校验。 */
export function spendStardust(amount: number): boolean {
  if (isDeveloperMode()) return true;
  const state = readState();
  if (state.stardust < amount) return false;
  state.stardust -= amount;
  writeState(state);
  return true;
}

export function advancePlant(type: PlantType): AdvanceResult {
  const state = readState();
  if (!isPlantCollected(type)) return { ok: false, reason: 'locked', stardust: state.stardust };
  if (!isAdvanceable(type) || state.ranks[type] === 2) return { ok: false, reason: 'max-rank', stardust: state.stardust };
  // 开发者模式徽记无限：不校验也不扣除存量。
  if (!isDeveloperMode()) {
    if (state.stardust < ADVANCE_COST) return { ok: false, reason: 'insufficient-stardust', stardust: state.stardust };
    state.stardust -= ADVANCE_COST;
  }
  state.ranks[type] = 2;
  writeState(state);
  return { ok: true, stardust: state.stardust };
}
