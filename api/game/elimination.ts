import type { BubbleCell, BubbleColor, Position } from './types.js';

function getNeighbors(row: number, col: number): Position[] {
  if (row % 2 === 0) {
    return [
      { row: row - 1, col: col - 1 },
      { row: row - 1, col: col },
      { row: row, col: col - 1 },
      { row: row, col: col + 1 },
      { row: row + 1, col: col - 1 },
      { row: row + 1, col: col },
    ];
  }
  return [
    { row: row - 1, col: col },
    { row: row - 1, col: col + 1 },
    { row: row, col: col - 1 },
    { row: row, col: col + 1 },
    { row: row + 1, col: col },
    { row: row + 1, col: col + 1 },
  ];
}

function isValidPosition(row: number, col: number): boolean {
  if (row < 0) return false;
  const maxCol = row % 2 === 0 ? 10 : 9;
  return col >= 0 && col < maxCol;
}

export function findConnectedSameColor(grid: BubbleCell[], start: Position): BubbleCell[] {
  const startCell = grid.find(
    b => b.position.row === start.row && b.position.col === start.col,
  );
  if (!startCell) return [];

  const targetColor = startCell.color;
  const visited = new Set<string>();
  const result: BubbleCell[] = [];
  const queue: Position[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.row},${current.col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid.find(
      b => b.position.row === current.row && b.position.col === current.col,
    );
    if (!cell || cell.color !== targetColor) continue;

    result.push(cell);

    const neighbors = getNeighbors(current.row, current.col);
    for (const n of neighbors) {
      if (!isValidPosition(n.row, n.col)) continue;
      const nKey = `${n.row},${n.col}`;
      if (!visited.has(nKey)) {
        queue.push(n);
      }
    }
  }

  return result;
}

export function findFloatingBubbles(grid: BubbleCell[]): BubbleCell[] {
  const reachable = new Set<string>();
  const queue: Position[] = [];

  for (const cell of grid) {
    if (cell.position.row === 0) {
      const key = `${cell.position.row},${cell.position.col}`;
      reachable.add(key);
      queue.push(cell.position);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = getNeighbors(current.row, current.col);
    for (const n of neighbors) {
      if (!isValidPosition(n.row, n.col)) continue;
      const nKey = `${n.row},${n.col}`;
      if (reachable.has(nKey)) continue;
      const exists = grid.some(
        b => b.position.row === n.row && b.position.col === n.col,
      );
      if (exists) {
        reachable.add(nKey);
        queue.push(n);
      }
    }
  }

  return grid.filter(b => {
    const key = `${b.position.row},${b.position.col}`;
    return !reachable.has(key);
  });
}

export function processElimination(
  grid: BubbleCell[],
  landedPosition: Position,
  landedColor: BubbleColor,
  eliminateMin: number,
): { eliminated: BubbleCell[]; floatingEliminated: BubbleCell[]; updatedGrid: BubbleCell[] } {
  const landedCell: BubbleCell = {
    position: landedPosition,
    color: landedColor,
  };

  const gridWithLanded = [...grid, landedCell];

  const connected = findConnectedSameColor(gridWithLanded, landedPosition);

  let eliminated: BubbleCell[] = [];
  let gridAfterElimination = gridWithLanded;

  if (connected.length >= eliminateMin) {
    const eliminatedKeys = new Set(
      connected.map(b => `${b.position.row},${b.position.col}`),
    );
    eliminated = connected;
    gridAfterElimination = gridWithLanded.filter(
      b => !eliminatedKeys.has(`${b.position.row},${b.position.col}`),
    );
  }

  const floatingEliminated = findFloatingBubbles(gridAfterElimination);

  if (floatingEliminated.length > 0) {
    const floatingKeys = new Set(
      floatingEliminated.map(b => `${b.position.row},${b.position.col}`),
    );
    gridAfterElimination = gridAfterElimination.filter(
      b => !floatingKeys.has(`${b.position.row},${b.position.col}`),
    );
  }

  return {
    eliminated,
    floatingEliminated,
    updatedGrid: gridAfterElimination,
  };
}
