import Phaser from 'phaser';
import { ALL_LEVELS } from '../data/levels';

const STORAGE_KEY = 'asoul-stage-progress-v1';

export interface LevelProgress {
  completed: number;
  unlocked: number;
}

function readCompleted(): number {
  try {
    const value = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    return Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, ALL_LEVELS.length) : 0;
  } catch {
    return 0;
  }
}

export function getLevelProgress(): LevelProgress {
  const completed = readCompleted();
  return { completed, unlocked: Math.min(ALL_LEVELS.length, completed + 1) };
}

export function completeLevel(levelId: number): LevelProgress {
  const completed = Math.max(readCompleted(), Phaser.Math.Clamp(levelId, 1, ALL_LEVELS.length));
  try { window.localStorage.setItem(STORAGE_KEY, String(completed)); } catch { /* 无痕模式下只保留本局结果 */ }
  return { completed, unlocked: Math.min(ALL_LEVELS.length, completed + 1) };
}

