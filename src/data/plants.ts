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

/** Low-health overlay placement in normalized character coordinates. */
export interface InjuryOverlayConfig {
  x: number;
  y: number;
  /** Bandage width as a fraction of the visible character width. */
  scale: number;
}

export interface PlantConfig {
  type: PlantType;
  name: string;
  role: string;
  cost: number;
  cooldown: number;
  hp: number;
  behavior: PlantBehavior;
  texture: string;
  /** 非 Q 版官方立绘纹理；图鉴/背包详情优先展示，战斗仍使用 texture 的 Q 版模型。 */
  portrait?: string;
  /** Ⅱ 阶专属立绘纹理；背包在该角色进阶后优先展示，战斗不受影响。 */
  advancedPortrait?: string;
  desc: string;
  /** Ⅰ 阶特性（background.md 角色条目的基础 `+` 项），背包「特性/进阶档案」区展示。 */
  stageTraits?: string[];
  /** Ⅱ 阶进阶特性（background.md 第二段 `+` 项）；存在即代表该角色可进阶。 */
  advanceTraits?: string[];
  /** 角色语录，来自 background.md，展示在图鉴与种子栏提示中。 */
  quote?: string;
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
  injuryOverlay?: InjuryOverlayConfig;
}

/** background.md 中十张基础卡的完整落地。 */
export const PLANTS: Record<PlantType, PlantConfig> = {
  beijixing: {
    type: 'beijixing', name: '贝极星', role: '应援补给', cost: 50, cooldown: 5000,
    hp: 1000, behavior: 'producer', texture: TEX.PLANT_BEIJIXING, advancedPortrait: TEX.ADVANCED_PORTRAIT_BEIJIXING,
    desc: '每 9 秒产生 25 点应援', stageTraits: ['产生阳光，每 9 秒产出 25 点应援'], quote: '需要浇水', accent: 0x63d9ff,
    produceInterval: 9000, produceAmount: 25,
    injuryOverlay: { x: 0.5, y: 0.3, scale: 0.16 },
  },
  jiaxintang: {
    type: 'jiaxintang', name: '嘉心糖', role: '糖果射手', cost: 100, cooldown: 6500,
    hp: 300, behavior: 'shooter', texture: TEX.PLANT_JIAXINTANG, advancedPortrait: TEX.ADVANCED_PORTRAIT_JIAXINTANG,
    desc: '发射糖果炮弹攻击本行', stageTraits: ['攻击产生糖果炮弹'], quote: '好多糖', accent: 0xff7fab,
    attackInterval: 1350, attackDamage: 22, projectile: TEX.CANDY,
    injuryOverlay: { x: 0.605, y: 0.8, scale: 0.11 },
  },
  naiqilin: {
    type: 'naiqilin', name: '奶淇琳', role: '甜点投手', cost: 125, cooldown: 8500,
    hp: 300, behavior: 'lobber', texture: TEX.PLANT_NAIQILIN, advancedPortrait: TEX.ADVANCED_PORTRAIT_NAIQILIN,
    desc: '投巧克力；25% 奶油定身', stageTraits: ['投掷巧克力，25% 概率投掷可停顿敌人 1.2 秒的奶油'], quote: '不能吃，会变成国家保护动物哦', accent: 0xd8b3ff,
    attackInterval: 2100, attackDamage: 34, projectile: TEX.CHOCOLATE,
    stunChance: 0.25, stunMs: 1200,
    injuryOverlay: { x: 0.5, y: 0.2, scale: 0.14 },
  },
  xiaohainuo: {
    type: 'xiaohainuo', name: '小海诺', role: '舞台屏障', cost: 75, cooldown: 15000,
    hp: 2500, behavior: 'wall', texture: TEX.PLANT_XIAOHAINUO, advancedPortrait: TEX.ADVANCED_PORTRAIT_XIAOHAINUO,
    desc: '以高耐久抵挡 A87', stageTraits: ['以高耐久阻挡敌人前进'], quote: '它在网上冲浪的头像都很相似', accent: 0x50d7ce,
  },
  xinqiuyi: {
    type: 'xinqiuyi', name: '心球仪', role: '共鸣爆破', cost: 150, cooldown: 24000,
    hp: 999, behavior: 'bomb', texture: TEX.PLANT_XINQIUYI, advancedPortrait: TEX.ADVANCED_PORTRAIT_XINQIUYI,
    desc: '短暂蓄力后造成 3×3 范围爆炸', stageTraits: ['蓄力 0.5 秒后爆炸，造成 1500 点 3×3 范围伤害'], quote: '阳光开朗，但容易爆炸', accent: 0xff5a91,
    attackDamage: 1500,
  },
  bella: {
    type: 'bella', name: '贝拉', role: '锤击变阵', cost: 150, cooldown: 10000,
    hp: 1000, behavior: 'bella', texture: TEX.PLANT_BELLA, portrait: TEX.PORTRAIT_BELLA, advancedPortrait: TEX.ADVANCED_PORTRAIT_BELLA,
    desc: '远投锤子；近敌时化为地雷；在场时贝极星产量加倍',
    stageTraits: ['远程投掷高伤害的锤子，敌人靠近一格后变为土豆雷，近距离引爆造成 1050 点伤害'],
    advanceTraits: ['场上若部署了贝拉，贝极星的阳光产量加倍'], quote: 'Asoul的队长以及武道担当，Bellllla！', accent: 0xe54955,
    attackInterval: 2700, attackDamage: 102, projectile: TEX.HAMMER,
  },
  eileen: {
    type: 'eileen', name: '乃琳', role: '穿透变阵', cost: 150, cooldown: 10000,
    hp: 300, behavior: 'eileen', texture: TEX.PLANT_EILEEN, portrait: TEX.PORTRAIT_EILEEN, advancedPortrait: TEX.ADVANCED_PORTRAIT_EILEEN,
    desc: '远程穿透；近敌时化为番茄牛肉汤（仅车碾可毁）；每个在场乃琳使奶淇琳奶油概率+15%',
    stageTraits: ['远程造成穿透伤害，敌人接近后变为地刺形态（角色消失，原地替换为番茄牛肉汤，仅雪橇车碾压可摧毁）'],
    advanceTraits: ['场上每部署一个乃琳，奶淇琳投掷奶油的概率 +15%，最多 +45%'], quote: '冬嘎西嘎哈密嘎，关注乃琳多谢啦~（粤语）', accent: 0x9b72e8,
    attackInterval: 1500, attackDamage: 32, projectile: TEX.BEAM,
  },
  diana: {
    type: 'diana', name: '嘉然', role: '距离机枪', cost: 200, cooldown: 10000,
    hp: 300, behavior: 'rapid', texture: TEX.PLANT_DIANA, portrait: TEX.PORTRAIT_DIANA, advancedPortrait: TEX.ADVANCED_PORTRAIT_DIANA,
    desc: '一次连发3发糖果；敌人越近攻速越快，一格内提升至 5 倍；在场时嘉心糖半价、生命翻倍、攻击+50%',
    stageTraits: ['一次连发三发子弹，敌人越近攻速越快，一格内提升至原攻速的 5 倍'],
    advanceTraits: ['场上若部署了嘉然，嘉心糖所需阳光减半、生命值翻倍、攻击力 +50%'], quote: '枝江最甜甜甜的小草莓！', accent: 0xff9b55,
    attackInterval: 950, attackDamage: 16, burstCount: 3, projectile: TEX.CANDY,
  },
  gladys: {
    type: 'gladys', name: '思诺', role: '全场冰冻', cost: 250, cooldown: 20000,
    hp: 300, behavior: 'freeze', texture: TEX.PLANT_GLADYS, portrait: TEX.PORTRAIT_GLADYS, advancedPortrait: TEX.ADVANCED_PORTRAIT_GLADYS,
    desc: '冰冻全场；概率留下心宜或小海诺',
    stageTraits: ['冰冻全场敌人 4 秒'],
    advanceTraits: ['退场时 20% 概率在原位置召唤心宜，20% 概率生成小海诺'], quote: '铁柱铁柱，歌舞突出', accent: 0x54c8ff,
    freezeDuration: 4000,
  },
  fiona: {
    type: 'fiona', name: '心宜', role: '概率支援', cost: 250, cooldown: 20000,
    hp: 300, behavior: 'squash', texture: TEX.PLANT_FIONA, portrait: TEX.PORTRAIT_FIONA, advancedPortrait: TEX.ADVANCED_PORTRAIT_FIONA,
    desc: '压扁敌人；概率留下思诺或心球仪',
    stageTraits: ['压扁一个敌人'],
    advanceTraits: ['退场时 20% 概率在原位置召唤思诺，20% 概率生成心球仪'], quote: '不交电费，谢谢', accent: 0xff6fba,
    attackDamage: 999,
  },
  xingkongtang: {
    type: 'xingkongtang', name: '星空糖', role: '星糖融合射手', cost: 0, cooldown: 0,
    hp: 1000, behavior: 'lifesteal', texture: TEX.PLANT_XINGKONGTANG, portrait: TEX.PORTRAIT_XINGKONGTANG, advancedPortrait: TEX.ADVANCED_PORTRAIT_XINGKONGTANG,
    desc: '贝极星＋嘉心糖；吸血并有 30% 概率造成 3 倍伤害',
    stageTraits: ['每次攻击造成伤害的 50% 回复自身生命，30% 概率造成 3 倍暴击伤害'],
    advanceTraits: ['贝拉和嘉然在场时生命值翻倍、攻击间隔缩短为 0.5 秒、吸血提升至 100%'], quote: '有人知道超级嘉贝的下一句是什么吗', accent: 0xffd44f,
    attackInterval: 1000, attackDamage: 30, projectile: TEX.STAR_CANDY,
  },
  xilanai: {
    type: 'xilanai', name: '喜拉乃', role: '星巧融合投手', cost: 0, cooldown: 0,
    hp: 1000, behavior: 'sunlobber', texture: TEX.PLANT_XILANAI, portrait: TEX.PORTRAIT_XILANAI, advancedPortrait: TEX.ADVANCED_PORTRAIT_XILANAI,
    desc: '贝极星＋奶淇琳；产阳光并投掷星形巧克力',
    stageTraits: ['每 20 秒产出 50 点阳光；投掷星形巧克力，15% 概率在敌人位置生成特殊贝极星'],
    advanceTraits: ['贝拉和乃琳在场时，生成特殊贝极星的概率提升至 30%'], quote: '喜拉乃会自己找糖吃', accent: 0xf4c25e,
    produceInterval: 20000, produceAmount: 50,
    attackInterval: 2100, attackDamage: 40, projectile: TEX.STAR_CANDY,
  },
  jiaxinnaitang: {
    type: 'jiaxinnaitang', name: '嘉心奶糖', role: '八向爆糖投手', cost: 0, cooldown: 0,
    hp: 300, behavior: 'burstlobber', texture: TEX.PLANT_JIAXINNAITANG, portrait: TEX.PORTRAIT_JIAXINNAITANG, advancedPortrait: TEX.ADVANCED_PORTRAIT_JIAXINNAITANG,
    desc: '奶淇琳＋嘉心糖；冰淇淋主弹炸出 8 枚糖果',
    stageTraits: ['投掷糖果冰激凌炮弹，炸开时向四面八方发射 8 颗糖果子弹（每颗 30 点伤害）'],
    advanceTraits: ['乃琳和嘉然在场时 30% 概率暴击（150% 伤害），且子弹替换为可二次爆炸的冰激凌炮弹'], quote: '爆了爆了！', accent: 0xffa6bc,
    attackInterval: 2000, attackDamage: 40, projectile: TEX.CANDY_ICE_CREAM,
  },
  yigehun: {
    type: 'yigehun', name: '一个魂', role: '三重削弱射手', cost: 0, cooldown: 0,
    hp: 1500, behavior: 'soulshooter', texture: TEX.PLANT_YIGEHUN, portrait: TEX.PORTRAIT_YIGEHUN, advancedPortrait: TEX.ADVANCED_PORTRAIT_YIGEHUN,
    desc: '三重融合；命中叠加减速与降攻，最多 3 层',
    stageTraits: ['命中使敌人减速 50%、攻击力下降 30%，持续 3 秒，最多叠加 3 层'],
    advanceTraits: ['乃琳、嘉然和贝拉在场时，每合成一个可额外获得一个 0 阳光部署的一个魂'], quote: '它总是念叨着十以内加减法', accent: 0xb594ff,
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
