import { useGameStore } from '@/stores/gameStore';

export default function GameOverlay() {
  const isPaused = useGameStore((s) => s.isPaused);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isLevelComplete = useGameStore((s) => s.isLevelComplete);
  const score = useGameStore((s) => s.score);

  const setPaused = useGameStore((s) => s.setPaused);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const setLevelComplete = useGameStore((s) => s.setLevelComplete);

  if (!isPaused && !isGameOver && !isLevelComplete) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 min-w-[260px] text-center shadow-2xl">
        {isPaused && (
          <>
            <h2 className="font-orbitron text-2xl font-bold text-white mb-6">已暂停</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPaused(false)}
                className="px-6 py-2.5 rounded-full bg-yellow-400 text-gray-900 font-bold
                           hover:bg-yellow-300 transition text-sm"
              >
                继续游戏
              </button>
              <button
                onClick={() => {
                  setPaused(false);
                  setGameOver(false);
                  setLevelComplete(false);
                  window.dispatchEvent(new CustomEvent('game:restart'));
                }}
                className="px-6 py-2.5 rounded-full bg-white/10 text-white font-medium
                           hover:bg-white/20 transition text-sm"
              >
                重新开始
              </button>
            </div>
          </>
        )}

        {isGameOver && (
          <>
            <h2 className="font-orbitron text-2xl font-bold text-red-400 mb-2">游戏结束</h2>
            <p className="text-white/60 text-sm mb-4">泡泡触底了！</p>
            <div className="mb-6">
              <span className="text-white/60 text-sm">得分</span>
              <div className="font-orbitron text-3xl font-bold text-yellow-400">{score}</div>
            </div>
            <button
              onClick={() => {
                setGameOver(false);
                window.dispatchEvent(new CustomEvent('game:restart'));
              }}
              className="px-6 py-2.5 rounded-full bg-yellow-400 text-gray-900 font-bold
                         hover:bg-yellow-300 transition text-sm"
            >
              重新开始
            </button>
          </>
        )}

        {isLevelComplete && (
          <>
            <h2 className="font-orbitron text-2xl font-bold text-green-400 mb-2">通关!</h2>
            <p className="text-white/60 text-sm mb-4">干得漂亮！</p>
            <div className="mb-6">
              <span className="text-white/60 text-sm">得分</span>
              <div className="font-orbitron text-3xl font-bold text-yellow-400">{score}</div>
            </div>
            <button
              onClick={() => {
                setLevelComplete(false);
                window.dispatchEvent(new CustomEvent('game:nextlevel'));
              }}
              className="px-6 py-2.5 rounded-full bg-yellow-400 text-gray-900 font-bold
                         hover:bg-yellow-300 transition text-sm"
            >
              下一关
            </button>
          </>
        )}
      </div>
    </div>
  );
}
