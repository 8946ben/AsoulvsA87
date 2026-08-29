/**
 * 全局游戏配置：画布、网格、配色与通用数值。
 * 美术资源就绪后，只需替换 TEXTURES 中对应的 key，逻辑层无需改动。
 */

export const GAME_WIDTH = 1000;
export const GAME_HEIGHT = 600;

/** 草坪网格：9 列 × 5 行（与原版 PVZ 一致） */
export const GRID = {
  COLS: 9,
  ROWS: 5,
  CELL_W: 80,
  CELL_H: 100,
  /** 草坪左上角在世界坐标中的位置 */
  OFFSET_X: 250,
  OFFSET_Y: 100,
} as const;

/** 顶部卡片栏高度 */
export const SEEDBANK_HEIGHT = 100;

/** 僵尸越过此 x 坐标即触发小推车 / 判定失败 */
export const HOUSE_LINE_X = 200;

/** 小推车停靠的 x 坐标 */
export const LAWNMOWER_X = 215;

/** 僵尸出生点（画布右侧外） */
export const ZOMBIE_SPAWN_X = GAME_WIDTH + 60;

/** 纹理 key 常量表 */
export const TEX = {
  LAWN_LIGHT: 'lawn_light',
  LAWN_DARK: 'lawn_dark',
  PLANT_SUNFLOWER: 'plant_sunflower',
  PLANT_PEASHOOTER: 'plant_peashooter',
  PLANT_WALLNUT: 'plant_wallnut',
  PLANT_FIONA: 'plant_fiona',
  PLANT_GLADYS: 'plant_gladys',
  PLANT_AVA: 'plant_ava',
  ZOMBIE_BASIC: 'zombie_basic',
  ZOMBIE_CONE: 'zombie_cone',
  ZOMBIE_BUCKET: 'zombie_bucket',
  PEA: 'pea',
  SUN: 'sun',
  LAWNMOWER: 'lawnmower',
  CARD_FRAME: 'card_frame',
} as const;

/**
 * 真实美术资源映射：TEX key → public/ 下的资源路径。
 *
 * 采用「渐进替换」策略：文件存在就加载真实图，缺失则自动回退到
 * TextureFactory 生成的占位图，因此可以随时增删条目而不会导致崩溃。
 * 后续制作 idol / A87 素材时，只需往这里加一行。
 */
export const ASSETS: Record<string, string> = {
  // 6 位 idol（按行为分组，每组 2 个角色供选择）
  [TEX.PLANT_SUNFLOWER]: 'images/idol_diana.png',   // 嘉然 · producer
  [TEX.PLANT_PEASHOOTER]: 'images/idol_bella.png',  // 贝拉 · shooter
  [TEX.PLANT_WALLNUT]: 'images/idol_eileen.png',    // 乃琳 · wall
  [TEX.PLANT_FIONA]: 'images/idol_fiona.png',       // 心宜 · producer
  [TEX.PLANT_GLADYS]: 'images/idol_gladys.png',     // 思诺 · shooter
  [TEX.PLANT_AVA]: 'images/idol_ava.png',           // 向晚 · wall
  // 应援子弹 / 阳光
  [TEX.PEA]: 'images/bullet.png',
  [TEX.SUN]: 'images/sun.png',
  // A87 僵尸方（基础 + 进阶化龙；路障位继续用占位图）
  [TEX.ZOMBIE_BASIC]: 'images/a87_basic.png',
  [TEX.ZOMBIE_BUCKET]: 'images/a87_dragon.png',
  // ZOMBIE_CONE 不加入 ASSETS，自动回退到占位
} as const;

/**
 * 各素材规范化后的目标尺寸（像素）。
 *
 * AI 生成图原始分辨率各异（多为 1024×1024），AssetNormalizer 会裁掉白边
 * 后等比缩放到这里声明的尺寸。数值与 TextureFactory 占位图保持一致，
 * 因此实体层（Plant / Zombie / Projectile / Sun）无需任何适配代码。
 */
export const ASSET_SPECS: Record<string, { w: number; h: number }> = {
  // 植物：与占位图同为 80×96，正好放进 80×100 的格子
  [TEX.PLANT_SUNFLOWER]: { w: 80, h: 96 },
  [TEX.PLANT_PEASHOOTER]: { w: 80, h: 96 },
  [TEX.PLANT_WALLNUT]: { w: 80, h: 96 },
  [TEX.PLANT_FIONA]: { w: 80, h: 96 },
  [TEX.PLANT_GLADYS]: { w: 80, h: 96 },
  [TEX.PLANT_AVA]: { w: 80, h: 96 },
  // 僵尸：与占位图同为 64×96
  [TEX.ZOMBIE_BASIC]: { w: 64, h: 96 },
  [TEX.ZOMBIE_CONE]: { w: 64, h: 96 },
  [TEX.ZOMBIE_BUCKET]: { w: 64, h: 96 },
  // 子弹略大于占位图（原 20×20），保证应援心看得清
  [TEX.PEA]: { w: 22, h: 22 },
  // 阳光：占位图为 64×64，略收一点避免与格子重叠
  [TEX.SUN]: { w: 62, h: 62 },
} as const;

/** 占位美术使用的配色（后续替换为真实图片后可忽略） */
export const PALETTE = {
  LAWN_LIGHT: 0x5fbf3a,
  LAWN_DARK: 0x53a832,
  SKY_TOP: 0x87ceeb,
  SKY_BOTTOM: 0xc9e8f5,
  SUN: 0xffd93b,
  PEA: 0x4caf50,
  WALLNUT: 0xb5793a,
  ZOMBIE_SKIN: 0x8fae7b,
  ZOMBIE_CLOTH: 0x5a6b7d,
  CARD_BG: 0x4a3b2a,
  CARD_BORDER: 0x8b6f47,
  TEXT_DARK: 0x2b2b2b,
  TEXT_LIGHT: 0xfff8dc,
} as const;

/**
 * 阳光经济数值（参考原版 PVZ 的经典平衡性，属于通用塔防数值，不含受版权保护的表达）
 */
export const SUN_RULES = {
  /** 关卡初始阳光 */
  START_SUN: 50,
  /** 天空自然掉落阳光的间隔（毫秒） */
  SKY_DROP_INTERVAL: 10000,
  /** 单次掉落阳光值 */
  SKY_DROP_AMOUNT: 25,
  /** 阳光掉落速度（像素/秒） */
  FALL_SPEED: 40,
  /** 阳光在地面停留多久后消失（毫秒） */
  LIFETIME: 12000,
  /** 天空掉落的落点范围 */
  DROP_MIN_X: GRID.OFFSET_X + 40,
  DROP_MAX_X: GAME_WIDTH - 40,
  DROP_MIN_Y: GRID.OFFSET_Y + 60,
  DROP_MAX_Y: GAME_HEIGHT - 60,
} as const;
