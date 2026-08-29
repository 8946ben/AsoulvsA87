import { TEX } from '../config/GameConfig';

export type PlantType =
  | 'beijixing'
  | 'jiaxintang'
  | 'naiqilin'
  | 'xiaohainuo'
  | 'xinqiuyi'
  | 'bella'
  | 'eileen'
  | 'diana'
  | 'gladys'
  | 'fiona';

export type PlantBehavior =
  | 'producer'
  | 'shooter'
  | 'lobber'
  | 'wall'
  | 'bomb'
  | 'bella'
  | 'eileen'
  | 'rapid'
  | 'torch'
  | 'squash';

export interface PlantConfig {
  type: PlantType;
  name: string;
  role: string;
  cost: number;
  cooldown: number;
  hp: number;
  behavior: PlantBehavior;
  texture: string;
  desc: string;
  accent: number;
  produceInterval?: number;
  produceAmount?: number;
  attackInterval?: number;
  attackDamage?: number;
  projectile?: string;
  stunChance?: number;
  stunMs?: number;
}

/** background.md 中十张基础卡的完整落地。 */
export const PLANTS: Record<PlantType, PlantConfig> = {
  beijixing: {
    type: 'beijixing', name: '贝极星', role: '应援补给', cost: 50, cooldown: 6500,
    hp: 300, behavior: 'producer', texture: TEX.PLANT_BEIJIXING,
    desc: '每 9 秒产生 25 点应援', accent: 0x63d9ff,
    produceInterval: 9000, produceAmount: 25,
  },
  jiaxintang: {
    type: 'jiaxintang', name: '嘉心糖', role: '糖果射手', cost: 100, cooldown: 6500,
    hp: 300, behavior: 'shooter', texture: TEX.PLANT_JIAXINTANG,
    desc: '发射糖果炮弹攻击本行', accent: 0xff7fab,
    attackInterval: 1350, attackDamage: 22, projectile: TEX.CANDY,
  },
  naiqilin: {
    type: 'naiqilin', name: '奶淇琳', role: '甜点投手', cost: 125, cooldown: 8500,
    hp: 320, behavior: 'lobber', texture: TEX.PLANT_NAIQILIN,
    desc: '投巧克力；25% 奶油定身', accent: 0xd8b3ff,
    attackInterval: 2100, attackDamage: 34, projectile: TEX.CHOCOLATE,
    stunChance: 0.25, stunMs: 1200,
  },
  xiaohainuo: {
    type: 'xiaohainuo', name: '小海诺', role: '舞台屏障', cost: 75, cooldown: 15000,
    hp: 2300, behavior: 'wall', texture: TEX.PLANT_XIAOHAINUO,
    desc: '以高耐久抵挡 A87', accent: 0x50d7ce,
  },
  xinqiuyi: {
    type: 'xinqiuyi', name: '心球仪', role: '共鸣爆破', cost: 150, cooldown: 24000,
    hp: 999, behavior: 'bomb', texture: TEX.PLANT_XINQIUYI,
    desc: '短暂蓄力后造成范围爆炸', accent: 0xff5a91,
    attackDamage: 1500,
  },
  bella: {
    type: 'bella', name: '贝拉', role: '锤击变阵', cost: 175, cooldown: 12000,
    hp: 420, behavior: 'bella', texture: TEX.PLANT_BELLA,
    desc: '远投锤子；近敌时化为地雷', accent: 0xe54955,
    attackInterval: 2700, attackDamage: 92, projectile: TEX.HAMMER,
  },
  eileen: {
    type: 'eileen', name: '乃琳', role: '穿透变阵', cost: 150, cooldown: 11000,
    hp: 450, behavior: 'eileen', texture: TEX.PLANT_EILEEN,
    desc: '远程穿透；近敌时化为地刺', accent: 0x9b72e8,
    attackInterval: 1900, attackDamage: 32, projectile: TEX.BEAM,
  },
  diana: {
    type: 'diana', name: '嘉然', role: '距离机枪', cost: 200, cooldown: 12000,
    hp: 360, behavior: 'rapid', texture: TEX.PLANT_DIANA,
    desc: '敌人越近，糖果连射越快', accent: 0xff9b55,
    attackInterval: 950, attackDamage: 16, projectile: TEX.CANDY,
  },
  gladys: {
    type: 'gladys', name: '思诺', role: '热力支援', cost: 125, cooldown: 13000,
    hp: 950, behavior: 'torch', texture: TEX.PLANT_GLADYS,
    desc: '强化穿过的炮弹；接敌化护盾', accent: 0x54c8ff,
  },
  fiona: {
    type: 'fiona', name: '心宜', role: '概率支援', cost: 125, cooldown: 22000,
    hp: 500, behavior: 'squash', texture: TEX.PLANT_FIONA,
    desc: '压扁敌人；概率留下思诺或心球仪', accent: 0xff6fba,
    attackDamage: 1200,
  },
};

export const STARTER_PLANT_ORDER: PlantType[] = [
  'beijixing', 'jiaxintang', 'naiqilin', 'xiaohainuo', 'xinqiuyi',
  'bella', 'eileen', 'diana', 'gladys', 'fiona',
];
