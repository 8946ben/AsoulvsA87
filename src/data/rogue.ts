import type { LevelConfig, Wave, ZombieSpawnEntry } from './levels';
import { PLANTS, STARTER_PLANT_ORDER, type PlantType } from './plants';
import type { ZombieType } from './zombies';

export type RogueNodeType = 'battle' | 'emergency' | 'boss' | 'encounter' | 'rest' | 'trader';
export type RogueNodeStatus = 'locked' | 'available' | 'active' | 'cleared' | 'skipped';

export interface RogueNode {
  id: string;
  region: number;
  column: number;
  row: number;
  type: RogueNodeType;
  status: RogueNodeStatus;
  edges: string[];
}

export interface RogueRelic {
  id: string;
  name: string;
  description: string;
  accent: number;
}

export const ROGUE_REGIONS = [
  { name: '花园前厅', subtitle: '清风仍在，白虫初现', accent: 0x66d2b1 },
  { name: '暮色街区', subtitle: '热点与路障挤满巡演路线', accent: 0x8c9fe8 },
  { name: '星光主舞台', subtitle: '在最终返场守住最后的生命值', accent: 0xf08faf },
] as const;

export const ROGUE_RELICS: RogueRelic[] = [
  { id: 'opening-light', name: '开场灯牌', description: '每场战斗初始应援值 +50', accent: 0xffca68 },
  { id: 'full-house', name: '全场应援', description: '每场战斗初始应援值再 +75', accent: 0xff8cb4 },
  { id: 'sturdy-stage', name: '加固舞台', description: '部署角色的最大生命与当前生命 +20%', accent: 0x63d9c5 },
  { id: 'tour-coupon', name: '巡演折扣券', description: '战斗胜利额外获得 2 张门票', accent: 0x67bceb },
  { id: 'warm-soup', name: '夜宵热汤', description: '进入新区域时恢复 2 点生命值', accent: 0xff9b6a },
  { id: 'fan-club', name: '应援会名册', description: '招募与进阶所需应援值 -1（最低 1）', accent: 0xb795ea },
  { id: 'encore', name: '返场彩带', description: '战斗胜利额外获得 1 点经验', accent: 0x71d79a },
  { id: 'emergency-kit', name: '舞台急救箱', description: '获得时生命值上限 +3，并恢复 3 点', accent: 0xf07084 },
];

export const ROGUE_SQUADS = [
  { id: 'sweet-start', name: '甜蜜开场', desc: '稳定产能、直线输出与坚实阻挡', units: ['beijixing', 'jiaxintang', 'xiaohainuo'] as PlantType[] },
  { id: 'dessert-line', name: '甜点防线', desc: '奶油控制配合产能与高耐久前排', units: ['beijixing', 'naiqilin', 'xiaohainuo'] as PlantType[] },
  { id: 'idol-scout', name: '偶像先遣', desc: '以贝拉的变阵能力应对第一区域', units: ['beijixing', 'jiaxintang', 'bella'] as PlantType[] },
] as const;

export const NODE_LABELS: Record<RogueNodeType, { name: string; symbol: string; color: number; desc: string }> = {
  battle: { name: '普通演出', symbol: '♪', color: 0x62cae8, desc: '完成一场常规防守战' },
  emergency: { name: '紧急演出', symbol: '!!', color: 0xe66b8f, desc: '更密集的敌人，奖励也更好' },
  boss: { name: '区域终演', symbol: '★', color: 0xf0a34e, desc: '击败区域首领，前往下一幕' },
  encounter: { name: '偶遇', symbol: '?', color: 0xa58de4, desc: '枝江路上的随机选择' },
  rest: { name: '休整', symbol: 'Z', color: 0x72b7d7, desc: '恢复生命值或整理资源' },
  trader: { name: '枝江小铺', symbol: '$', color: 0xe9916f, desc: '用门票换取帮助' },
};

function hash(seed: number, salt: number): number {
  let value = (seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

export function generateRogueMap(seed: number): RogueNode[] {
  const nodes: RogueNode[] = [];
  const rowCounts = [2, 3, 2, 3, 1];
  const pools: RogueNodeType[][] = [
    ['battle', 'battle', 'encounter', 'encounter'],
    ['battle', 'encounter', 'battle', 'rest'],
    ['battle', 'emergency', 'encounter'],
    ['battle', 'trader', 'rest', 'encounter', 'encounter'],
  ];
  for (let region = 1; region <= ROGUE_REGIONS.length; region++) {
    for (let column = 0; column < rowCounts.length; column++) {
      for (let row = 0; row < rowCounts[column]; row++) {
        const id = `r${region}-c${column}-n${row}`;
        const pool = pools[column] ?? ['boss'];
        const type: RogueNodeType = column === rowCounts.length - 1 ? 'boss' : pool[Math.floor(hash(seed + region * 97, column * 17 + row) * pool.length)];
        nodes.push({ id, region, column, row, type, status: region === 1 && column === 0 ? 'available' : 'locked', edges: [] });
      }
    }
  }
  for (const node of nodes) {
    if (node.column >= rowCounts.length - 1) continue;
    const next = nodes.filter((candidate) => candidate.region === node.region && candidate.column === node.column + 1);
    const scaled = next.length === 1 ? 0 : node.row * (next.length - 1) / Math.max(1, rowCounts[node.column] - 1);
    node.edges = next.filter((_candidate, index) => Math.abs(index - scaled) <= 1.05).map((candidate) => candidate.id);
    if (node.edges.length === 0) node.edges = [next[Math.round(scaled)].id];
  }
  return nodes;
}

const REGION_ENEMIES: ZombieType[][] = [
  ['basic', 'cone', 'phone', 'screen'],
  ['basic', 'ladder', 'balloon', 'football', 'bucket'],
  ['screen', 'football', 'sled', 'miner', 'pole', 'bucket'],
];

const REGION_BOSSES: ZombieType[] = ['bucket', 'sled', 'dragon'];

function spawn(type: ZombieType, count: number, gap: number): ZombieSpawnEntry { return { type, count, gap }; }

export function createRogueBattleLevel(node: RogueNode, roster: PlantType[], seed: number): LevelConfig {
  const regionIndex = node.region - 1;
  const pool = REGION_ENEMIES[regionIndex];
  const elite = node.type === 'emergency';
  const boss = node.type === 'boss';
  const waveCount = boss ? 5 : 3 + regionIndex + (elite ? 1 : 0);
  const waves: Wave[] = [];
  for (let index = 0; index < waveCount; index++) {
    const primary = pool[Math.floor(hash(seed, node.region * 301 + node.column * 43 + index) * pool.length)];
    const count = 2 + node.region + index + (elite ? 2 : 0);
    const spawns: ZombieSpawnEntry[] = [spawn(primary, count, Math.max(1150, 2600 - node.region * 260 - index * 120))];
    if (index > 0) spawns.push(spawn(pool[(pool.indexOf(primary) + 1 + index) % pool.length], Math.max(1, Math.floor(count / 2)), 2400));
    if (boss && index === waveCount - 1) spawns.push(spawn(REGION_BOSSES[regionIndex], 1, 0));
    waves.push({ delay: index === 0 ? 5200 : 8500 + regionIndex * 900, title: boss && index === waveCount - 1 ? '区域终演' : elite ? '紧急返场' : `第 ${index + 1} 轮`, isHuge: elite || boss || index === waveCount - 1, spawns });
  }
  const danger = boss ? '区域终演' : elite ? '紧急演出' : '沿途演出';
  return {
    id: 1000 + node.region * 100 + node.column * 10 + node.row,
    name: `${danger} · ${ROGUE_REGIONS[regionIndex].name}`,
    description: NODE_LABELS[node.type].desc,
    startingSun: 200 + node.region * 25,
    availablePlants: roster.length ? roster : STARTER_PLANT_ORDER.slice(0, 2),
    featuredEnemies: [...new Set(waves.flatMap((wave) => wave.spawns.map((entry) => entry.type)))].slice(0, 6),
    reward: boss ? '区域终演完成' : '获得肉鸽奖励',
    accent: NODE_LABELS[node.type].color,
    waves,
  };
}

export function getPlantRecruitName(type: PlantType): string { return PLANTS[type].name; }
