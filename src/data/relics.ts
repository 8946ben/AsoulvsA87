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
  | 'glowing-jellyfish';

export type RelicRarity = 'rare' | 'epic' | 'legend';

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
}

export interface RelicConfig {
  id: RelicId;
  name: string;
  /** 展示用 emoji 图标（无独立图片素材，直接以字形渲染）。 */
  glyph: string;
  rarity: RelicRarity;
  /** 采购所需星愿徽记。 */
  price: number;
  /** 可装配角色；null 表示全体角色可装配。 */
  allowedTypes: PlantType[] | null;
  effects: RelicEffects;
  quote: string;
}

export const RARITY_LABEL: Record<RelicRarity, string> = {
  rare: '稀有',
  epic: '史诗',
  legend: '传说',
};

export const RARITY_COLOR: Record<RelicRarity, number> = {
  rare: 0x399ec3,
  epic: 0x9b72e8,
  legend: 0xe8a020,
};

export const RELIC_ORDER: RelicId[] = [
  'melodious-key', 'fan-cheerstick', 'sweet-chocolate', 'star-mic',
  'zhijiang-umbrella', 'pixel-console', 'tour-ticket', 'glowing-jellyfish',
];

export const RELICS: Record<RelicId, RelicConfig> = {
  'melodious-key': {
    id: 'melodious-key', name: '好听的钥匙', glyph: '🔑', rarity: 'legend', price: 8,
    allowedTypes: ['beijixing', 'naiqilin', 'jiaxintang'],
    effects: { hpRegenPerSec: 50 },
    quote: '枝江传闻：用这把钥匙轻轻敲敲话筒，会传出好听的歌。',
  },
  'fan-cheerstick': {
    id: 'fan-cheerstick', name: '单推应援棒', glyph: '🎇', rarity: 'epic', price: 6,
    allowedTypes: ['bella', 'diana', 'xingkongtang'],
    effects: { attackSpeedMultiplier: 1.2 },
    quote: '就算只单推一个人，也要全力应援。',
  },
  'sweet-chocolate': {
    id: 'sweet-chocolate', name: '甜甜巧克力', glyph: '🍫', rarity: 'epic', price: 6,
    allowedTypes: ['jiaxintang', 'naiqilin', 'jiaxinnaitang'],
    effects: { damageMultiplier: 1.25 },
    quote: '甜甜的，就像台下的大家。',
  },
  'star-mic': {
    id: 'star-mic', name: '星愿麦克风', glyph: '🎤', rarity: 'epic', price: 5,
    allowedTypes: ['eileen', 'gladys', 'fiona', 'xilanai'],
    effects: { damageMultiplier: 1.2 },
    quote: '把大家的星愿，唱给所有人听。',
  },
  'zhijiang-umbrella': {
    id: 'zhijiang-umbrella', name: '枝江小雨伞', glyph: '☂️', rarity: 'rare', price: 5,
    allowedTypes: ['xiaohainuo', 'beijixing', 'eileen'],
    effects: { hpMultiplier: 1.5 },
    quote: '枝江多阵雨，出门记得带伞。',
  },
  'pixel-console': {
    id: 'pixel-console', name: '像素游戏机', glyph: '🎮', rarity: 'rare', price: 7,
    allowedTypes: null,
    effects: { attackSpeedMultiplier: 1.15, hpMultiplier: 1.25 },
    quote: '枝江游戏厅的最高分纪录，保持者不详。',
  },
  'tour-ticket': {
    id: 'tour-ticket', name: '巡演纪念票根', glyph: '🎫', rarity: 'rare', price: 7,
    allowedTypes: null,
    effects: { hpMultiplier: 1.3, damageMultiplier: 1.1 },
    quote: '第一场枝江巡演的入场凭证，值得永久珍藏。',
  },
  'glowing-jellyfish': {
    id: 'glowing-jellyfish', name: '应援海月灯', glyph: '🪼', rarity: 'legend', price: 6,
    allowedTypes: ['beijixing', 'xilanai'],
    effects: { produceBonus: 15 },
    quote: '深夜的排练室里，它一直亮着。',
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
  return lines;
}
