import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playButtonClick } from "../lib/sounds";
import MineRunner from "./MineRunner";
import WhackCreeper from "./WhackCreeper";

interface Props {
  onClose: () => void;
}

interface GameInfo {
  id: string;
  icon: string;
  title: string;
  desc: string;
  gradient: string;
  component: React.ComponentType<{ onClose: () => void }>;
}

const GAMES: GameInfo[] = [
  {
    id: "mine-runner",
    icon: "⛏️",
    title: "마인 러너",
    desc: "달리고 점프! 크리퍼를 피해라",
    gradient: "linear-gradient(135deg, #8B4513, #D2691E)",
    component: MineRunner,
  },
  {
    id: "whack-creeper",
    icon: "🔨",
    title: "크리퍼 때려잡기",
    desc: "30초 안에 최대한 많이 잡아라!",
    gradient: "linear-gradient(135deg, #30D158, #1B5E20)",
    component: WhackCreeper,
  },
];

export default function GameMenu({ onClose }: Props) {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const ActiveComponent = GAMES.find((g) => g.id === activeGame)?.component;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black"
    >
      {/* Active game overlay */}
      <AnimatePresence>
        {ActiveComponent && (
          <ActiveComponent onClose={() => setActiveGame(null)} />
        )}
      </AnimatePresence>

      {/* Menu (only when no game active) */}
      {!activeGame && (
        <>
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <span className="text-[16px] font-bold text-white">미니게임</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl active:bg-white/10 cursor-pointer">
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Game list */}
          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8">
            <div className="max-w-[400px] mx-auto space-y-3">
              {GAMES.map((game, i) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playButtonClick();
                    setActiveGame(game.id);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl cursor-pointer text-left"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: game.gradient,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    <span className="text-[24px]">{game.icon}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-white">{game.title}</p>
                    <p className="text-[13px] text-white/40 mt-0.5">{game.desc}</p>
                  </div>
                  {/* Arrow */}
                  <span className="text-white/20 text-[18px] flex-shrink-0">→</span>
                </motion.button>
              ))}

              {/* Coming soon cards */}
              {[
                { icon: "🐦", title: "플래피 블록", desc: "곧 출시!" },
                { icon: "🧩", title: "블록 퍼즐", desc: "곧 출시!" },
                { icon: "⚔️", title: "타워 디펜스", desc: "곧 출시!" },
              ].map((game, i) => (
                <motion.div
                  key={game.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (GAMES.length + i) * 0.08 }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/5">
                    <span className="text-[24px]">{game.icon}</span>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-white/50">{game.title}</p>
                    <p className="text-[13px] text-white/25 mt-0.5">{game.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
