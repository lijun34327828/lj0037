import type { BubbleCell, BubbleColor, LevelConfig } from './types.js';

const COLS = 10;

const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, colorCount: 3, descentInterval: 15, maxShots: null, initialRows: 5, eliminateMin: 3 },
  { level: 2, colorCount: 3, descentInterval: 12, maxShots: 30, initialRows: 6, eliminateMin: 3 },
  { level: 3, colorCount: 4, descentInterval: 10, maxShots: 28, initialRows: 6, eliminateMin: 3 },
  { level: 4, colorCount: 4, descentInterval: 8, maxShots: 25, initialRows: 7, eliminateMin: 3 },
];

const ALL_COLORS: BubbleColor[] = ['red', 'orange', 'green', 'blue', 'purple', 'cyan'];

export function getLevelConfig(level: number): LevelConfig {
  if (level >= 1 && level <= LEVEL_CONFIGS.length) {
    return LEVEL_CONFIGS[level - 1];
  }
  return {
    level,
    colorCount: 5,
    descentInterval: 6,
    maxShots: 22,
    initialRows: 7,
    eliminateMin: 3,
  };
}

export function getRandomColor(colorCount: number): BubbleColor {
  const index = Math.floor(Math.random() * colorCount);
  return ALL_COLORS[index];
}

export function generateInitialGrid(level: number): BubbleCell[] {
  const config = getLevelConfig(level);
  const grid: BubbleCell[] = [];

  for (let row = 0; row < config.initialRows; row++) {
    const maxCol = row % 2 === 0 ? COLS : COLS - 1;
    for (let col = 0; col < maxCol; col++) {
      grid.push({
        position: { row, col },
        color: getRandomColor(config.colorCount),
      });
    }
  }

  return grid;
}
