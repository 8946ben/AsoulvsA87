import { TEX } from '../config/GameConfig';

export type ZombieType = 'basic' | 'cone' | 'bucket';

export interface ZombieConfig {
  type: ZombieType;
  name: string;
  hp: number;
  /** 移动速度（像素/秒，负数方向由逻辑控制） */
  speed: number;
  /** 啃食伤害（每秒） */
  attackDps: number;
  texture: string;
  /** 占位美术主色 */
  color: number;
}

export const ZOMBIES: Record<ZombieType, ZombieConfig> = {
  basic: {
    type: 'basic',
    name: '普通僵尸',
    hp: 200,
    speed: 22,
    attackDps: 50,
    texture: TEX.ZOMBIE_BASIC,
    color: 0x8fae7b,
  },
  cone: {
    type: 'cone',
    name: '路障僵尸',
    hp: 370,
    speed: 22,
    attackDps: 50,
    texture: TEX.ZOMBIE_CONE,
    color: 0xd97b29,
  },
  bucket: {
    type: 'bucket',
    name: '铁桶僵尸',
    hp: 800,
    speed: 20,
    attackDps: 50,
    texture: TEX.ZOMBIE_BUCKET,
    color: 0x9aa5b1,
  },
};
