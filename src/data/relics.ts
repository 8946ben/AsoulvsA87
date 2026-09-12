import { PLANTS } from './plants';
import type { PlantType } from './plants';
import { TEX } from '../config/GameConfig';

/**
 * 枝江装备：可通过抽卡转盘获取、可装配给角色的永久强化道具。
 * 设计文档见 background.md「枝江装备」章节，数值与概率以文档为准。
 * effects 中的数值由战斗侧（Plant）直接消费，描述文案由 describeRelicEffects 程序化生成，
 * 保证图鉴/背包展示与实际数值不脱节。
 */
export type RelicId =
  | 'bella-hammer'
  | 'bella-pan'
  | 'joker-small'
  | 'joker-big'
  | 'hotpot-base'
  | 'fakao-book'
  | 'xiaomi-keyboard'
  | 'pointer-01'
  | 'wish-ticket-a'
  | 'wish-ticket-b'
  | 'fan-cheerstick'
  | 'tour-ticket'
  | 'haoting-key'
  | 'nanting-key'
  | 'keyboard-200'
  | 'beijixing-weekly'
  | 'naiqilin-weekly'
  | 'jiaxintang-weekly'
  | 'minus-8000-mic'
  | 'keyboard-20'
  | 'mountain-speaker';

/** 装备品质：D < C < B < A < S */
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
  /** 额外发射的子弹数（嘉心糖周报：连发两枚）。 */
  extraShots?: number;
  /** 奶油停顿时间倍率（奶淇琳周报：翻倍）。 */
  creamStunMultiplier?: number;
  /** 部署冷却时间倍率（0.5 = 减半）。 */
  cooldownMultiplier?: number;
  /** 乃琳地刺（第二形态）伤害倍率。 */
  eileenSpikeDamageMultiplier?: number;
  /** 乃琳地刺（第二形态）影响范围扩大到以自身为中心的九个格子。 */
  eileenSpikeAreaNine?: boolean;
  /** 乃琳第一形态的攻击变为双向。 */
  eileenBeamBidirectional?: boolean;
  /** 乃琳第一形态的攻击以自身所在行为中心覆盖三行（保持单向）。 */
  eileenBeamTripleRow?: boolean;
  /** 条件增援：当战场上存在指定角色时，为该角色追加一份效果（部署时结算）。 */
  grants?: Array<{ type: PlantType; effects: RelicEffects }>;
}

export interface RelicConfig {
  id: RelicId;
  name: string;
  /** 展示用 emoji 图标（无独立图片素材，直接以字形渲染）。 */
  glyph: string;
  /** 已绘制的装备图标纹理；未配置时沿用 emoji 字形。 */
  iconTexture?: string;
  rarity: RelicRarity;
  /** 可装配角色；null 表示全体角色可装配。 */
  allowedTypes: PlantType[] | null;
  effects: RelicEffects;
  quote: string;
  /** 联合装配：与指定装备同时装配时触发强化效果。 */
  synergy?: {
    /** 联动的另一个装备ID。 */
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
  'bella-hammer', 'bella-pan', 'joker-small', 'joker-big', 'hotpot-base', 'fakao-book',
  'xiaomi-keyboard', 'pointer-01', 'wish-ticket-a', 'wish-ticket-b',
  'fan-cheerstick', 'tour-ticket', 'haoting-key', 'nanting-key',
  'keyboard-200', 'beijixing-weekly', 'naiqilin-weekly', 'jiaxintang-weekly',
  'minus-8000-mic', 'keyboard-20', 'mountain-speaker',
];

export const RELICS: Record<RelicId, RelicConfig> = {
  'bella-hammer': {
    id: 'bella-hammer', name: '一个锤子', glyph: '🔨', iconTexture: TEX.RELIC_BELLA_HAMMER, rarity: 's',
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
    id: 'bella-pan', name: '一口平底锅', glyph: '🍳', iconTexture: TEX.RELIC_BELLA_PAN, rarity: 's',
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
  'joker-small': {
    id: 'joker-small', name: '扑克牌-小王', glyph: '🃏', iconTexture: TEX.RELIC_JOKER_SMALL, rarity: 's',
    allowedTypes: ['diana'],
    effects: { attackSpeedMultiplier: 1.5 },
    synergy: {
      with: 'joker-big',
      effects: { damageMultiplier: 2.0 },
      description: '同时装配大王时，攻击力 +100%',
    },
    quote: '小王在手，节奏我有。',
  },
  'joker-big': {
    id: 'joker-big', name: '扑克牌-大王', glyph: '🎴', iconTexture: TEX.RELIC_JOKER_BIG, rarity: 's',
    allowedTypes: ['diana'],
    effects: { damageMultiplier: 2.0 },
    synergy: {
      with: 'joker-small',
      effects: { damageMultiplier: 3.0 },
      description: '同时装配小王时，攻击力 +200%',
    },
    quote: '大王压轴，一锤定音。',
  },
  'hotpot-base': {
    id: 'hotpot-base', name: '大凤沟火锅底料', glyph: '🍲', iconTexture: TEX.RELIC_HOTPOT_BASE, rarity: 's',
    allowedTypes: ['eileen'],
    effects: { eileenSpikeDamageMultiplier: 2 },
    synergy: {
      with: 'fakao-book',
      effects: { eileenSpikeDamageMultiplier: 2, eileenSpikeAreaNine: true },
      description: '同时装配法考宝典时，地刺影响范围扩大到九个格子',
    },
    quote: '大凤沟的配方，辣得很地道。',
  },
  'fakao-book': {
    id: 'fakao-book', name: '枝江法考宝典', glyph: '📖', iconTexture: TEX.RELIC_FAKAO_BOOK, rarity: 's',
    allowedTypes: ['eileen'],
    effects: { eileenBeamBidirectional: true },
    synergy: {
      with: 'hotpot-base',
      effects: { eileenBeamTripleRow: true },
      description: '同时装配火锅底料时，攻击覆盖三行',
    },
    quote: '法考路上，宝典常伴。',
  },
  'xiaomi-keyboard': {
    id: 'xiaomi-keyboard', name: '小爱联名键盘', glyph: '⌨️', rarity: 'a',
    allowedTypes: null,
    effects: { hpMultiplier: 2.0 },
    quote: '小爱同学，随时待命。',
  },
  'pointer-01': {
    id: 'pointer-01', name: '01指针', glyph: '🖱️', rarity: 'a',
    allowedTypes: ['xingkongtang', 'xilanai', 'jiaxinnaitang'],
    effects: { attackSpeedMultiplier: 2.0, damageMultiplier: 1.5 },
    quote: '01 号指针，指哪打哪。',
  },
  'wish-ticket-a': {
    id: 'wish-ticket-a', name: '愿望券A', glyph: '🎟️', rarity: 'a',
    allowedTypes: ['eileen'],
    effects: {
      damageMultiplier: 0.5,
      grants: [{ type: 'bella', effects: { damageMultiplier: 2.5 } }],
    },
    quote: '把愿望分给贝拉一半。',
  },
  'wish-ticket-b': {
    id: 'wish-ticket-b', name: '愿望券B', glyph: '🎟️', rarity: 'a',
    allowedTypes: ['bella'],
    effects: {
      attackSpeedMultiplier: 0.5,
      grants: [{ type: 'eileen', effects: { attackSpeedMultiplier: 3.0 } }],
    },
    quote: '乃琳的舞台，也想出一份力。',
  },
  'fan-cheerstick': {
    id: 'fan-cheerstick', name: 'Asoul应援棒', glyph: '🎇', rarity: 'b',
    allowedTypes: null,
    effects: { attackSpeedMultiplier: 1.5 },
    quote: '为整个 A-SOUL 应援。',
  },
  'tour-ticket': {
    id: 'tour-ticket', name: '线下演出门票', glyph: '🎫', rarity: 'b',
    allowedTypes: null,
    effects: { hpMultiplier: 1.3, damageMultiplier: 1.2 },
    quote: '线下见，才是真正的见面。',
  },
  'haoting-key': {
    id: 'haoting-key', name: '豪庭的钥匙', glyph: '🗝️', rarity: 'b',
    allowedTypes: null,
    effects: { hpRegenPerSec: 50 },
    quote: '豪庭之钥，守护安宁。',
  },
  'nanting-key': {
    id: 'nanting-key', name: '南亭的钥匙', glyph: '🗝️', rarity: 'b',
    allowedTypes: null,
    effects: { damageMultiplier: 1.5 },
    quote: '南亭之钥，锐不可当。',
  },
  'keyboard-200': {
    id: 'keyboard-200', name: '200块的键盘', glyph: '⌨️', rarity: 'c',
    allowedTypes: null,
    effects: { hpMultiplier: 1.3 },
    quote: '性价比之选。',
  },
  'beijixing-weekly': {
    id: 'beijixing-weekly', name: '贝极星周报', glyph: '📰', rarity: 'c',
    allowedTypes: ['beijixing'],
    effects: { produceBonus: 15, hpMultiplier: 2.0 },
    quote: '贝极星 trend，周周更新。',
  },
  'naiqilin-weekly': {
    id: 'naiqilin-weekly', name: '奶淇琳周报', glyph: '📰', rarity: 'c',
    allowedTypes: ['naiqilin'],
    effects: { attackSpeedMultiplier: 1.3, creamStunMultiplier: 2.0 },
    quote: '奶淇琳速报，甜度超标。',
  },
  'jiaxintang-weekly': {
    id: 'jiaxintang-weekly', name: '嘉心糖周报', glyph: '📰', rarity: 'c',
    allowedTypes: ['jiaxintang'],
    effects: { damageMultiplier: 1.3, extraShots: 1 },
    quote: '嘉心糖快讯，糖分拉满。',
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
  'mountain-speaker': {
    id: 'mountain-speaker', name: '群山纹理音响', glyph: '🔊', rarity: 'd',
    allowedTypes: null,
    effects: { cooldownMultiplier: 0.5, hpMultiplier: 0.5, damageMultiplier: 0.5 },
    quote: '群山回响，功过相抵。',
  },
};

const percent = (multiplier: number): string => {
  const delta = Math.round((multiplier - 1) * 100);
  return delta >= 0 ? `+${delta}%` : `${delta}%`;
};

/** 效果数值的程序化描述，背包与图鉴共用，避免文案与数值脱节。 */
export function describeRelicEffects(effects: RelicEffects): string[] {
  const lines: string[] = [];
  if (effects.hpRegenPerSec) lines.push(`装配后每秒回复 ${effects.hpRegenPerSec} 点生命`);
  if (effects.hpMultiplier && effects.hpMultiplier !== 1) lines.push(`生命值 ${percent(effects.hpMultiplier)}`);
  if (effects.damageMultiplier && effects.damageMultiplier !== 1) lines.push(`攻击伤害 ${percent(effects.damageMultiplier)}`);
  if (effects.attackSpeedMultiplier && effects.attackSpeedMultiplier !== 1) lines.push(`攻击速度 ${percent(effects.attackSpeedMultiplier)}`);
  if (effects.produceBonus) lines.push(`每次产出应援额外 +${effects.produceBonus}`);
  if (effects.costMultiplier && effects.costMultiplier !== 1) lines.push(`部署应援消耗 ${percent(effects.costMultiplier)}`);
  if (effects.extraShots) lines.push(`每次攻击连发 ${(effects.extraShots + 1)} 枚子弹`);
  if (effects.creamStunMultiplier && effects.creamStunMultiplier !== 1) lines.push(`奶油停顿时间 ×${effects.creamStunMultiplier}`);
  if (effects.cooldownMultiplier && effects.cooldownMultiplier !== 1) lines.push(`部署冷却时间 ${percent(effects.cooldownMultiplier)}`);
  if (effects.eileenSpikeDamageMultiplier) lines.push(`乃琳地刺形态伤害 ×${effects.eileenSpikeDamageMultiplier}`);
  if (effects.eileenSpikeAreaNine) lines.push('乃琳地刺影响范围扩大到九个格子');
  if (effects.eileenBeamBidirectional) lines.push('乃琳攻击变为双向');
  if (effects.eileenBeamTripleRow) lines.push('乃琳攻击以自身行为中心覆盖三行');
  for (const grant of effects.grants ?? []) {
    const holder = PLANTS[grant.type]?.name ?? grant.type;
    lines.push(`若${holder}在场：其${describeRelicEffects(grant.effects).join('，')}`);
  }
  return lines;
}
