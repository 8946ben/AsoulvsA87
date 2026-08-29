import type { ZombieType } from './zombies';

export interface ZombieSpawnEntry { type: ZombieType; count: number; gap: number; row?: number; }
export interface Wave { delay: number; isHuge?: boolean; title?: string; spawns: ZombieSpawnEntry[]; }
export interface LevelConfig { id: number; name: string; waves: Wave[]; }

export const LEVEL_1: LevelConfig = {
  id: 1,
  name: '第一幕 · 舞台保卫战',
  waves: [
    { delay: 8500, title: '白虫来袭', spawns: [{ type: 'basic', count: 3, gap: 2600 }] },
    { delay: 15000, spawns: [{ type: 'basic', count: 4, gap: 2100 }, { type: 'pole', count: 1, gap: 0 }] },
    { delay: 17500, isHuge: true, title: '铁桶编队', spawns: [
      { type: 'basic', count: 4, gap: 1700 }, { type: 'bucket', count: 2, gap: 3300 },
    ] },
    { delay: 21000, title: '黑化冲锋', spawns: [
      { type: 'pole', count: 3, gap: 2600 }, { type: 'knight', count: 2, gap: 4400 },
    ] },
    { delay: 23000, isHuge: true, title: '神区化龙', spawns: [
      { type: 'basic', count: 5, gap: 1400 }, { type: 'dragon', count: 1, gap: 0 },
    ] },
    { delay: 26000, isHuge: true, title: '最终返场', spawns: [
      { type: 'bucket', count: 3, gap: 2800 }, { type: 'knight', count: 2, gap: 3600 },
      { type: 'carol', count: 1, gap: 0 },
    ] },
  ],
};

export const ALL_LEVELS: LevelConfig[] = [LEVEL_1];
