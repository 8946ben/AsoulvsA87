/** 全局画布、网格、素材和经济配置。 */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const GRID = {
  COLS: 9,
  ROWS: 5,
  CELL_W: 88,
  CELL_H: 104,
  OFFSET_X: 252,
  OFFSET_Y: 166,
} as const;

export const SEEDBANK_HEIGHT = 132;
export const HOUSE_LINE_X = 196;
export const LAWNMOWER_X = 218;
export const ZOMBIE_SPAWN_X = GAME_WIDTH + 70;

export const TEX = {
  LAWN_LIGHT: 'lawn_light',
  LAWN_DARK: 'lawn_dark',
  PLANT_BEIJIXING: 'plant_beijixing',
  PLANT_JIAXINTANG: 'plant_jiaxintang',
  PLANT_NAIQILIN: 'plant_naiqilin',
  PLANT_XIAOHAINUO: 'plant_xiaohainuo',
  PLANT_XINQIUYI: 'plant_xinqiuyi',
  PLANT_BELLA: 'plant_bella',
  PLANT_EILEEN: 'plant_eileen',
  PLANT_DIANA: 'plant_diana',
  PLANT_GLADYS: 'plant_gladys',
  PLANT_FIONA: 'plant_fiona',
  ZOMBIE_BASIC: 'zombie_basic',
  ZOMBIE_BUCKET: 'zombie_bucket',
  ZOMBIE_POLE: 'zombie_pole',
  ZOMBIE_DRAGON: 'zombie_dragon',
  ZOMBIE_KNIGHT: 'zombie_knight',
  ZOMBIE_CAROL: 'zombie_carol',
  CANDY: 'projectile_candy',
  CHOCOLATE: 'projectile_chocolate',
  CREAM: 'projectile_cream',
  HAMMER: 'projectile_hammer',
  BEAM: 'projectile_beam',
  SUN: 'sun',
  LAWNMOWER: 'lawnmower',
  CARD_FRAME: 'card_frame',
} as const;

/** 真实素材。其余纹理由 TextureFactory 程序化补齐。 */
export const ASSETS: Record<string, string> = {
  [TEX.PLANT_BEIJIXING]: 'images/fans_beijixing.png',
  [TEX.PLANT_JIAXINTANG]: 'images/fans_jiaxintang.png',
  [TEX.PLANT_NAIQILIN]: 'images/fans_naiqilin.png',
  [TEX.PLANT_BELLA]: 'images/idol_bella.png',
  [TEX.PLANT_EILEEN]: 'images/idol_eileen.png',
  [TEX.PLANT_DIANA]: 'images/idol_diana.png',
  [TEX.PLANT_GLADYS]: 'images/idol_gladys.png',
  [TEX.PLANT_FIONA]: 'images/idol_fiona.png',
  [TEX.ZOMBIE_BASIC]: 'images/a87-base-v2.png',
  [TEX.ZOMBIE_BUCKET]: 'images/a87-bucket-v2.png',
  [TEX.ZOMBIE_POLE]: 'images/a87-pole-v2.png',
  [TEX.ZOMBIE_DRAGON]: 'images/a87-dragon-v2.png',
  [TEX.SUN]: 'images/sun.png',
} as const;

export const ASSET_SPECS: Record<string, { w: number; h: number }> = {
  [TEX.PLANT_BEIJIXING]: { w: 78, h: 94 },
  [TEX.PLANT_JIAXINTANG]: { w: 78, h: 94 },
  [TEX.PLANT_NAIQILIN]: { w: 78, h: 94 },
  [TEX.PLANT_XIAOHAINUO]: { w: 78, h: 94 },
  [TEX.PLANT_XINQIUYI]: { w: 78, h: 94 },
  [TEX.PLANT_BELLA]: { w: 78, h: 94 },
  [TEX.PLANT_EILEEN]: { w: 78, h: 94 },
  [TEX.PLANT_DIANA]: { w: 78, h: 94 },
  [TEX.PLANT_GLADYS]: { w: 78, h: 94 },
  [TEX.PLANT_FIONA]: { w: 78, h: 94 },
  [TEX.ZOMBIE_BASIC]: { w: 120, h: 86 },
  [TEX.ZOMBIE_BUCKET]: { w: 126, h: 96 },
  [TEX.ZOMBIE_POLE]: { w: 142, h: 100 },
  [TEX.ZOMBIE_DRAGON]: { w: 178, h: 124 },
  [TEX.ZOMBIE_KNIGHT]: { w: 80, h: 100 },
  [TEX.ZOMBIE_CAROL]: { w: 104, h: 118 },
  [TEX.SUN]: { w: 58, h: 58 },
} as const;

export const PALETTE = {
  LAWN_LIGHT: 0x4faa78,
  LAWN_DARK: 0x40966b,
  SUN: 0xffd75e,
  CARD_BG: 0x18243a,
  CARD_BORDER: 0x6fe4ff,
  TEXT_LIGHT: 0xf4fbff,
} as const;

export const SUN_RULES = {
  START_SUN: 150,
  SKY_DROP_INTERVAL: 9000,
  SKY_DROP_AMOUNT: 25,
  FALL_SPEED: 48,
  LIFETIME: 12000,
  DROP_MIN_X: GRID.OFFSET_X + 42,
  DROP_MAX_X: GRID.OFFSET_X + GRID.COLS * GRID.CELL_W - 42,
  DROP_MIN_Y: GRID.OFFSET_Y + 52,
  DROP_MAX_Y: GAME_HEIGHT - 48,
} as const;
