export type BubbleColor = 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'cyan';

export interface Position {
  row: number;
  col: number;
}

export interface BubbleCell {
  position: Position;
  color: BubbleColor;
}

export interface LevelConfig {
  level: number;
  colorCount: number;
  descentInterval: number;
  maxShots: number | null;
  initialRows: number;
  eliminateMin: number;
}

export interface ShootResult {
  trajectory: Array<{ x: number; y: number }>;
  landedPosition: Position;
  updatedGrid: BubbleCell[];
  eliminated: BubbleCell[];
  floatingEliminated: BubbleCell[];
  scoreGained: number;
  totalScore: number;
  shotsRemaining: number | null;
  gameOver: boolean;
  levelComplete: boolean;
  nextColor: BubbleColor;
  previewColor: BubbleColor;
}

export interface GameStartResult {
  grid: BubbleCell[];
  nextColor: BubbleColor;
  previewColor: BubbleColor;
  levelConfig: LevelConfig;
  score: number;
  shotsRemaining: number | null;
}
