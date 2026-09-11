import { ALL_LEVELS } from '../data/levels';
import { CODEX_PLANT_ORDER, type PlantType } from '../data/plants';
import { isTechUnlocked } from './Coins';
import { getLevelProgress } from './LevelProgress';

const STORAGE_KEY = 'asoul-character-collection-v1';
export const ADVANCE_COST = 6;

export type CollectionRank = 0 | 1 | 2;

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

/** 已通关关卡决定基础角色收录；融合角色沿用现有科技树解锁条件。 */
export function getCollectedPlants(): PlantType[] {
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
  return readState().ranks[type] === 2 ? 2 : 1;
}

export function getStardust(): number {
  return readState().stardust;
}

/** 每场普通战役结算提供进阶材料。 */
export function awardStardust(amount: number): number {
  const state = readState();
  state.stardust += Math.max(0, Math.floor(amount));
  writeState(state);
  return state.stardust;
}

export function advancePlant(type: PlantType): AdvanceResult {
  const state = readState();
  if (!isPlantCollected(type)) return { ok: false, reason: 'locked', stardust: state.stardust };
  if (state.ranks[type] === 2) return { ok: false, reason: 'max-rank', stardust: state.stardust };
  if (state.stardust < ADVANCE_COST) return { ok: false, reason: 'insufficient-stardust', stardust: state.stardust };
  state.stardust -= ADVANCE_COST;
  state.ranks[type] = 2;
  writeState(state);
  return { ok: true, stardust: state.stardust };
}
