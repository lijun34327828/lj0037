import { Router, type Request, type Response } from 'express';
import { getLevelConfig, generateInitialGrid, getRandomColor } from '../game/level.js';
import { calculateTrajectory } from '../game/ballistic.js';
import { processElimination } from '../game/elimination.js';
import { calculateScore } from '../game/score.js';
import type { BubbleCell, LevelConfig } from '../game/types.js';

const router = Router();

router.post('/start', async (req: Request, res: Response): Promise<void> => {
  const level = req.body.level ?? 1;
  const levelConfig = getLevelConfig(level);
  const grid = generateInitialGrid(level);
  const nextColor = getRandomColor(levelConfig.colorCount);
  const shotsRemaining = levelConfig.maxShots;

  res.json({
    grid,
    nextColor,
    levelConfig,
    score: 0,
    shotsRemaining,
  });
});

router.post('/shoot', async (req: Request, res: Response): Promise<void> => {
  const { grid, angle, shootColor, levelConfig, shotsRemaining, score } = req.body as {
    grid: BubbleCell[];
    angle: number;
    shootColor: string;
    levelConfig: LevelConfig;
    shotsRemaining: number | null;
    score: number;
  };

  const { trajectory, landedPosition } = calculateTrajectory(angle, grid);

  const { eliminated, floatingEliminated, updatedGrid } = processElimination(
    grid,
    landedPosition,
    shootColor as BubbleCell['color'],
    levelConfig.eliminateMin,
  );

  const scoreGained = calculateScore(eliminated, floatingEliminated);
  const totalScore = score + scoreGained;

  let newShotsRemaining = shotsRemaining;
  if (newShotsRemaining !== null) {
    newShotsRemaining = newShotsRemaining - 1;
  }

  const gameOver = updatedGrid.some(b => b.position.row >= 18) || (newShotsRemaining !== null && newShotsRemaining <= 0 && updatedGrid.length > 0);
  const levelComplete = updatedGrid.length === 0;

  const nextColor = getRandomColor(levelConfig.colorCount);

  res.json({
    trajectory,
    landedPosition,
    updatedGrid,
    eliminated,
    floatingEliminated,
    scoreGained,
    totalScore,
    shotsRemaining: newShotsRemaining,
    gameOver,
    levelComplete,
    nextColor,
  });
});

router.get('/levels', async (req: Request, res: Response): Promise<void> => {
  const levels = [];
  for (let i = 1; i <= 5; i++) {
    levels.push(getLevelConfig(i));
  }
  res.json(levels);
});

export default router;
