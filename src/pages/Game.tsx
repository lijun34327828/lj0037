import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { startGame, shootBubble } from '@/lib/gameApi';
import type { BubbleCell, ShootResult, BubbleColor } from '@/lib/gameTypes';
import BubbleCanvas from '@/components/BubbleCanvas';
import GameHUD from '@/components/GameHUD';
import GameOverlay from '@/components/GameOverlay';

const BUBBLE_RADIUS = 15;
const CANVAS_WIDTH = 400;
const SHOOTER_X = 200;
const SHOOTER_Y = 570;
const GRID_OFFSET_Y = 30;

const COLOR_HEX: Record<BubbleColor, string> = {
  red: '#ff4757',
  orange: '#ffa502',
  green: '#2ed573',
  blue: '#1e90ff',
  purple: '#a55eea',
  cyan: '#00d2d3',
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

function gridToPixel(row: number, col: number) {
  const x = row % 2 === 0 ? col * 30 + 15 : col * 30 + 30;
  const y = row * 15 * Math.sqrt(3) + 15 + GRID_OFFSET_Y;
  return { x, y };
}

function spawnParticles(cells: BubbleCell[]): Particle[] {
  const particles: Particle[] = [];
  for (const cell of cells) {
    const { x, y } = gridToPixel(cell.position.row, cell.position.col);
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLOR_HEX[cell.color],
        life: 30 + Math.random() * 20,
        maxLife: 30 + Math.random() * 20,
      });
    }
  }
  return particles;
}

export default function Game() {
  const store = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [trajectory, setTrajectory] = useState<Array<{ x: number; y: number }>>([]);
  const [trajectoryProgress, setTrajectoryProgress] = useState(0);
  const [eliminatingCells, setEliminatingCells] = useState<BubbleCell[]>([]);

  const descentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number>(0);
  const shootAnimRef = useRef<number>(0);
  const particleFrameRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const initGame = useCallback(async (level?: number) => {
    try {
      const result = await startGame(level);
      if (!isMountedRef.current) return;
      store.setGrid(result.grid);
      store.setNextColor(result.nextColor);
      store.setLevelConfig(result.levelConfig);
      store.setScore(result.score);
      store.setShotsRemaining(result.shotsRemaining);
      store.setLevel(result.levelConfig.level);
      store.setGameOver(false);
      store.setLevelComplete(false);
      store.setPaused(false);
      store.setShooting(false);
      store.setAimAngle(90);
      store.setParticles([]);
      store.setDescentTimer(0);
      setTrajectory([]);
      setTrajectoryProgress(0);
      setEliminatingCells([]);

      const savedHigh = parseInt(localStorage.getItem('bubbleHighScore') || '0', 10);
      store.setHighScore(savedHigh);
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  }, []);

  const startDescentTimer = useCallback(() => {
    if (descentIntervalRef.current) clearInterval(descentIntervalRef.current);
    const config = useGameStore.getState().levelConfig;
    if (!config) return;

    descentIntervalRef.current = setInterval(() => {
      const state = useGameStore.getState();
      if (state.isPaused || state.isGameOver || state.isLevelComplete || state.isShooting) return;

      const currentGrid = state.grid;
      const shiftedGrid = currentGrid.map((cell) => ({
        ...cell,
        position: { row: cell.position.row + 1, col: cell.position.col },
      }));

      const colors: BubbleColor[] = ['red', 'orange', 'green', 'blue', 'purple', 'cyan'];
      const availableColors = colors.slice(0, config.colorCount);
      const colsInEvenRow = 10;
      const colsInOddRow = 9;
      const newCells: BubbleCell[] = [];
      for (let c = 0; c < colsInEvenRow; c++) {
        newCells.push({
          position: { row: 0, col: c },
          color: availableColors[Math.floor(Math.random() * availableColors.length)],
        });
      }
      for (let c = 0; c < colsInOddRow; c++) {
        newCells.push({
          position: { row: 1, col: c },
          color: availableColors[Math.floor(Math.random() * availableColors.length)],
        });
      }

      state.setGrid([...newCells, ...shiftedGrid]);
    }, config.descentInterval * 1000);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    initGame(1);
    return () => {
      isMountedRef.current = false;
      if (descentIntervalRef.current) clearInterval(descentIntervalRef.current);
      cancelAnimationFrame(animFrameRef.current);
      cancelAnimationFrame(shootAnimRef.current);
      cancelAnimationFrame(particleFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!store.isPaused && !store.isGameOver && !store.isLevelComplete && store.levelConfig) {
      startDescentTimer();
    } else {
      if (descentIntervalRef.current) clearInterval(descentIntervalRef.current);
    }
    return () => {
      if (descentIntervalRef.current) clearInterval(descentIntervalRef.current);
    };
  }, [store.isPaused, store.isGameOver, store.isLevelComplete, store.levelConfig]);

  useEffect(() => {
    if (store.score > store.highScore) {
      store.setHighScore(store.score);
      localStorage.setItem('bubbleHighScore', String(store.score));
    }
  }, [store.score]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (store.isShooting || store.isPaused || store.isGameOver || store.isLevelComplete) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = CANVAS_WIDTH / rect.width;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * (600 / rect.height);
      const dx = mx - SHOOTER_X;
      const dy = SHOOTER_Y - my;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 10) angle = 10;
      if (angle > 170) angle = 170;
      store.setAimAngle(angle);
    },
    [store.isShooting, store.isPaused, store.isGameOver, store.isLevelComplete]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (store.isShooting || store.isPaused || store.isGameOver || store.isLevelComplete) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const touch = e.touches[0];
      const scaleX = CANVAS_WIDTH / rect.width;
      const mx = (touch.clientX - rect.left) * scaleX;
      const my = (touch.clientY - rect.top) * (600 / rect.height);
      const dx = mx - SHOOTER_X;
      const dy = SHOOTER_Y - my;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 10) angle = 10;
      if (angle > 170) angle = 170;
      store.setAimAngle(angle);
    },
    [store.isShooting, store.isPaused, store.isGameOver, store.isLevelComplete]
  );

  const doShoot = useCallback(async () => {
    const state = useGameStore.getState();
    if (state.isShooting || state.isPaused || state.isGameOver || state.isLevelComplete) return;
    if (!state.levelConfig) return;

    state.setShooting(true);
    const angle = state.aimAngle;

    try {
      const result: ShootResult = await shootBubble({
        grid: state.grid,
        angle,
        shootColor: state.nextColor,
        levelConfig: state.levelConfig,
        shotsRemaining: state.shotsRemaining,
        score: state.score,
      });

      if (!isMountedRef.current) return;

      setTrajectory(result.trajectory);
      setTrajectoryProgress(0);

      const totalFrames = Math.ceil(result.trajectory.length / 2);
      let frame = 0;

      const animate = () => {
        frame++;
        const progress = Math.min(frame / totalFrames, 1);
        setTrajectoryProgress(progress);

        if (progress < 1) {
          shootAnimRef.current = requestAnimationFrame(animate);
        } else {
          if (!isMountedRef.current) return;

          const allEliminated = [...result.eliminated, ...result.floatingEliminated];
          if (allEliminated.length > 0) {
            setEliminatingCells(allEliminated);
            const newParticles = spawnParticles(allEliminated);
            const currentParticles = useGameStore.getState().particles;
            store.setParticles([...currentParticles, ...newParticles]);
          }

          store.setGrid(result.updatedGrid);
          store.setScore(result.totalScore);
          store.setShotsRemaining(result.shotsRemaining);
          store.setNextColor(result.nextColor);
          store.setGameOver(result.gameOver);
          store.setLevelComplete(result.levelComplete);
          store.setShooting(false);
          setTrajectory([]);
          setTrajectoryProgress(0);

          setTimeout(() => {
            if (isMountedRef.current) setEliminatingCells([]);
          }, 300);
        }
      };

      shootAnimRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error('Shoot failed:', err);
      store.setShooting(false);
    }
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      doShoot();
    },
    [doShoot]
  );

  const handleTap = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const touch = e.changedTouches[0];
      const scaleX = CANVAS_WIDTH / rect.width;
      const mx = (touch.clientX - rect.left) * scaleX;
      const my = (touch.clientY - rect.top) * (600 / rect.height);
      const dx = mx - SHOOTER_X;
      const dy = SHOOTER_Y - my;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 10) angle = 10;
      if (angle > 170) angle = 170;
      store.setAimAngle(angle);

      setTimeout(() => doShoot(), 0);
    },
    [doShoot]
  );

  useEffect(() => {
    const particles = useGameStore.getState().particles;
    if (particles.length === 0) return;

    const tick = () => {
      const current = useGameStore.getState().particles;
      if (current.length === 0) return;

      const updated = current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.05,
          life: p.life - 1,
        }))
        .filter((p) => p.life > 0);

      store.setParticles(updated);

      if (updated.length > 0) {
        particleFrameRef.current = requestAnimationFrame(tick);
      }
    };

    particleFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(particleFrameRef.current);
  }, [store.particles.length]);

  useEffect(() => {
    const onRestart = () => {
      store.reset();
      initGame(1);
    };
    const onNextLevel = () => {
      const nextLvl = useGameStore.getState().level + 1;
      store.reset();
      initGame(nextLvl);
    };

    window.addEventListener('game:restart', onRestart);
    window.addEventListener('game:nextlevel', onNextLevel);
    return () => {
      window.removeEventListener('game:restart', onRestart);
      window.removeEventListener('game:nextlevel', onNextLevel);
    };
  }, [initGame]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0e27' }}>
      <div
        ref={containerRef}
        className="relative select-none"
        style={{ width: CANVAS_WIDTH, maxWidth: '100%' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTap}
      >
        <BubbleCanvas
          trajectory={trajectory}
          trajectoryProgress={trajectoryProgress}
          eliminatingCells={eliminatingCells}
        />
        <GameHUD />
        <GameOverlay />
      </div>
    </div>
  );
}
