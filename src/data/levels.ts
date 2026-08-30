import type { PlantType } from './plants';
import type { ZombieType } from './zombies';

export interface ZombieSpawnEntry { type: ZombieType; count: number; gap: number; row?: number; }
export interface Wave { delay: number; isHuge?: boolean; title?: string; spawns: ZombieSpawnEntry[]; }

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  startingSun: number;
  availablePlants: PlantType[];
  featuredEnemies: ZombieType[];
  reward: string;
  accent: number;
  waves: Wave[];
}

const spawn = (type: ZombieType, count: number, gap: number, row?: number): ZombieSpawnEntry => ({ type, count, gap, row });
const wave = (delay: number, title: string, spawns: ZombieSpawnEntry[], isHuge = false): Wave => ({ delay, title, spawns, isHuge });

const P1: PlantType[] = ['beijixing', 'jiaxintang'];
const P2: PlantType[] = [...P1, 'naiqilin'];
const P3: PlantType[] = [...P2, 'xiaohainuo'];
const P4: PlantType[] = [...P3, 'xinqiuyi'];
const P5: PlantType[] = [...P4, 'bella'];
const P6: PlantType[] = [...P5, 'eileen'];
const P7: PlantType[] = [...P6, 'diana'];
const P8: PlantType[] = [...P7, 'gladys'];
const P9: PlantType[] = [...P8, 'fiona'];

export const ALL_LEVELS: LevelConfig[] = [
  {
    id: 1, name: '第一幕 · 区区之众', description: '用最基础的产能与射击熟悉舞台防线。',
    startingSun: 200, availablePlants: P1, featuredEnemies: ['basic', 'flag'], reward: '解锁角色卡 · 奶淇琳', accent: 0x58d7ff,
    waves: [
      wave(6000, '零散白虫', [spawn('basic', 2, 3400)]),
      wave(11000, '试探推进', [spawn('basic', 3, 2800)]),
      wave(14000, '第一轮返场', [spawn('basic', 4, 2200)], true),
    ],
  },
  {
    id: 2, name: '第二幕 · 热点追踪', description: '刷手机 A87 失去手机后会暴怒加速。',
    startingSun: 200, availablePlants: P2, featuredEnemies: ['basic', 'cone', 'phone', 'flag'], reward: '解锁角色卡 · 小海诺', accent: 0x6fc6ff,
    waves: [
      wave(6000, '白虫前奏', [spawn('basic', 3, 3000)]),
      wave(9500, '路障登场', [spawn('basic', 4, 2400), spawn('cone', 2, 3200)], true),
      wave(11500, '手机掉落', [spawn('basic', 4, 2200), spawn('phone', 2, 4200), spawn('cone', 1, 0)]),
      wave(13500, '冲上热榜', [spawn('basic', 5, 1900), spawn('phone', 2, 3400), spawn('cone', 2, 3600)], true),
    ],
  },
  {
    id: 3, name: '第三幕 · 铁门骑士', description: '铁门网提供厚重盾牌，需要持续火力击破。',
    startingSun: 225, availablePlants: P3, featuredEnemies: ['basic', 'phone', 'screen', 'flag'], reward: '解锁角色卡 · 心球仪', accent: 0x73e4d3,
    waves: [
      wave(6000, '常规推进', [spawn('basic', 3, 2800)]),
      wave(9500, '骑士的盾', [spawn('basic', 4, 2200), spawn('screen', 2, 3400)], true),
      wave(11000, '铁门推进', [spawn('basic', 4, 2100), spawn('screen', 2, 3600)]),
      wave(13500, '热点护卫', [spawn('basic', 5, 1800), spawn('screen', 2, 3000), spawn('phone', 1, 0)], true),
    ],
  },
  {
    id: 4, name: '第四幕 · 逾山越海', description: '梯子 A87 会绕过第一次遇到的植物障碍。',
    startingSun: 225, availablePlants: P4, featuredEnemies: ['basic', 'screen', 'ladder', 'flag'], reward: '解锁角色卡 · 贝拉', accent: 0xff8eba,
    waves: [
      wave(5500, '白虫铺场', [spawn('basic', 4, 2600)]),
      wave(8500, '铁门压阵', [spawn('basic', 3, 2200), spawn('screen', 2, 3800)], true),
      wave(10500, '梯子试爬', [spawn('basic', 4, 1900), spawn('ladder', 3, 3000)]),
      wave(13000, '铁门梯队', [spawn('basic', 6, 1500), spawn('screen', 3, 2800), spawn('ladder', 3, 2600)], true),
    ],
  },
  {
    id: 5, name: '第五幕 · A8 区能飞', description: '气球 A87 会飞越植物，必须在抵达舞台前击落。',
    startingSun: 250, availablePlants: P5, featuredEnemies: ['basic', 'phone', 'screen', 'balloon', 'flag'], reward: '解锁角色卡 · 乃琳', accent: 0xbf86ff,
    waves: [
      wave(5500, '白虫集结', [spawn('basic', 4, 2500)]),
      wave(8500, '手机护卫', [spawn('basic', 4, 2000), spawn('phone', 2, 3600)], true),
      wave(10500, '气球升空', [spawn('basic', 5, 1700), spawn('balloon', 3, 2800)]),
      wave(14000, 'A8 区能飞', [spawn('basic', 6, 1500), spawn('phone', 2, 3000), spawn('screen', 2, 2800), spawn('balloon', 3, 2600)], true),
    ],
  },
  {
    id: 6, name: '第六幕 · 冲锋号角', description: '橄榄球与撑杆 A87 发起高速冲锋，近线防御迎来考验。',
    startingSun: 250, availablePlants: P6, featuredEnemies: ['basic', 'pole', 'football', 'bucket'], reward: '解锁角色卡 · 嘉然', accent: 0xff668d,
    waves: [
      wave(5000, '白虫先锋', [spawn('basic', 4, 2400)]),
      wave(8000, '撑杆先遣', [spawn('basic', 3, 2100), spawn('pole', 2, 3200)], true),
      wave(10500, '冲锋初阵', [spawn('basic', 5, 1700), spawn('pole', 2, 3000), spawn('football', 1, 0)]),
      wave(13000, '全线冲锋', [spawn('basic', 6, 1500), spawn('pole', 2, 2600), spawn('bucket', 2, 3000), spawn('football', 2, 4200)], true),
    ],
  },
  {
    id: 7, name: '第七幕 · 橄榄球手', description: '新旧特化敌人连续登场，波次间隔进一步缩短。',
    startingSun: 275, availablePlants: P7, featuredEnemies: ['screen', 'ladder', 'football', 'sled', 'flag'], reward: '解锁角色卡 · 思诺', accent: 0xffa15d,
    waves: [
      wave(5000, '密集白虫', [spawn('basic', 5, 2200)]),
      wave(7500, '铁门列队', [spawn('basic', 3, 1900), spawn('screen', 3, 3100)], true),
      wave(9500, '雪橇试车', [spawn('basic', 4, 1600), spawn('ladder', 3, 2600), spawn('sled', 1, 0)]),
      wave(13000, '冲锋返场', [spawn('basic', 6, 1400), spawn('screen', 2, 2600), spawn('football', 2, 3200)], true),
    ],
  },
  {
    id: 8, name: '第八幕 · 飞驰区生', description: '矿工遁地绕后、气球飞越防线，空地夹击考验防线纵深。',
    startingSun: 275, availablePlants: P8, featuredEnemies: ['balloon', 'miner', 'sled', 'flag'], reward: '解锁角色卡 · 心宜', accent: 0x8e8cff,
    waves: [
      wave(5000, '装甲开场', [spawn('basic', 5, 2100), spawn('bucket', 2, 3300)]),
      wave(7500, '梯子穿插', [spawn('basic', 4, 1800), spawn('ladder', 3, 2800)], true),
      wave(9500, '地下绕后', [spawn('basic', 4, 1700), spawn('miner', 3, 3400), spawn('balloon', 2, 3000)]),
      wave(13500, '双重终演', [spawn('basic', 6, 1400), spawn('screen', 3, 2500), spawn('balloon', 3, 2300), spawn('miner', 2, 3200), spawn('sled', 2, 5200)], true),
    ],
  },
  {
    id: 9, name: '第九幕 · 隐藏踪迹', description: '全员到齐，在高密度波次中完成最终彩排。',
    startingSun: 300, availablePlants: P9, featuredEnemies: ['football', 'sled', 'miner', 'ladder'], reward: '解锁最终幕 · 跃跃欲试', accent: 0xff6fba,
    waves: [
      wave(4500, '高密前奏', [spawn('basic', 6, 1900)]),
      wave(7000, '铁门方阵', [spawn('basic', 4, 1700), spawn('screen', 4, 2700)], true),
      wave(10000, '车辆与矿工', [spawn('basic', 4, 1500), spawn('sled', 1, 0), spawn('miner', 3, 3400), spawn('ladder', 2, 2800)]),
      wave(13000, '全阵容返场', [spawn('basic', 8, 1300), spawn('cone', 3, 2200), spawn('screen', 3, 2300), spawn('football', 3, 2600), spawn('miner', 2, 3100)], true),
    ],
  },
  {
    id: 10, name: '第十幕 · 跃跃欲试', description: '全部 A87 倾巢而出，守住最后的灯光。',
    startingSun: 325, availablePlants: P9, featuredEnemies: ['basic', 'screen', 'balloon', 'sled'], reward: '解锁番外篇 · 沸反盈天', accent: 0xd76aff,
    waves: [
      wave(4500, '终局前奏', [spawn('basic', 6, 1800)]),
      wave(7500, '盾墙压境', [spawn('basic', 5, 1500), spawn('screen', 3, 3000), spawn('ladder', 2, 2600)], true),
      wave(11000, '全线压境', [spawn('phone', 4, 2200), spawn('ladder', 4, 2100), spawn('football', 2, 3100), spawn('miner', 2, 3300)]),
      wave(14000, '往日种种', [spawn('basic', 8, 1200), spawn('screen', 3, 2100), spawn('balloon', 3, 2300), spawn('sled', 2, 5200), spawn('miner', 2, 3000)], true),
    ],
  },
  {
    id: 11, name: '第十一幕 · 沸反盈天', description: '番外篇开幕：夜幕降临，A87 残部发起三面旗帜的总攻。',
    startingSun: 350, availablePlants: P9, featuredEnemies: ['screen', 'miner', 'sled', 'football'], reward: '解锁最终幕 · 舞台之争', accent: 0x5d8cff,
    waves: [
      wave(4500, '夜幕先锋', [spawn('basic', 6, 1700)]),
      wave(7000, '铁门夜巡', [spawn('basic', 4, 1600), spawn('screen', 4, 2600)], true),
      wave(10000, '车流涌动', [spawn('basic', 5, 1400), spawn('miner', 3, 3200), spawn('sled', 2, 3800), spawn('football', 1, 0)]),
      wave(13500, '夜幕总攻', [spawn('basic', 8, 1200), spawn('screen', 3, 2200), spawn('balloon', 3, 2100), spawn('sled', 1, 0), spawn('football', 2, 3000)], true),
    ],
  },
  {
    id: 12, name: '第十二幕 · 舞台之争', description: 'Boss 关：神区化龙亲率全部阵容发起总攻。',
    startingSun: 350, availablePlants: P9, featuredEnemies: ['sled', 'miner', 'balloon', 'screen', 'dragon'], reward: '全篇章通关 · 枝江星光奖杯', accent: 0xffd76a,
    waves: [
      wave(4500, '安可前奏', [spawn('basic', 6, 1600)]),
      wave(7000, '盾墙再临', [spawn('screen', 4, 2400), spawn('ladder', 2, 2500)], true),
      wave(9500, '矿工会师', [spawn('basic', 5, 1400), spawn('miner', 4, 3000)]),
      wave(10500, '全械压境', [spawn('phone', 4, 2100), spawn('sled', 2, 3600), spawn('football', 2, 3000)], true),
      wave(12000, '空陆连击', [spawn('balloon', 4, 2200), spawn('ladder', 4, 2000), spawn('screen', 2, 2600)]),
      wave(15000, '神区化龙·终演', [spawn('basic', 9, 1100), spawn('screen', 4, 2000), spawn('balloon', 3, 2000), spawn('football', 2, 2800), spawn('sled', 1, 0), spawn('dragon', 2, 15000)], true),
    ],
  },
];

export const LEVEL_1 = ALL_LEVELS[0];

export function getLevelById(id: number): LevelConfig {
  return ALL_LEVELS[Math.max(0, Math.min(ALL_LEVELS.length - 1, id - 1))];
}

export function getNextLevel(level: LevelConfig): LevelConfig | null {
  return ALL_LEVELS.find((candidate) => candidate.id === level.id + 1) ?? null;
}
