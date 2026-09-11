import type { PlantType } from '../data/plants';
import { getCollectionRank } from './Collection';

export type UnitRank = 0 | 1 | 2;

export interface BattleSession {
  mode: 'campaign' | 'rogue';
  rogueNodeId?: string;
  unitRanks?: Partial<Record<PlantType, UnitRank>>;
}

export const CAMPAIGN_BATTLE: BattleSession = { mode: 'campaign' };

export function getUnitRank(session: BattleSession, type: PlantType): UnitRank {
  if (session.mode === 'campaign') return getCollectionRank(type);
  return session.unitRanks?.[type] ?? 0;
}
