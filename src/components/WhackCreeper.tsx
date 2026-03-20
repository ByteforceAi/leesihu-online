import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playButtonClick } from "../lib/sounds";
import GameLeaderboard from "./GameLeaderboard";

interface Props {
  onClose: () => void;
}

type GameState = "menu" | "playing" | "gameover";

interface Hole {
  id: number;
  type: "empty" | "creeper" | "diamond" | "tnt";
  hit: boolean;
  timer: number;
}

const GRID = 9; // 3x3 grid
const GAME_TIME = 30; // seconds

/* ═══════════════════════════════════════════════════ */
export default function WhackCreeper({ onClose }: Props) {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [holes, setHoles] = useState<Hole[]>(
    Array.from({ length: GRID }, (_, i) => ({ id: i, type: "empty", hit: false, timer: 0 }))
  );
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [effects, setEffects] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [lastScore, setLastScore] = useState(0);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const effectId = useRef(0);
  const spawnInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  const timerInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  /* ── Start game ──────────────────────────────── */
  const startGame = useCallback(() => {
    playButtonClick();
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_TIME);
    setShowLeaderboard(false);
    scoreRef.current = 0;
    comboRef.current = 0;
    setHoles(Array.from({ length: GRID }, (_, i) => ({ id: i, type: "empty", hit: false, timer: 0 })));
  }, []);

  /* ── Spawn mobs ──────────────────────────────── */
  useEffect(() => {
    if (gameState !== "playing") return;

    const spawn = () => {
      setHoles((prev) => {
        const next = [...prev];
        // Find empty holes
        const empties = next.filter((h) => h.type === "empty");
        if (empties.length === 0) return next;

        // Pick random empty hole
        const hole = empties[Math.floor(Math.random() * empties.length)];
        const idx = next.findIndex((h) => h.id === hole.id);

        // Weighted random: 70% creeper, 15% diamond, 15% tnt
        const r = Math.random();
        const type = r < 0.70 ? "creeper" : r < 0.85 ? "diamond" : "tnt";

        next[idx] = { ...next[idx], type, hit: false, timer: Date.now() };
        return next;
      });
    };

    // Dynamic spawn rate: faster as time goes on
    const getSpawnRate = () => {
      const elapsed = GAME_TIME - timeLeft;
      return Math.max(400, 900 - elapsed * 20);
    };

    spawnInterval.current = setInterval(spawn, getSpawnRate());

    // Auto-hide mobs after delay
    const hideTimer = setInterval(() => {
      setHoles((prev) =>
        prev.map((h) => {
          if (h.type !== "empty" && !h.hit && Date.now() - h.timer > 1500) {
            if (h.type === "creeper") {
              // Missed creeper = combo reset
              comboRef.current = 0;
              setCombo(0);
            }
            return { ...h, type: "empty", hit: false };
          }
          return h;
        })
      );
    }, 100);

    return () => {
      clearInterval(spawnInterval.current);
      clearInterval(hideTimer);
    };
  }, [gameState, timeLeft]);

  /* ── Timer ───────────────────────────────────── */
  useEffect(() => {
    if (gameState !== "playing") return;

    timerInterval.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Game over
          setGameState("gameover");
          setLastScore(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval.current);
  }, [gameState]);

  /* ── Tap hole ────────────────────────────────── */
  const handleTap = useCallback((index: number) => {
    if (gameState !== "playing") return;

    setHoles((prev) => {
      const hole = prev[index];
      if (hole.type === "empty" || hole.hit) return prev;

      const next = [...prev];
      next[index] = { ...next[index], hit: true };

      let points = 0;
      let text = "";
      let color = "";

      if (hole.type === "creeper") {
        comboRef.current++;
        setCombo(comboRef.current);
        const multiplier = Math.min(comboRef.current, 5);
        points = 10 * multiplier;
        text = comboRef.current > 1 ? `+${points} x${comboRef.current}` : `+${points}`;
        color = "#30D158";
      } else if (hole.type === "diamond") {
        points = 50;
        text = "+50 💎";
        color = "#00BCD4";
      } else if (hole.type === "tnt") {
        points = -30;
        text = "-30 💥";
        color = "#FF5722";
        comboRef.current = 0;
        setCombo(0);
      }

      scoreRef.current = Math.max(0, scoreRef.current + points);
      setScore(scoreRef.current);

      // Add floating effect
      effectId.current++;
      const col = index % 3;
      const row = Math.floor(index / 3);
      setEffects((prev) => [
        ...prev,
        { id: effectId.current, x: col * 33 + 16, y: row * 33 + 10, text, color },
      ]);
      setTimeout(() => {
        setEffects((prev) => prev.slice(1));
      }, 800);

      // Hide after tap
      setTimeout(() => {
        setHoles((p) => {
          const n = [...p];
          n[index] = { ...n[index], type: "empty", hit: false };
          return n;
        });
      }, 200);

      return next;
    });
  }, [gameState]);

  /* ── Render ──────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔨</span>
          <span className="text-[15px] font-bold text-white">크리퍼 때려잡기</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl active:bg-white/10 cursor-pointer">
          <X className="w-5 h-5 text-white/40" />
        </button>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
        {/* HUD */}
        {gameState === "playing" && (
          <div className="flex items-center justify-between w-full max-w-[340px] mb-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl text-[14px] font-bold text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
                ⛏ {score}
              </div>
              {combo > 1 && (
                <motion.div
                  key={combo}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1.5 rounded-xl text-[13px] font-bold"
                  style={{ background: "rgba(48,209,88,0.2)", color: "#30D158" }}
                >
                  COMBO x{combo}
                </motion.div>
              )}
            </div>
            <div
              className="px-3 py-1.5 rounded-xl text-[14px] font-bold"
              style={{
                background: timeLeft <= 5 ? "rgba(255,87,34,0.2)" : "rgba(255,255,255,0.1)",
                color: timeLeft <= 5 ? "#FF5722" : "#fff",
              }}
            >
              ⏱ {timeLeft}s
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="relative w-full max-w-[340px] aspect-square">
          <div className="grid grid-cols-3 gap-3 w-full h-full">
            {holes.map((hole, i) => (
              <motion.button
                key={hole.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTap(i)}
                className="rounded-2xl flex items-center justify-center cursor-pointer relative overflow-hidden"
                style={{
                  background: hole.hit
                    ? hole.type === "tnt" ? "rgba(255,87,34,0.3)" : "rgba(48,209,88,0.2)"
                    : hole.type === "empty"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.1)",
                  border: `2px solid ${
                    hole.type === "creeper" ? "rgba(48,209,88,0.3)"
                    : hole.type === "diamond" ? "rgba(0,188,212,0.3)"
                    : hole.type === "tnt" ? "rgba(255,87,34,0.3)"
                    : "rgba(255,255,255,0.06)"
                  }`,
                  transition: "all 0.15s ease",
                }}
              >
                <AnimatePresence mode="wait">
                  {hole.type !== "empty" && !hole.hit && (
                    <motion.span
                      key={`${hole.id}-${hole.timer}`}
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="text-[36px]"
                    >
                      {hole.type === "creeper" ? "🟩" : hole.type === "diamond" ? "💎" : "🧨"}
                    </motion.span>
                  )}
                  {hole.hit && (
                    <motion.span
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[28px]"
                    >
                      {hole.type === "tnt" ? "💥" : "✨"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {/* Floating score effects */}
          {effects.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -40, scale: 1.2 }}
              transition={{ duration: 0.7 }}
              className="absolute pointer-events-none text-[16px] font-bold"
              style={{ left: `${e.x}%`, top: `${e.y}%`, color: e.color }}
            >
              {e.text}
            </motion.div>
          ))}
        </div>

        {/* Menu overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl mb-4">🔨</span>
            <h2 className="text-[24px] font-bold text-white mb-2">크리퍼 때려잡기</h2>
            <p className="text-[14px] text-white/40 mb-1">🟩 크리퍼 = +10점 (콤보 가능!)</p>
            <p className="text-[14px] text-white/40 mb-1">💎 다이아 = +50점</p>
            <p className="text-[14px] text-white/40 mb-6">🧨 TNT = -30점 (콤보 리셋!)</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={startGame}
              className="px-8 py-4 rounded-2xl text-[17px] font-bold cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #30D158, #20c997)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(48,209,88,0.3)",
              }}
            >
              시작! 🔨
            </motion.button>
          </div>
        )}

        {/* Game over overlay */}
        <AnimatePresence>
          {gameState === "gameover" && !showLeaderboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-[300px] max-w-[90vw] flex flex-col items-center text-center p-6 rounded-3xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span className="text-4xl mb-2">⏰</span>
                <h2 className="text-[22px] font-bold text-white">타임 업!</h2>
                <div className="mt-4 w-full rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] text-white/40">최종 점수</p>
                  <p className="text-[36px] font-bold text-white leading-tight">{lastScore}</p>
                </div>
                <div className="w-full mt-5 space-y-2.5">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={startGame}
                    className="w-full py-3.5 rounded-2xl text-[16px] font-bold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #30D158, #20c997)", color: "#fff" }}
                  >
                    다시하기 🔄
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #FFD60A, #FF9F0A)", color: "#000" }}
                  >
                    순위 등록 🏆
                  </motion.button>
                  <button onClick={onClose} className="w-full py-3 text-[14px] text-white/30 cursor-pointer">나가기</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.85)" }}
            >
              <GameLeaderboard score={lastScore} onRestart={startGame} onClose={onClose} gameId="whack-creeper" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
