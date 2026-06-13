import type { BubbleCell, Position } from './types.js';

const BUBBLE_RADIUS = 15;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRID_OFFSET_Y = 30;
const SHOOTER_Y = 570;
const SHOOTER_X = 200;

export { BUBBLE_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_Y, SHOOTER_X, SHOOTER_Y };

export function gridToPixel(row: number, col: number): { x: number; y: number } {
  let x: number;
  if (row % 2 === 0) {
    x = col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS;
  } else {
    x = col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS * 2;
  }
  const y = row * BUBBLE_RADIUS * Math.sqrt(3) + BUBBLE_RADIUS + GRID_OFFSET_Y;
  return { x, y };
}

export function pixelToGrid(px: number, py: number, grid: BubbleCell[]): Position {
  let bestRow = 0;
  let bestCol = 0;
  let bestDist = Infinity;

  for (let row = 0; row < 20; row++) {
    const maxCol = row % 2 === 0 ? 10 : 9;
    for (let col = 0; col < maxCol; col++) {
      const { x, y } = gridToPixel(row, col);
      const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestRow = row;
        bestCol = col;
      }
    }
  }

  const occupied = grid.some(b => b.position.row === bestRow && b.position.col === bestCol);
  if (!occupied) {
    return { row: bestRow, col: bestCol };
  }

  const neighbors = getNeighbors(bestRow, bestCol);
  let closestNeighbor: Position | null = null;
  let closestNeighborDist = Infinity;

  for (const n of neighbors) {
    if (n.row < 0) continue;
    const maxColN = n.row % 2 === 0 ? 10 : 9;
    if (n.col < 0 || n.col >= maxColN) continue;
    const isOccupied = grid.some(b => b.position.row === n.row && b.position.col === n.col);
    if (isOccupied) continue;
    const { x, y } = gridToPixel(n.row, n.col);
    const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
    if (dist < closestNeighborDist) {
      closestNeighborDist = dist;
      closestNeighbor = n;
    }
  }

  return closestNeighbor ?? { row: bestRow, col: bestCol };
}

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

export function calculateTrajectory(
  angle: number,
  grid: BubbleCell[],
): { trajectory: Array<{ x: number; y: number }>; landedPosition: Position } {
  const trajectory: Array<{ x: number; y: number }> = [];
  let x = SHOOTER_X;
  let y = SHOOTER_Y;
  const rad = angle * Math.PI / 180;
  let dx = Math.cos(rad);
  let dy = -Math.sin(rad);

  const step = 2;
  const maxSteps = 2000;

  for (let i = 0; i < maxSteps; i++) {
    x += dx * step;
    y += dy * step;

    if (x - BUBBLE_RADIUS <= 0) {
      x = BUBBLE_RADIUS;
      dx = -dx;
    }
    if (x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
      x = CANVAS_WIDTH - BUBBLE_RADIUS;
      dx = -dx;
    }

    trajectory.push({ x, y });

    if (y <= GRID_OFFSET_Y + BUBBLE_RADIUS) {
      const landedPosition = pixelToGrid(x, y, grid);
      return { trajectory, landedPosition };
    }

    const hitBubble = checkBubbleCollision(x, y, grid);
    if (hitBubble) {
      x -= dx * step;
      y -= dy * step;
      const landedPosition = pixelToGrid(x, y, grid);
      return { trajectory, landedPosition };
    }
  }

  const landedPosition = pixelToGrid(x, y, grid);
  return { trajectory, landedPosition };
}

function checkBubbleCollision(x: number, y: number, grid: BubbleCell[]): boolean {
  for (const cell of grid) {
    const { x: bx, y: by } = gridToPixel(cell.position.row, cell.position.col);
    const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
    if (dist < BUBBLE_RADIUS * 2) {
      return true;
    }
  }
  return false;
}
