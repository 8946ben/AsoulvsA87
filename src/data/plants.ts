import { TEX } from '../config/GameConfig';

export type PlantType = 'sunflower' | 'peashooter' | 'wallnut' | 'fiona' | 'gladys' | 'ava';

/** 植物行为类型 */
export type PlantBehavior =
  /** 生产阳光 */
  | 'producer'
  /** 发射子弹 */
  | 'shooter'
  /** 纯肉盾 */
  | 'wall';

export interface PlantConfig {
  type: PlantType;
  name: string;
  /** 种植消耗 */
  cost: number;
  /** 卡片冷却时间（毫秒） */
  cooldown: number;
  hp: number;
  behavior: PlantBehavior;
  texture: string;
  /** 卡片上显示的说明文字 */
  desc: string;
  /** 卡片主色（占位美术用） */
  color: number;

  // ---- producer 专用 ----
  /** 产出阳光的间隔（毫秒） */
  produceInterval?: number;
  /** 单次产出阳光值 */
  produceAmount?: number;

  // ---- shooter 专用 ----
  /** 攻击间隔（毫秒） */
  attackInterval?: number;
  /** 单发伤害 */
  attackDamage?: number;
  /** 子弹纹理 */
  projectile?: string;
}

/**
 * 植物数据表。
 * 数值参考经典塔防平衡设计；美术 key 后续可直接替换为自绘资源。
 */
export const PLANTS: Record<PlantType, PlantConfig> = {
  // === 阳光产线（producer） ============================================
  // 嘉然：标准 25 阳光/10s，基础经济来源
  sunflower: {
    type: 'sunflower',
    name: '嘉然',
    cost: 50,
    cooldown: 7500,
    hp: 300,
    behavior: 'producer',
    texture: TEX.PLANT_SUNFLOWER,
    desc: '产出应援',
    color: 0xffd93b,
    produceInterval: 10000,
    produceAmount: 25,
  },
  // 心宜：单次少但间隔短，快速积累型
  fiona: {
    type: 'fiona',
    name: '心宜',
    cost: 75,
    cooldown: 7500,
    hp: 300,
    behavior: 'producer',
    texture: TEX.PLANT_FIONA,
    desc: '快速产出',
    color: 0xff9ec4,
    produceInterval: 7000,
    produceAmount: 20,
  },
  // === 攻击线（shooter） ===============================================
  // 贝拉：标准应援炮，单发 20
  peashooter: {
    type: 'peashooter',
    name: '贝拉',
    cost: 100,
    cooldown: 7500,
    hp: 300,
    behavior: 'shooter',
    texture: TEX.PLANT_PEASHOOTER,
    desc: '应援炮',
    color: 0xff9ec4,
    attackInterval: 1400,
    attackDamage: 20,
    projectile: TEX.PEA,
  },
  // 思诺：慢速但高伤的音波，单发 28
  gladys: {
    type: 'gladys',
    name: '思诺',
    cost: 125,
    cooldown: 7500,
    hp: 280,
    behavior: 'shooter',
    texture: TEX.PLANT_GLADYS,
    desc: '音波攻击',
    color: 0x9b6dd3,
    attackInterval: 1700,
    attackDamage: 28,
    projectile: TEX.PEA,
  },
  // === 护盾线（wall） =================================================
  // 乃琳：标准冰盾，2000 血
  wallnut: {
    type: 'wallnut',
    name: '乃琳',
    cost: 50,
    cooldown: 20000,
    hp: 2000,
    behavior: 'wall',
    texture: TEX.PLANT_WALLNUT,
    desc: '冰盾护体',
    color: 0xa8d8ff,
  },
  // 向晚：进阶星星护盾，4000 血，冷却长
  ava: {
    type: 'ava',
    name: '向晚',
    cost: 100,
    cooldown: 25000,
    hp: 4000,
    behavior: 'wall',
    texture: TEX.PLANT_AVA,
    desc: '星星护盾',
    color: 0x6b8bff,
  },
};

/** 6 个植物的初始解锁顺序（按性价比 / 战术需求排序） */
export const STARTER_PLANT_ORDER: PlantType[] = [
  'sunflower',  // 嘉然 · 基础经济
  'fiona',      // 心宜 · 快速经济
  'peashooter', // 贝拉 · 基础攻击
  'gladys',     // 思诺 · 高伤
  'wallnut',    // 乃琳 · 基础护盾
  'ava',        // 向晚 · 进阶护盾
];
