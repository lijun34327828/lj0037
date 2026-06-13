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
