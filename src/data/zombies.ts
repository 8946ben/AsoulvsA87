import { TEX } from '../config/GameConfig';

export type ZombieType = 'basic' | 'bucket' | 'pole' | 'dragon' | 'knight' | 'carol';

export interface ZombieConfig {
  type: ZombieType;
  name: string;
  quote: string;
  hp: number;
  speed: number;
  attackDps: number;
  texture: string;
  scale?: number;
  canVault?: boolean;
  charge?: boolean;
  summonInterval?: number;
  boss?: boolean;
}

export const ZOMBIES: Record<ZombieType, ZombieConfig> = {
  basic: {
    type: 'basic', name: 'A87', quote: 'A8 最常见的生物，它们只懂得蠕动',
    hp: 240, speed: 24, attackDps: 48, texture: TEX.ZOMBIE_BASIC,
  },
  bucket: {
    type: 'bucket', name: '铁桶 A87', quote: '顶着铁桶，也想登上舞台',
    hp: 720, speed: 20, attackDps: 55, texture: TEX.ZOMBIE_BUCKET,
  },
  pole: {
    type: 'pole', name: '撑杆跳 A87', quote: '会越过第一次遇到的阻挡',
    hp: 340, speed: 30, attackDps: 46, texture: TEX.ZOMBIE_POLE, canVault: true,
  },
  dragon: {
    type: 'dragon', name: '神区化龙 A87', quote: '白虫化龙，妄图夺走枝江舞台',
    hp: 3200, speed: 13, attackDps: 85, texture: TEX.ZOMBIE_DRAGON, scale: 1.06, boss: true,
  },
  knight: {
    type: 'knight', name: '皇家骑士（黑化）', quote: '它们什么也不懂，只懂得冲锋',
    hp: 980, speed: 34, attackDps: 90, texture: TEX.ZOMBIE_KNIGHT, charge: true,
  },
  carol: {
    type: 'carol', name: '珈乐（黑化）', quote: '往日种种，你难道都忘了吗',
    hp: 4200, speed: 11, attackDps: 78, texture: TEX.ZOMBIE_CAROL,
    summonInterval: 11000, boss: true,
  },
};
