import type { PlantType } from './plants';

/**
 * 枝江藏品：可采购、可装配的永久强化道具。
 * effects 中的数值由战斗侧（Plant）直接消费，描述文案由 describeRelicEffects 程序化生成，
 * 保证图鉴/背包展示与实际数值不脱节。
 */
export type RelicId =
  | 'melodious-key'
  | 'fan-cheerstick'
  | 'sweet-chocolate'
  | 'star-mic'
  | 'zhijiang-umbrella'
  | 'pixel-console'
  | 'tour-ticket'
  | 'glowing-jellyfish'
  | 'haoting-key'
  | 'nanting-key'
  | 'bella-hammer'
  | 'bella-pan'
  | 'minus-8000-mic'
  | 'keyboard-20'
  | 'keyboard-200'
  | 'xiaomi-keyboard';

/** 藏品品质：D < C < B < A < S */
export type RelicRarity = 'd' | 'c' | 'b' | 'a' | 's';

export interface RelicEffects {
  /** 每秒回复的生命值。 */
  hpRegenPerSec?: number;
  /** 生命值倍率（1.5 = +50%）。 */
  hpMultiplier?: number;
  /** 攻击伤害倍率（1.25 = +25%）。 */
  damageMultiplier?: number;
  /** 攻击速度倍率（1.2 = 间隔缩短 20%）。 */
  attackSpeedMultiplier?: number;
  /** 每次产出应援的额外增量。 */
  produceBonus?: number;
  /** 部署费用倍率（1.3 = +30%）。 */
  costMultiplier?: number;
}

export interface RelicConfig {
  id: RelicId;
  name: string;
  /** 展示用 emoji 图标（无独立图片素材，直接以字形渲染）。 */
  glyph: string;
  rarity: RelicRarity;
  /** 可装配角色；null 表示全体角色可装配。 */
  allowedTypes: PlantType[] | null;
  effects: RelicEffects;
  quote: string;
  /** 联合装配：与指定藏品同时装配时触发强化效果。 */
  synergy?: {
    /** 联动的另一个藏品ID。 */
    with: RelicId;
    /** 联合装配时的替代效果（覆盖基础effects）。 */
    effects: RelicEffects;
    /** 联合装配描述。 */
    description: string;
  };
  /** 特殊效果描述（非数值型效果，如贝拉爆炸范围扩大）。 */
  specialEffect?: string;
}

export const RARITY_LABEL: Record<RelicRarity, string> = {
  d: 'D级',
  c: 'C级',
  b: 'B级',
  a: 'A级',
  s: 'S级',
};

export const RARITY_COLOR: Record<RelicRarity, number> = {
  d: 0x6b7280,
  c: 0x8b9997,
  b: 0x399ec3,
  a: 0x9b72e8,
  s: 0xe8a020,
};

export const RELIC_ORDER: RelicId[] = [
  'melodious-key', 'fan-cheerstick', 'sweet-chocolate', 'star-mic',
  'zhijiang-umbrella', 'pixel-console', 'tour-ticket', 'glowing-jellyfish',
  'haoting-key', 'nanting-key', 'bella-hammer', 'bella-pan',
  'minus-8000-mic', 'keyboard-20', 'keyboard-200', 'xiaomi-keyboard',
];

export const RELICS: Record<RelicId, RelicConfig> = {
  'melodious-key': {
    id: 'melodious-key', name: '好听的钥匙', glyph: '🔑', rarity: 's',
    allowedTypes: ['beijixing', 'naiqilin', 'jiaxintang'],
    effects: { hpRegenPerSec: 50 },
    quote: '枝江传闻：用这把钥匙轻轻敲敲话筒，会传出好听的歌。',
  },
  'fan-cheerstick': {
    id: 'fan-cheerstick', name: '单推应援棒', glyph: '🎇', rarity: 'a',
    allowedTypes: ['bella', 'diana', 'xingkongtang'],
    effects: { attackSpeedMultiplier: 1.2 },
    quote: '就算只单推一个人，也要全力应援。',
  },
  'sweet-chocolate': {
    id: 'sweet-chocolate', name: '甜甜巧克力', glyph: '🍫', rarity: 'a',
    allowedTypes: ['jiaxintang', 'naiqilin', 'jiaxinnaitang'],
    effects: { damageMultiplier: 1.25 },
    quote: '甜甜的，就像台下的大家。',
  },
  'star-mic': {
    id: 'star-mic', name: '星愿麦克风', glyph: '🎤', rarity: 'a',
    allowedTypes: ['eileen', 'gladys', 'fiona', 'xilanai'],
    effects: { damageMultiplier: 1.2 },
    quote: '把大家的星愿，唱给所有人听。',
  },
  'zhijiang-umbrella': {
    id: 'zhijiang-umbrella', name: '枝江小雨伞', glyph: '☂️', rarity: 'b',
    allowedTypes: ['xiaohainuo', 'beijixing', 'eileen'],
    effects: { hpMultiplier: 1.5 },
    quote: '枝江多阵雨，出门记得带伞。',
  },
  'pixel-console': {
    id: 'pixel-console', name: '像素游戏机', glyph: '🎮', rarity: 'b',
    allowedTypes: null,
    effects: { attackSpeedMultiplier: 1.15, hpMultiplier: 1.25 },
    quote: '枝江游戏厅的最高分纪录，保持者不详。',
  },
  'tour-ticket': {
    id: 'tour-ticket', name: '巡演纪念票根', glyph: '🎫', rarity: 'b',
    allowedTypes: null,
    effects: { hpMultiplier: 1.3, damageMultiplier: 1.1 },
    quote: '第一场枝江巡演的入场凭证，值得永久珍藏。',
  },
  'glowing-jellyfish': {
    id: 'glowing-jellyfish', name: '应援海月灯', glyph: '🪼', rarity: 's',
    allowedTypes: ['beijixing', 'xilanai'],
    effects: { produceBonus: 15 },
    quote: '深夜的排练室里，它一直亮着。',
  },
  'haoting-key': {
    id: 'haoting-key', name: '豪庭的钥匙', glyph: '🗝️', rarity: 'a',
    allowedTypes: null,
    effects: { hpRegenPerSec: 50 },
    quote: '豪庭之钥，守护安宁。',
  },
  'nanting-key': {
    id: 'nanting-key', name: '南亭的钥匙', glyph: '🗝️', rarity: 'a',
    allowedTypes: null,
    effects: { damageMultiplier: 1.5 },
    quote: '南亭之钥，锐不可当。',
  },
  'bella-hammer': {
    id: 'bella-hammer', name: '一个锤子', glyph: '🔨', rarity: 's',
    allowedTypes: ['bella'],
    effects: { damageMultiplier: 1.0 },
    specialEffect: '贝拉爆炸伤害范围扩大1.5倍',
    synergy: {
      with: 'bella-pan',
      effects: { damageMultiplier: 1.0 },
      description: '同时装配平底锅时，爆炸范围扩大至3倍',
    },
    quote: '贝拉专属：一锤定音。',
  },
  'bella-pan': {
    id: 'bella-pan', name: '一口平底锅', glyph: '🍳', rarity: 's',
    allowedTypes: ['bella'],
    effects: { damageMultiplier: 1.0 },
    specialEffect: '贝拉爆炸伤害提升150%',
    synergy: {
      with: 'bella-hammer',
      effects: { damageMultiplier: 1.0 },
      description: '同时装配锤子时，爆炸伤害提升至300%',
    },
    quote: '贝拉专属：一锅在手，天下我有。',
  },
  'minus-8000-mic': {
    id: 'minus-8000-mic', name: '-8000麦克风', glyph: '🎙️', rarity: 'd',
    allowedTypes: null,
    effects: { damageMultiplier: 1.3, costMultiplier: 1.3 },
    quote: '声音大，代价也大。',
  },
  'keyboard-20': {
    id: 'keyboard-20', name: '20块的键盘', glyph: '⌨️', rarity: 'd',
    allowedTypes: null,
    effects: { hpMultiplier: 1.3, costMultiplier: 1.3 },
    quote: '便宜货，但能用。',
  },
  'keyboard-200': {
    id: 'keyboard-200', name: '200块的键盘', glyph: '⌨️', rarity: 'c',
    allowedTypes: null,
    effects: { hpMultiplier: 1.3 },
    quote: '性价比之选。',
  },
  'xiaomi-keyboard': {
    id: 'xiaomi-keyboard', name: '小爱联名键盘', glyph: '⌨️', rarity: 'a',
    allowedTypes: null,
    effects: { hpMultiplier: 1.8 },
    quote: '小爱同学，随时待命。',
  },
};

/** 效果数值的程序化描述，背包与图鉴共用，避免文案与数值脱节。 */
export function describeRelicEffects(effects: RelicEffects): string[] {
  const lines: string[] = [];
  if (effects.hpRegenPerSec) lines.push(`装配后每秒回复 ${effects.hpRegenPerSec} 点生命`);
  if (effects.hpMultiplier && effects.hpMultiplier !== 1) lines.push(`生命值 +${Math.round((effects.hpMultiplier - 1) * 100)}%`);
  if (effects.damageMultiplier && effects.damageMultiplier !== 1) lines.push(`攻击伤害 +${Math.round((effects.damageMultiplier - 1) * 100)}%`);
  if (effects.attackSpeedMultiplier && effects.attackSpeedMultiplier !== 1) lines.push(`攻击速度 +${Math.round((effects.attackSpeedMultiplier - 1) * 100)}%`);
  if (effects.produceBonus) lines.push(`每次产出应援额外 +${effects.produceBonus}`);
  if (effects.costMultiplier && effects.costMultiplier !== 1) lines.push(`部署应援消耗 +${Math.round((effects.costMultiplier - 1) * 100)}%`);
  return lines;
}
