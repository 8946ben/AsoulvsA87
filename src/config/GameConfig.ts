/** 全局画布、网格、素材和经济配置。 */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/**
 * 固定 2 倍渲染背板：游戏世界仍使用 1280×720 逻辑坐标，画布从启动时即为 2560×1440。
 * ScaleManager 因此能够同时正确管理清晰度、窗口 FIT 和输入坐标，无需运行时改写画布。
 */
export const RENDER_SCALE = 2;
export const RENDER_WIDTH = GAME_WIDTH * RENDER_SCALE;
export const RENDER_HEIGHT = GAME_HEIGHT * RENDER_SCALE;

export const GRID = {
  COLS: 9,
  ROWS: 5,
  CELL_W: 88,
  CELL_H: 104,
  OFFSET_X: 252,
  OFFSET_Y: 166,
} as const;

/** 战场角色在单个格子中的最大显示范围。 */
export const PLANT_DISPLAY = {
  MAX_W: GRID.CELL_W - 24,
  MAX_H: GRID.CELL_H - 22,
  SHADOW_Y: 34,
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
  PLANT_XINGKONGTANG: 'plant_xingkongtang',
  PLANT_XILANAI: 'plant_xilanai',
  PLANT_JIAXINNAITANG: 'plant_jiaxinnaitang',
  PLANT_YIGEHUN: 'plant_yigehun',
  BELLA_MINE: 'plant_bella_mine',
  EILEEN_SOUP: 'plant_eileen_soup',
  ZOMBIE_BASIC: 'zombie_basic',
  ZOMBIE_PHONE: 'zombie_phone',
  ZOMBIE_FLAG: 'zombie_flag',
  ZOMBIE_SCREEN: 'zombie_screen',
  ZOMBIE_BALLOON: 'zombie_balloon',
  ZOMBIE_LADDER: 'zombie_ladder',
  ZOMBIE_CONE: 'zombie_cone',
  ZOMBIE_FOOTBALL: 'zombie_football',
  ZOMBIE_SLED: 'zombie_sled',
  ZOMBIE_MINER: 'zombie_miner',
  ZOMBIE_BUCKET: 'zombie_bucket',
  ZOMBIE_POLE: 'zombie_pole',
  ZOMBIE_DRAGON: 'zombie_dragon',
  ZOMBIE_KNIGHT: 'zombie_knight',
  ZOMBIE_CAROL: 'zombie_carol',
  CANDY: 'projectile_candy',
  STAR_CANDY: 'projectile_star_candy',
  CANDY_ICE_CREAM: 'projectile_candy_ice_cream',
  SOUL_CANDY: 'projectile_soul_candy',
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
  [TEX.PLANT_BEIJIXING]: 'images/fans-beijixing-v2.png',
  [TEX.PLANT_JIAXINTANG]: 'images/fans-jiaxintang-v2.png',
  [TEX.PLANT_NAIQILIN]: 'images/fans-naiqilin-v2.png',
  [TEX.PLANT_XIAOHAINUO]: 'images/xiaohainuo-v2.png',
  [TEX.PLANT_XINQIUYI]: 'images/xinqiuyi-v2.png',
  [TEX.PLANT_BELLA]: 'images/idol-bella-v2.png',
  [TEX.PLANT_EILEEN]: 'images/idol-eileen-v2.png',
  [TEX.PLANT_DIANA]: 'images/idol-diana-v2.png',
  [TEX.PLANT_GLADYS]: 'images/idol-gladys-v2.png',
  [TEX.PLANT_FIONA]: 'images/idol-fiona-v2.png',
  [TEX.PLANT_XINGKONGTANG]: 'images/plant-xingkongtang-v1.png',
  [TEX.PLANT_XILANAI]: 'images/plant-xilanai-v1.png',
  [TEX.PLANT_JIAXINNAITANG]: 'images/plant-jiaxinnaitang-v1.png',
  [TEX.PLANT_YIGEHUN]: 'images/plant-yigehun-v1.png',
  [TEX.BELLA_MINE]: 'images/bella-potato-mine-v1.png',
  [TEX.EILEEN_SOUP]: 'images/eileen-soup-v2.png',
  [TEX.ZOMBIE_BASIC]: 'images/a87-base-v2.png',
  [TEX.ZOMBIE_PHONE]: 'images/a87-phone-v3.png',
  [TEX.ZOMBIE_FLAG]: 'images/a87-flag-v3.png',
  [TEX.ZOMBIE_SCREEN]: 'images/a87-screen-v3.png',
  [TEX.ZOMBIE_BALLOON]: 'images/a87-balloon-v3.png',
  [TEX.ZOMBIE_LADDER]: 'images/a87-ladder-v3.png',
  [TEX.ZOMBIE_CONE]: 'images/a87-cone-v3.png',
  [TEX.ZOMBIE_FOOTBALL]: 'images/a87-football-v3.png',
  [TEX.ZOMBIE_SLED]: 'images/a87-sled-v3.png',
  [TEX.ZOMBIE_MINER]: 'images/a87-miner-v3.png',
  [TEX.ZOMBIE_BUCKET]: 'images/a87-bucket-v2.png',
  [TEX.ZOMBIE_POLE]: 'images/a87-pole-v2.png',
  [TEX.ZOMBIE_DRAGON]: 'images/a87-dragon-v2.png',
  [TEX.ZOMBIE_CAROL]: 'images/carol-corrupted-v2.png',
  [TEX.SUN]: 'images/sun.png',
} as const;

export const ASSET_SPECS: Record<string, { w: number; h: number }> = {
  // 植物/角色纹理按 2 倍显示尺寸归一化：源图约 1200px，HiDPI 屏上显示约需 160px，
  // 过小的高清源会被先压糊再放大，2 倍规格保证发丝等细节清晰。
  [TEX.PLANT_BEIJIXING]: { w: 172, h: 176 },
  [TEX.PLANT_JIAXINTANG]: { w: 164, h: 188 },
  [TEX.PLANT_NAIQILIN]: { w: 168, h: 188 },
  [TEX.PLANT_XIAOHAINUO]: { w: 156, h: 188 },
  [TEX.PLANT_XINQIUYI]: { w: 156, h: 188 },
  [TEX.PLANT_BELLA]: { w: 156, h: 188 },
  [TEX.PLANT_EILEEN]: { w: 156, h: 188 },
  [TEX.PLANT_DIANA]: { w: 156, h: 188 },
  [TEX.PLANT_GLADYS]: { w: 156, h: 188 },
  [TEX.PLANT_FIONA]: { w: 156, h: 188 },
  [TEX.PLANT_XINGKONGTANG]: { w: 156, h: 188 },
  [TEX.PLANT_XILANAI]: { w: 156, h: 188 },
  [TEX.PLANT_JIAXINNAITANG]: { w: 156, h: 188 },
  [TEX.PLANT_YIGEHUN]: { w: 164, h: 196 },
  [TEX.BELLA_MINE]: { w: 168, h: 136 },
  [TEX.EILEEN_SOUP]: { w: 168, h: 116 },
  [TEX.ZOMBIE_BASIC]: { w: 120, h: 86 },
  [TEX.ZOMBIE_PHONE]: { w: 126, h: 96 },
  [TEX.ZOMBIE_FLAG]: { w: 140, h: 112 },
  [TEX.ZOMBIE_SCREEN]: { w: 132, h: 100 },
  [TEX.ZOMBIE_BALLOON]: { w: 104, h: 130 },
  [TEX.ZOMBIE_LADDER]: { w: 142, h: 104 },
  [TEX.ZOMBIE_CONE]: { w: 126, h: 104 },
  [TEX.ZOMBIE_FOOTBALL]: { w: 140, h: 104 },
  [TEX.ZOMBIE_SLED]: { w: 160, h: 108 },
  [TEX.ZOMBIE_MINER]: { w: 132, h: 104 },
  [TEX.ZOMBIE_BUCKET]: { w: 126, h: 96 },
  [TEX.ZOMBIE_POLE]: { w: 142, h: 100 },
  [TEX.ZOMBIE_DRAGON]: { w: 178, h: 124 },
  [TEX.ZOMBIE_KNIGHT]: { w: 80, h: 100 },
  [TEX.ZOMBIE_CAROL]: { w: 104, h: 118 },
  [TEX.SUN]: { w: 58, h: 58 },
} as const;

export const PALETTE = {
  LAWN_LIGHT: 0x73d78f,
  LAWN_DARK: 0x62c982,
  SUN: 0xffd75e,
  CARD_BG: 0xfffaed,
  CARD_BORDER: 0x79cfe2,
  TEXT_LIGHT: 0x42506d,
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
