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
  | 'fiona'
  | 'xingkongtang'
  | 'xilanai'
  | 'jiaxinnaitang'
  | 'yigehun'
  | 'special_beijixing';

export type PlantBehavior =
  | 'producer'
  | 'shooter'
  | 'lobber'
  | 'wall'
  | 'bomb'
  | 'bella'
  | 'eileen'
  | 'rapid'
  | 'freeze'
  | 'squash'
  | 'lifesteal'
  | 'sunlobber'
  | 'burstlobber'
  | 'soulshooter'
  | 'specialwall';

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
  burstCount?: number;
  projectile?: string;
  stunChance?: number;
  stunMs?: number;
  freezeDuration?: number;
}

/** background.md 中十张基础卡的完整落地。 */
export const PLANTS: Record<PlantType, PlantConfig> = {
  beijixing: {
    type: 'beijixing', name: '贝极星', role: '应援补给', cost: 50, cooldown: 5000,
    hp: 1000, behavior: 'producer', texture: TEX.PLANT_BEIJIXING,
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
    hp: 300, behavior: 'lobber', texture: TEX.PLANT_NAIQILIN,
    desc: '投巧克力；25% 奶油定身', accent: 0xd8b3ff,
    attackInterval: 2100, attackDamage: 34, projectile: TEX.CHOCOLATE,
    stunChance: 0.25, stunMs: 1200,
  },
  xiaohainuo: {
    type: 'xiaohainuo', name: '小海诺', role: '舞台屏障', cost: 75, cooldown: 15000,
    hp: 2500, behavior: 'wall', texture: TEX.PLANT_XIAOHAINUO,
    desc: '以高耐久抵挡 A87', accent: 0x50d7ce,
  },
  xinqiuyi: {
    type: 'xinqiuyi', name: '心球仪', role: '共鸣爆破', cost: 150, cooldown: 24000,
    hp: 999, behavior: 'bomb', texture: TEX.PLANT_XINQIUYI,
    desc: '短暂蓄力后造成 3×3 范围爆炸', accent: 0xff5a91,
    attackDamage: 1500,
  },
  bella: {
    type: 'bella', name: '贝拉', role: '锤击变阵', cost: 150, cooldown: 10000,
    hp: 1000, behavior: 'bella', texture: TEX.PLANT_BELLA,
    desc: '远投锤子；近敌时化为地雷；在场时贝极星产量加倍', accent: 0xe54955,
    attackInterval: 2700, attackDamage: 102, projectile: TEX.HAMMER,
  },
  eileen: {
    type: 'eileen', name: '乃琳', role: '穿透变阵', cost: 150, cooldown: 10000,
    hp: 300, behavior: 'eileen', texture: TEX.PLANT_EILEEN,
    desc: '远程穿透；近敌时化为番茄牛肉汤（仅车碾可毁）；每个在场乃琳使奶淇琳奶油概率+15%', accent: 0x9b72e8,
    attackInterval: 1500, attackDamage: 32, projectile: TEX.BEAM,
  },
  diana: {
    type: 'diana', name: '嘉然', role: '距离机枪', cost: 200, cooldown: 10000,
    hp: 300, behavior: 'rapid', texture: TEX.PLANT_DIANA,
    desc: '一次连发3发糖果；敌人越近攻速越快，一格内提升至 5 倍；在场时嘉心糖半价、生命翻倍、攻击+50%', accent: 0xff9b55,
    attackInterval: 950, attackDamage: 16, burstCount: 3, projectile: TEX.CANDY,
  },
  gladys: {
    type: 'gladys', name: '思诺', role: '全场冰冻', cost: 250, cooldown: 20000,
    hp: 300, behavior: 'freeze', texture: TEX.PLANT_GLADYS,
    desc: '冰冻全场；概率留下心宜或小海诺', accent: 0x54c8ff,
    freezeDuration: 4000,
  },
  fiona: {
    type: 'fiona', name: '心宜', role: '概率支援', cost: 250, cooldown: 20000,
    hp: 300, behavior: 'squash', texture: TEX.PLANT_FIONA,
    desc: '压扁敌人；概率留下思诺或心球仪', accent: 0xff6fba,
    attackDamage: 999,
  },
  xingkongtang: {
    type: 'xingkongtang', name: '星空糖', role: '星糖融合射手', cost: 0, cooldown: 0,
    hp: 1000, behavior: 'lifesteal', texture: TEX.PLANT_XINGKONGTANG,
    desc: '贝极星＋嘉心糖；吸血并有 30% 概率造成 3 倍伤害', accent: 0xffd44f,
    attackInterval: 1000, attackDamage: 30, projectile: TEX.STAR_CANDY,
  },
  xilanai: {
    type: 'xilanai', name: '喜拉乃', role: '星巧融合投手', cost: 0, cooldown: 0,
    hp: 1000, behavior: 'sunlobber', texture: TEX.PLANT_XILANAI,
    desc: '贝极星＋奶淇琳；产阳光并投掷星形巧克力', accent: 0xf4c25e,
    produceInterval: 20000, produceAmount: 50,
    attackInterval: 2100, attackDamage: 40, projectile: TEX.STAR_CANDY,
  },
  jiaxinnaitang: {
    type: 'jiaxinnaitang', name: '嘉心奶糖', role: '八向爆糖投手', cost: 0, cooldown: 0,
    hp: 300, behavior: 'burstlobber', texture: TEX.PLANT_JIAXINNAITANG,
    desc: '奶淇琳＋嘉心糖；冰淇淋主弹炸出 8 枚糖果', accent: 0xffa6bc,
    attackInterval: 2000, attackDamage: 40, projectile: TEX.CANDY_ICE_CREAM,
  },
  yigehun: {
    type: 'yigehun', name: '一个魂', role: '三重削弱射手', cost: 0, cooldown: 0,
    hp: 1500, behavior: 'soulshooter', texture: TEX.PLANT_YIGEHUN,
    desc: '三重融合；命中叠加减速与降攻，最多 3 层', accent: 0xb594ff,
    attackInterval: 1500, attackDamage: 20, projectile: TEX.SOUL_CANDY,
  },
  special_beijixing: {
    type: 'special_beijixing', name: '特殊贝极星', role: '三次星盾', cost: 0, cooldown: 0,
    hp: 3, behavior: 'specialwall', texture: TEX.PLANT_BEIJIXING,
    desc: '承受任意 3 次攻击，并将攻击力的 30% 转为阳光', accent: 0xffe46d,
  },
};

export const STARTER_PLANT_ORDER: PlantType[] = [
  'beijixing', 'jiaxintang', 'naiqilin', 'xiaohainuo', 'xinqiuyi',
  'bella', 'eileen', 'diana', 'gladys', 'fiona',
];

export const CODEX_PLANT_ORDER: PlantType[] = [...STARTER_PLANT_ORDER, 'xingkongtang', 'xilanai', 'jiaxinnaitang', 'yigehun'];
