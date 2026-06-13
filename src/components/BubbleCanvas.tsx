import { useRef, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { BubbleColor, BubbleCell } from '@/lib/gameTypes';

const BUBBLE_RADIUS = 15;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRID_OFFSET_Y = 30;
const SHOOTER_Y = 570;
const SHOOTER_X = 200;

const COLOR_MAP: Record<BubbleColor, [string, string]> = {
  red: ['#ff4757', '#c0392b'],
  orange: ['#ffa502', '#e67e22'],
  green: ['#2ed573', '#27ae60'],
  blue: ['#1e90ff', '#2980b9'],
  purple: ['#a55eea', '#8e44ad'],
  cyan: ['#00d2d3', '#0abde3'],
};

function gridToPixel(row: number, col: number): { x: number; y: number } {
  const x = row % 2 === 0 ? col * 30 + 15 : col * 30 + 30;
  const y = row * 15 * Math.sqrt(3) + 15 + GRID_OFFSET_Y;
  return { x, y };
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, color: BubbleColor) {
  const [c1, c2] = COLOR_MAP[color];

  const shadow = ctx.createRadialGradient(x, y, BUBBLE_RADIUS * 0.5, x, y + 2, BUBBLE_RADIUS * 1.3);
  shadow.addColorStop(0, 'rgba(0,0,0,0.3)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(x, y + 2, BUBBLE_RADIUS * 1.3, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, BUBBLE_RADIUS);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(x - 4, y - 5, 4, 0, Math.PI * 2);
  ctx.fill();
}

interface BubbleCanvasProps {
  trajectory: Array<{ x: number; y: number }>;
  trajectoryProgress: number;
  eliminatingCells: BubbleCell[];
}

export default function BubbleCanvas({ trajectory, trajectoryProgress, eliminatingCells }: BubbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const grid = useGameStore((s) => s.grid);
  const nextColor = useGameStore((s) => s.nextColor);
  const aimAngle = useGameStore((s) => s.aimAngle);
  const isShooting = useGameStore((s) => s.isShooting);
  const isPaused = useGameStore((s) => s.isPaused);
  const particles = useGameStore((s) => s.particles);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#0a0e27');
      bgGrad.addColorStop(1, '#1a1a3e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const dangerY = SHOOTER_Y - BUBBLE_RADIUS * 3;
      ctx.strokeStyle = 'rgba(255, 71, 87, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(CANVAS_WIDTH, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      const eliminatingSet = new Set(
        eliminatingCells.map((c) => `${c.position.row},${c.position.col}`)
      );

      for (const cell of grid) {
        const key = `${cell.position.row},${cell.position.col}`;
        if (eliminatingSet.has(key)) continue;
        const { x, y } = gridToPixel(cell.position.row, cell.position.col);
        drawBubble(ctx, x, y, cell.color);
      }

      for (const cell of eliminatingCells) {
        const { x, y } = gridToPixel(cell.position.row, cell.position.col);
        ctx.globalAlpha = 0.4;
        drawBubble(ctx, x, y, cell.color);
        ctx.globalAlpha = 1;
      }

      if (!isShooting && !isPaused) {
        const rad = (aimAngle * Math.PI) / 180;
        const lineLen = 80;
        const endX = SHOOTER_X + Math.cos(rad) * lineLen;
        const endY = SHOOTER_Y - Math.sin(rad) * lineLen;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(SHOOTER_X, SHOOTER_Y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        const extLen = 300;
        let bx = SHOOTER_X;
        let by = SHOOTER_Y;
        let dx = Math.cos(rad);
        let dy = -Math.sin(rad);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);

        for (let i = 0; i < 200; i++) {
          bx += dx * 2;
          by += dy * 2;
          if (bx <= BUBBLE_RADIUS) {
            bx = BUBBLE_RADIUS;
            dx = -dx;
          }
          if (bx >= CANVAS_WIDTH - BUBBLE_RADIUS) {
            bx = CANVAS_WIDTH - BUBBLE_RADIUS;
            dx = -dx;
          }
          ctx.lineTo(bx, by);
          if (by <= GRID_OFFSET_Y) break;
          const dist = Math.hypot(bx - SHOOTER_X, by - SHOOTER_Y);
          if (dist > extLen) break;
        }
        ctx.stroke();
      }

      if (isShooting && trajectory.length > 0) {
        const idx = Math.min(
          Math.floor(trajectoryProgress * trajectory.length),
          trajectory.length - 1
        );
        const pt = trajectory[idx];
        drawBubble(ctx, pt.x, pt.y, nextColor);
      }

      if (!isShooting) {
        drawBubble(ctx, SHOOTER_X, SHOOTER_Y, nextColor);
      }

      for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [grid, nextColor, aimAngle, isShooting, isPaused, trajectory, trajectoryProgress, eliminatingCells, particles]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block rounded-lg shadow-2xl"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
