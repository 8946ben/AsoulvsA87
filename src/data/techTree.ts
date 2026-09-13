import type { PlantType } from './plants';

export interface TechNode {
  /** 解锁后允许融合的产物。 */
  id: PlantType;
  /** 解锁所需灵境币。 */
  cost: number;
  /** 前置节点，全部解锁后才可购买。 */
  requires?: PlantType[];
}

/** 融合科技树：二重融合 → 三重融合（一个魂需集齐全部二重配方）。 */
export const TECH_NODES: TechNode[] = [
  { id: 'xingkongtang', cost: 18 },
  { id: 'xilanai', cost: 18 },
  { id: 'jiaxinnaitang', cost: 18 },
  { id: 'yigehun', cost: 30, requires: ['xingkongtang', 'xilanai', 'jiaxinnaitang'] },
];

export function getTechNode(id: PlantType): TechNode | undefined {
  return TECH_NODES.find((node) => node.id === id);
}
