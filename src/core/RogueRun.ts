import { isTechUnlocked } from './Coins';
import type { UnitRank } from './BattleSession';
import { CODEX_PLANT_ORDER, STARTER_PLANT_ORDER, type PlantType } from '../data/plants';
import { ROGUE_RELICS, ROGUE_SQUADS, generateRogueMap, type RogueNode, type RogueRelic } from '../data/rogue';

const STORAGE_KEY = 'asoul-rogue-run-v1';

export type RogueRunStatus = 'active' | 'victory' | 'defeat';

export interface RogueRunState {
  version: 1;
  seed: number;
  status: RogueRunStatus;
  region: number;
  stageHp: number;
  maxStageHp: number;
  hope: number;
  tickets: number;
  level: number;
  xp: number;
  battlesWon: number;
  nodesCleared: number;
  unitRanks: Partial<Record<PlantType, UnitRank>>;
  relicIds: string[];
  nodes: RogueNode[];
  activeNodeId: string | null;
  rewardPending: boolean;
  rewardStage?: 'overview' | 'relic' | 'recruit';
  recruitCounter: number;
}

export interface RogueCombatModifiers { startingSunBonus: number; plantHpMultiplier: number; }

export interface RecruitOffer { type: PlantType; nextRank: 1 | 2; cost: number; }

export function createRogueRun(squadId: string, seed = Date.now() >>> 0): RogueRunState {
  const squad = ROGUE_SQUADS.find((entry) => entry.id === squadId) ?? ROGUE_SQUADS[0];
  const unitRanks: Partial<Record<PlantType, UnitRank>> = {};
  for (const type of squad.units) unitRanks[type] = 1;
  const state: RogueRunState = {
    version: 1, seed, status: 'active', region: 1, stageHp: 12, maxStageHp: 12,
    hope: 8, tickets: 4, level: 1, xp: 0, battlesWon: 0, nodesCleared: 0,
    unitRanks, relicIds: [], nodes: generateRogueMap(seed), activeNodeId: null,
    rewardPending: false, rewardStage: undefined, recruitCounter: 0,
  };
  saveRogueRun(state);
  return state;
}

export function loadRogueRun(): RogueRunState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RogueRunState;
    if (parsed.version !== 1 || !Array.isArray(parsed.nodes)) return null;
    // 兼容旧开发存档：原“公开招募/收藏品”专用节点统一迁移为偶遇节点。
    for (const node of parsed.nodes) {
      const legacyType = (node as unknown as { type: string }).type;
      if (legacyType === 'recruit' || legacyType === 'relic') node.type = 'encounter';
    }
    if (parsed.rewardPending && !parsed.rewardStage) parsed.rewardStage = 'overview';
    return parsed;
  } catch { return null; }
}

export function saveRogueRun(state: RogueRunState): void {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* 无痕模式下无法续局 */ }
}

export function abandonRogueRun(): void {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function getActiveRogueNode(state: RogueRunState): RogueNode | null {
  return state.nodes.find((node) => node.id === state.activeNodeId) ?? null;
}

export function beginRogueNode(state: RogueRunState, nodeId: string): RogueNode | null {
  const node = state.nodes.find((candidate) => candidate.id === nodeId);
  if (!node || node.status !== 'available' || node.region !== state.region) return null;
  for (const peer of state.nodes) if (peer.region === node.region && peer.column === node.column && peer.status === 'available') peer.status = 'skipped';
  node.status = 'active'; state.activeNodeId = node.id; saveRogueRun(state); return node;
}

/** 从战前选卡、暂停页或异常退出返回地图时，把尚未结算的节点恢复为可选。 */
export function recoverActiveRogueNode(state: RogueRunState): void {
  const node = getActiveRogueNode(state);
  if (!node) return;
  node.status = 'available'; state.activeNodeId = null; saveRogueRun(state);
}

function addXp(state: RogueRunState, amount: number): void {
  state.xp += amount;
  while (state.xp >= state.level * 4) {
    state.xp -= state.level * 4; state.level += 1; state.hope += 2;
  }
}

function finishActiveNode(state: RogueRunState): void {
  const node = getActiveRogueNode(state);
  if (!node) return;
  node.status = 'cleared'; state.nodesCleared += 1; state.activeNodeId = null;
  if (node.type === 'boss') {
    if (state.region >= 3) state.status = 'victory';
    else {
      state.region += 1;
      if (state.relicIds.includes('warm-soup')) state.stageHp = Math.min(state.maxStageHp, state.stageHp + 2);
      for (const next of state.nodes) if (next.region === state.region && next.column === 0) next.status = 'available';
    }
  } else {
    for (const id of node.edges) {
      const next = state.nodes.find((candidate) => candidate.id === id);
      if (next?.status === 'locked') next.status = 'available';
    }
  }
}

export function resolveRogueBattle(state: RogueRunState, win: boolean): RogueRunState {
  const node = getActiveRogueNode(state);
  if (!node) return state;
  if (win) {
    state.battlesWon += 1;
    state.tickets += 3 + (node.type === 'emergency' ? 2 : 0) + (node.type === 'boss' ? 3 : 0) + (state.relicIds.includes('tour-coupon') ? 2 : 0);
    state.hope += node.type === 'boss' ? 3 : 1;
    addXp(state, 2 + (node.type === 'emergency' ? 1 : 0) + (state.relicIds.includes('encore') ? 1 : 0));
    state.rewardPending = true; state.rewardStage = 'overview';
  } else {
    state.stageHp -= node.type === 'boss' ? 5 : node.type === 'emergency' ? 4 : 3;
    if (state.stageHp <= 0) { state.stageHp = 0; state.status = 'defeat'; }
  }
  finishActiveNode(state); saveRogueRun(state); return state;
}

export function resolveUtilityNode(state: RogueRunState): void {
  finishActiveNode(state); saveRogueRun(state);
}

export function getOwnedBattlePlants(state: RogueRunState): PlantType[] {
  return STARTER_PLANT_ORDER.filter((type) => (state.unitRanks[type] ?? 0) > 0);
}

const ADVANCED_TYPES = new Set<PlantType>(['bella', 'eileen', 'diana', 'gladys', 'fiona', 'xingkongtang', 'xilanai', 'jiaxinnaitang', 'yigehun']);

export function maxRecruitRank(type: PlantType): 1 | 2 { return ADVANCED_TYPES.has(type) ? 2 : 1; }

function fusionEligible(state: RogueRunState, type: PlantType): boolean {
  if (!isTechUnlocked(type)) return false;
  const owned = (plant: PlantType): boolean => (state.unitRanks[plant] ?? 0) > 0;
  if (type === 'xingkongtang') return owned('beijixing') && owned('jiaxintang');
  if (type === 'xilanai') return owned('beijixing') && owned('naiqilin');
  if (type === 'jiaxinnaitang') return owned('naiqilin') && owned('jiaxintang');
  if (type === 'yigehun') return owned('beijixing') && owned('naiqilin') && owned('jiaxintang');
  return true;
}

function offerCost(state: RogueRunState, type: PlantType, nextRank: 1 | 2): number {
  const fusion = !STARTER_PLANT_ORDER.includes(type);
  const base = fusion ? 5 : ['bella', 'eileen', 'diana', 'gladys', 'fiona'].includes(type) ? 4 : 2;
  return Math.max(1, base + (nextRank === 2 ? 1 : 0) - (state.relicIds.includes('fan-club') ? 1 : 0));
}

function hash(seed: number, salt: number): number {
  let value = (seed ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return value >>> 0;
}

export function getRecruitOffers(state: RogueRunState, count = 3): RecruitOffer[] {
  const candidates = CODEX_PLANT_ORDER.filter((type) => {
    const rank = state.unitRanks[type] ?? 0;
    return rank < maxRecruitRank(type) && (STARTER_PLANT_ORDER.includes(type) || fusionEligible(state, type));
  }).map((type) => {
    const nextRank = ((state.unitRanks[type] ?? 0) + 1) as 1 | 2;
    return { type, nextRank, cost: offerCost(state, type, nextRank) };
  });
  return candidates.sort((a, b) => hash(state.seed, state.recruitCounter * 97 + CODEX_PLANT_ORDER.indexOf(a.type)) - hash(state.seed, state.recruitCounter * 97 + CODEX_PLANT_ORDER.indexOf(b.type))).slice(0, count);
}

export function recruitUnit(state: RogueRunState, offer: RecruitOffer): boolean {
  if (state.hope < offer.cost || (state.unitRanks[offer.type] ?? 0) + 1 !== offer.nextRank) return false;
  state.hope -= offer.cost; state.unitRanks[offer.type] = offer.nextRank; state.recruitCounter += 1; saveRogueRun(state); return true;
}

export function skipRecruit(state: RogueRunState): void { state.recruitCounter += 1; saveRogueRun(state); }

export function getRelics(state: RogueRunState): RogueRelic[] { return state.relicIds.map((id) => ROGUE_RELICS.find((relic) => relic.id === id)).filter((relic): relic is RogueRelic => Boolean(relic)); }

export function getRelicOffers(state: RogueRunState, count = 3): RogueRelic[] {
  return ROGUE_RELICS.filter((relic) => !state.relicIds.includes(relic.id))
    .sort((a, b) => hash(state.seed, state.nodesCleared * 131 + ROGUE_RELICS.indexOf(a)) - hash(state.seed, state.nodesCleared * 131 + ROGUE_RELICS.indexOf(b))).slice(0, count);
}

export function grantRelic(state: RogueRunState, relicId: string): boolean {
  if (state.relicIds.includes(relicId) || !ROGUE_RELICS.some((relic) => relic.id === relicId)) return false;
  state.relicIds.push(relicId);
  if (relicId === 'emergency-kit') { state.maxStageHp += 3; state.stageHp = Math.min(state.maxStageHp, state.stageHp + 3); }
  saveRogueRun(state); return true;
}

/** 战后奖励不是三选一：先统一领取生命恢复，再依次结算收藏品和招募。 */
export function beginBattleRewards(state: RogueRunState): boolean {
  if (!state.rewardPending || state.rewardStage !== 'overview') return false;
  state.stageHp = Math.min(state.maxStageHp, state.stageHp + 3);
  state.rewardStage = 'relic'; saveRogueRun(state); return true;
}

export function advanceBattleRewardsToRecruit(state: RogueRunState): boolean {
  if (!state.rewardPending || state.rewardStage !== 'relic') return false;
  state.rewardStage = 'recruit'; saveRogueRun(state); return true;
}

export function finishBattleRewards(state: RogueRunState): boolean {
  if (!state.rewardPending || state.rewardStage !== 'recruit') return false;
  state.rewardPending = false; state.rewardStage = undefined; saveRogueRun(state); return true;
}

export function getRogueCombatModifiers(state: RogueRunState): RogueCombatModifiers {
  return {
    startingSunBonus: (state.relicIds.includes('opening-light') ? 50 : 0) + (state.relicIds.includes('full-house') ? 75 : 0),
    plantHpMultiplier: state.relicIds.includes('sturdy-stage') ? 1.2 : 1,
  };
}

export function spendTickets(state: RogueRunState, amount: number): boolean {
  if (state.tickets < amount) return false;
  state.tickets -= amount; saveRogueRun(state); return true;
}
