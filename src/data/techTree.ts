import type { PlantType } from './plants';

export interface TechNode {
  /** 解锁后允许融合的产物。 */
  id: PlantType;
  /** 解锁所需金币。 */
  cost: number;
  /** 前置节点，全部解锁后才可购买。 */
  requires?: PlantType[];
}

/** 通关固定金币。 */
export const COIN_PER_CLEAR = 60;
/** 每保留一辆完整小车（最终防线）的加成金币。 */
export const COIN_PER_INTACT_MOWER = 15;

/** 融合科技树：二重融合 → 三重融合（一个魂需集齐全部二重配方）。 */
export const TECH_NODES: TechNode[] = [
  { id: 'xingkongtang', cost: 120 },
  { id: 'xilanai', cost: 120 },
  { id: 'jiaxinnaitang', cost: 180 },
  { id: 'yigehun', cost: 400, requires: ['xingkongtang', 'xilanai', 'jiaxinnaitang'] },
];

export function getTechNode(id: PlantType): TechNode | undefined {
  return TECH_NODES.find((node) => node.id === id);
}
