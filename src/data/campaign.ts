import { ALL_LEVELS, type LevelConfig } from './levels';

export interface CampaignChapter {
  id: string;
  index: number;
  name: string;
  subtitle: string;
  description: string;
  accent: number;
  levels: LevelConfig[];
}

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [{
  id: 'chapter-1',
  index: 1,
  name: '枝江初巡',
  subtitle: '白虫来袭',
  description: '当前十二幕关卡收录为闯关模式第一章。守住舞台，逐步解锁角色与融合配方。',
  accent: 0x62cae8,
  levels: ALL_LEVELS,
}];

export const CHAPTER_1 = CAMPAIGN_CHAPTERS[0];
