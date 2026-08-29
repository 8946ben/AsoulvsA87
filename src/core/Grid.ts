import Phaser from 'phaser';
import { GRID } from '../config/GameConfig';
import type { Plant } from '../entities/Plant';

export interface CellPos {
  row: number;
  col: number;
}

/**
 * 草坪网格：负责坐标换算与格子占用管理。
 * 所有实体通过它定位，种植/移除只改这里的状态。
 */
export class Grid {
  private readonly cells: (Plant | null)[][];

  constructor(
    readonly rows: number = GRID.ROWS,
    readonly cols: number = GRID.COLS,
  ) {
    this.cells = Array.from({ length: rows }, () => Array<Plant | null>(cols).fill(null));
  }

  /** 格子中心 → 世界坐标 */
  cellToWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: GRID.OFFSET_X + col * GRID.CELL_W + GRID.CELL_W / 2,
      y: GRID.OFFSET_Y + row * GRID.CELL_H + GRID.CELL_H / 2,
    };
  }

  /** 世界坐标 → 格子，越界返回 null */
  worldToCell(x: number, y: number): CellPos | null {
    const col = Math.floor((x - GRID.OFFSET_X) / GRID.CELL_W);
    const row = Math.floor((y - GRID.OFFSET_Y) / GRID.CELL_H);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return { row, col };
  }

  /** 行中心 y 坐标 */
  rowToY(row: number): number {
    return GRID.OFFSET_Y + row * GRID.CELL_H + GRID.CELL_H / 2;
  }

  /** 世界 y 坐标 → 行（不校验越界，用于僵尸出生） */
  yToRow(y: number): number {
    return Phaser.Math.Clamp(
      Math.floor((y - GRID.OFFSET_Y) / GRID.CELL_H),
      0,
      this.rows - 1,
    );
  }

  isOccupied(row: number, col: number): boolean {
    return this.cells[row][col] !== null;
  }

  get(row: number, col: number): Plant | null {
    return this.cells[row][col];
  }

  place(plant: Plant, row: number, col: number): void {
    this.cells[row][col] = plant;
  }

  remove(row: number, col: number): void {
    this.cells[row][col] = null;
  }

  clear(): void {
    for (let r = 0; r < this.rows; r++) {
      this.cells[r].fill(null);
    }
  }
}
