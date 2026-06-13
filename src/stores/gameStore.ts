import { create } from 'zustand';
import type { BubbleCell, BubbleColor, LevelConfig } from '@/lib/gameTypes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

interface GameState {
  grid: BubbleCell[];
  level: number;
  score: number;
  highScore: number;
  shotsRemaining: number | null;
  nextColor: BubbleColor;
  levelConfig: LevelConfig | null;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  isShooting: boolean;
  aimAngle: number;
  particles: Particle[];
  descentTimer: number;

  setGrid: (grid: BubbleCell[]) => void;
  setLevel: (level: number) => void;
  setScore: (score: number) => void;
  setHighScore: (score: number) => void;
  setShotsRemaining: (shots: number | null) => void;
  setNextColor: (color: BubbleColor) => void;
  setLevelConfig: (config: LevelConfig) => void;
  setPaused: (paused: boolean) => void;
  setGameOver: (over: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  setShooting: (shooting: boolean) => void;
  setAimAngle: (angle: number) => void;
  setParticles: (particles: Particle[]) => void;
  setDescentTimer: (timer: number) => void;
  reset: () => void;
}

const initialState = {
  grid: [],
  level: 1,
  score: 0,
  highScore: 0,
  shotsRemaining: null,
  nextColor: 'red' as BubbleColor,
  levelConfig: null,
  isPaused: false,
  isGameOver: false,
  isLevelComplete: false,
  isShooting: false,
  aimAngle: 90,
  particles: [],
  descentTimer: 0,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGrid: (grid) => set({ grid }),
  setLevel: (level) => set({ level }),
  setScore: (score) => set({ score }),
  setHighScore: (highScore) => set({ highScore }),
  setShotsRemaining: (shotsRemaining) => set({ shotsRemaining }),
  setNextColor: (nextColor) => set({ nextColor }),
  setLevelConfig: (levelConfig) => set({ levelConfig }),
  setPaused: (isPaused) => set({ isPaused }),
  setGameOver: (isGameOver) => set({ isGameOver }),
  setLevelComplete: (isLevelComplete) => set({ isLevelComplete }),
  setShooting: (isShooting) => set({ isShooting }),
  setAimAngle: (aimAngle) => set({ aimAngle }),
  setParticles: (particles) => set({ particles }),
  setDescentTimer: (descentTimer) => set({ descentTimer }),
  reset: () => set(initialState),
}));
