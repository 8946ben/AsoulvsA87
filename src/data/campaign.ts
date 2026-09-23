import { ALL_LEVELS, type LevelConfig } from './levels';

export interface CampaignChapter {
  id: string;
  index: number;
  name: string;
  subtitle: string;
  description?: string;
  accent: number;
  levels: LevelConfig[];
}

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [{
  id: 'chapter-1',
  index: 1,
  name: '枝江初巡',
  subtitle: '敌人来袭',
  accent: 0x62cae8,
  levels: ALL_LEVELS,
}];

export const CHAPTER_1 = CAMPAIGN_CHAPTERS[0];
