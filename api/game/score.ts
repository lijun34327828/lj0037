import type { BubbleCell } from './types.js';

export function calculateScore(eliminated: BubbleCell[], floatingEliminated: BubbleCell[]): number {
  return eliminated.length * 10 + floatingEliminated.length * 5;
}
