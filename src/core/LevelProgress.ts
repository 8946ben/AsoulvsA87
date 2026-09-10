import Phaser from 'phaser';
import { ALL_LEVELS } from '../data/levels';

const LEGACY_STORAGE_KEY = 'asoul-stage-progress-v1';
const STORAGE_KEY = 'asoul-campaign-progress-v2';
const CHAPTER_ID = 'chapter-1';

export interface LevelProgress {
  completed: number;
  unlocked: number;
}

interface CampaignProgressV2 { version: 2; chapters: Record<string, number>; }

function readCompleted(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CampaignProgressV2>;
      const value = parsed.chapters?.[CHAPTER_ID] ?? 0;
      return Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, ALL_LEVELS.length) : 0;
    }
    const value = Number.parseInt(window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? '0', 10);
    if (Number.isFinite(value) && value > 0) writeCompleted(value);
    return Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, ALL_LEVELS.length) : 0;
  } catch {
    return 0;
  }
}

function writeCompleted(completed: number): void {
  const progress: CampaignProgressV2 = { version: 2, chapters: { [CHAPTER_ID]: Phaser.Math.Clamp(completed, 0, ALL_LEVELS.length) } };
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* 无痕模式下只保留本局结果 */ }
}

export function getLevelProgress(): LevelProgress {
  const completed = readCompleted();
  return { completed, unlocked: Math.min(ALL_LEVELS.length, completed + 1) };
}

export function completeLevel(levelId: number): LevelProgress {
  const completed = Math.max(readCompleted(), Phaser.Math.Clamp(levelId, 1, ALL_LEVELS.length));
  writeCompleted(completed);
  return { completed, unlocked: Math.min(ALL_LEVELS.length, completed + 1) };
}
