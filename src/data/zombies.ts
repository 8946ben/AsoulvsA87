import { TEX } from '../config/GameConfig';

export type ZombieType =
  | 'basic'
  | 'phone'
  | 'flag'
  | 'screen'
  | 'balloon'
  | 'ladder'
  | 'cone'
  | 'football'
  | 'sled'
  | 'miner'
  | 'bucket'
  | 'pole'
  | 'dragon'
  | 'knight'
  | 'carol';

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
  vaultHeight?: number;
  postVaultSpeedMultiplier?: number;
  dropGearAfterVault?: boolean;
  accessoryBreakHp?: number;
  breakTexture?: string;
  enragedSpeedMultiplier?: number;
  flying?: boolean;
  flagWave?: boolean;
  charge?: boolean;
  crushPlants?: boolean;
  tunneling?: boolean;
  summonInterval?: number;
  boss?: boolean;
}

export const ZOMBIES: Record<ZombieType, ZombieConfig> = {
  basic: {
    type: 'basic', name: 'A87', quote: 'A8 最常见的生物，它们只懂得蠕动',
    hp: 240, speed: 12, attackDps: 48, texture: TEX.ZOMBIE_BASIC,
  },
  phone: {
    type: 'phone', name: '刷手机 A87', quote: '它们从不错过任何一个热点',
    hp: 480, speed: 10, attackDps: 48, texture: TEX.ZOMBIE_PHONE,
    accessoryBreakHp: 240, breakTexture: TEX.ZOMBIE_BASIC, enragedSpeedMultiplier: 2.5,
  },
  flag: {
    type: 'flag', name: '旗子 A87', quote: '它们号召大家发起冲锋，但自己走的却很慢',
    hp: 240, speed: 7.5, attackDps: 45, texture: TEX.ZOMBIE_FLAG, flagWave: true,
  },
  screen: {
    type: 'screen', name: '铁门网 A87', quote: '这是骑士的盾牌',
    hp: 1080, speed: 9, attackDps: 52, texture: TEX.ZOMBIE_SCREEN,
    accessoryBreakHp: 240, breakTexture: TEX.ZOMBIE_BASIC,
  },
  balloon: {
    type: 'balloon', name: '气球 A87', quote: 'A8 区能飞',
    hp: 360, speed: 11, attackDps: 52, texture: TEX.ZOMBIE_BALLOON, flying: true,
  },
  ladder: {
    type: 'ladder', name: '梯子 A87', quote: '它们学会了绕过障碍',
    hp: 720, speed: 16, attackDps: 55, texture: TEX.ZOMBIE_LADDER,
    canVault: true, vaultHeight: 28, postVaultSpeedMultiplier: 0.62, dropGearAfterVault: true,
  },
  cone: {
    type: 'cone', name: '路障 A87', quote: '它们学会了将曾经的阻碍戴在头上',
    hp: 480, speed: 11, attackDps: 50, texture: TEX.ZOMBIE_CONE,
    accessoryBreakHp: 240, breakTexture: TEX.ZOMBIE_BASIC,
  },
  football: {
    type: 'football', name: '橄榄球 A87', quote: '它们不知道什么是橄榄球，但这副装备确实让它们蠕动得更快',
    hp: 1100, speed: 19, attackDps: 82, texture: TEX.ZOMBIE_FOOTBALL, charge: true,
  },
  sled: {
    type: 'sled', name: '雪橇车 A87', quote: '起猛了，区也会开车？',
    hp: 1800, speed: 14, attackDps: 120, texture: TEX.ZOMBIE_SLED, crushPlants: true,
  },
  miner: {
    type: 'miner', name: '矿工 A87', quote: '它们从地下绕到了防线背后',
    hp: 620, speed: 13, attackDps: 58, texture: TEX.ZOMBIE_MINER, tunneling: true,
  },
  bucket: {
    type: 'bucket', name: '铁桶 A87', quote: '它们有了更坚固的防具',
    hp: 720, speed: 10, attackDps: 55, texture: TEX.ZOMBIE_BUCKET,
  },
  pole: {
    type: 'pole', name: '撑杆跳 A87', quote: '跳过去',
    hp: 340, speed: 15, attackDps: 46, texture: TEX.ZOMBIE_POLE, canVault: true,
  },
  dragon: {
    type: 'dragon', name: '神区化龙 A87', quote: '白虫化龙，妄图夺走枝江舞台',
    hp: 3200, speed: 6.5, attackDps: 85, texture: TEX.ZOMBIE_DRAGON, scale: 1.06, boss: true,
  },
  knight: {
    type: 'knight', name: '皇家骑士（黑化）', quote: '它们什么也不懂，只懂得冲锋',
    hp: 980, speed: 17, attackDps: 90, texture: TEX.ZOMBIE_KNIGHT, charge: true,
  },
  carol: {
    type: 'carol', name: '珈乐（黑化）', quote: '往日种种，你难道都忘了吗',
    hp: 4200, speed: 5.5, attackDps: 78, texture: TEX.ZOMBIE_CAROL,
    summonInterval: 11000, boss: true,
  },
};
