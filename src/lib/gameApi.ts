import type { BubbleColor, BubbleCell, LevelConfig } from '@/lib/gameTypes';

export async function startGame(level?: number) {
  const res = await fetch('/api/game/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }),
  });
  return res.json();
}

export async function shootBubble(params: {
  grid: BubbleCell[];
  angle: number;
  shootColor: BubbleColor;
  levelConfig: LevelConfig;
  shotsRemaining: number | null;
  score: number;
}) {
  const res = await fetch('/api/game/shoot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function getLevels() {
  const res = await fetch('/api/game/levels');
  return res.json();
}
