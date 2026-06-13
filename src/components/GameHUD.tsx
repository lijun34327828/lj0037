import { useGameStore } from '@/stores/gameStore';

export default function GameHUD() {
  const score = useGameStore((s) => s.score);
  const level = useGameStore((s) => s.level);
  const shotsRemaining = useGameStore((s) => s.shotsRemaining);
  const highScore = useGameStore((s) => s.highScore);
  const isPaused = useGameStore((s) => s.isPaused);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isLevelComplete = useGameStore((s) => s.isLevelComplete);

  const setPaused = useGameStore((s) => s.setPaused);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const setLevelComplete = useGameStore((s) => s.setLevelComplete);

  const isOverlayVisible = isPaused || isGameOver || isLevelComplete;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-2 backdrop-blur-md bg-black/30 rounded-t-lg">
        <div className="text-white">
          <span className="text-xs opacity-60">得分</span>
          <div className="font-orbitron text-lg font-bold text-yellow-400">{score}</div>
        </div>
        <div className="text-white text-center">
          <span className="text-xs opacity-60">关卡</span>
          <div className="font-orbitron text-lg font-bold">{level}</div>
        </div>
        <div className="text-white text-center">
          <span className="text-xs opacity-60">剩余</span>
          <div className="font-orbitron text-lg font-bold">
            {shotsRemaining === null ? '∞' : shotsRemaining}
          </div>
        </div>
        <div className="text-white text-right">
          <span className="text-xs opacity-60">最佳</span>
          <div className="font-orbitron text-lg font-bold text-yellow-400">{highScore}</div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 pointer-events-auto">
        <button
          onClick={() => setPaused(true)}
          disabled={isOverlayVisible}
          className="px-5 py-2 rounded-full backdrop-blur-md bg-white/10 text-white text-sm font-medium
                     hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          暂停
        </button>
        <button
          onClick={() => {
            setGameOver(false);
            setLevelComplete(false);
            window.dispatchEvent(new CustomEvent('game:restart'));
          }}
          disabled={isOverlayVisible && !isPaused}
          className="px-5 py-2 rounded-full backdrop-blur-md bg-white/10 text-white text-sm font-medium
                     hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          重玩
        </button>
      </div>
    </div>
  );
}
