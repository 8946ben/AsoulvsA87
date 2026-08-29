import { ZombieType } from './zombies';

export interface ZombieSpawnEntry {
  type: ZombieType;
  /** 出现数量 */
  count: number;
  /** 该批次内每只之间的间隔（毫秒） */
  gap: number;
  /** 指定行（0 起）；不指定则随机 */
  row?: number;
}

export interface Wave {
  /** 距离上一波开始的延迟（毫秒）；大波前会给出提示 */
  delay: number;
  /** 是否为大波（触发「一大波僵尸正在接近」提示） */
  isHuge?: boolean;
  spawns: ZombieSpawnEntry[];
}

export interface LevelConfig {
  id: number;
  name: string;
  waves: Wave[];
}

/**
 * 第 1 关：教学难度，全部为普通僵尸，逐步加压。
 * 关卡数据纯配置化，新增关卡只需往这里追加。
 */
export const LEVEL_1: LevelConfig = {
  id: 1,
  name: '第一关 · 前院草坪',
  waves: [
    {
      delay: 12000,
      spawns: [{ type: 'basic', count: 1, gap: 0 }],
    },
    {
      delay: 18000,
      spawns: [{ type: 'basic', count: 2, gap: 2500 }],
    },
    {
      delay: 20000,
      spawns: [{ type: 'basic', count: 3, gap: 2000 }],
    },
    {
      delay: 22000,
      isHuge: true,
      spawns: [
        { type: 'basic', count: 4, gap: 1500 },
        { type: 'cone', count: 2, gap: 2500 },
      ],
    },
    {
      delay: 25000,
      spawns: [
        { type: 'basic', count: 3, gap: 1800 },
        { type: 'bucket', count: 1, gap: 0 },
      ],
    },
    {
      delay: 28000,
      isHuge: true,
      spawns: [
        { type: 'basic', count: 5, gap: 1400 },
        { type: 'cone', count: 3, gap: 2000 },
        { type: 'bucket', count: 2, gap: 3000 },
      ],
    },
  ],
};

export const ALL_LEVELS: LevelConfig[] = [LEVEL_1];
