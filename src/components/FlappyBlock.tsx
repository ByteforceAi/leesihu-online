import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playButtonClick } from "../lib/sounds";
import GameLeaderboard from "./GameLeaderboard";

interface Props {
  onClose: () => void;
}

type GameState = "menu" | "playing" | "gameover";

const GRAVITY = 0.35;
const FLAP = -6.5;
const PIPE_W = 44;
const PIPE_GAP = 130;
const PIPE_SPEED = 2.5;
const BIRD_SIZE = 24;

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

/* ═══════════════════════════════════════════════════ */
export default function FlappyBlock({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [lastScore, setLastScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const stateRef = useRef<GameState>("menu");
  const scoreRef = useRef(0);
  const birdRef = useRef({ y: 0, vy: 0, angle: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef(0);
  const animRef = useRef(0);

  /* ── Draw helpers ─────────────────────────────── */
  const drawBird = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x + BIRD_SIZE / 2, y + BIRD_SIZE / 2);
    ctx.rotate(angle);
    // Body (chicken block)
    ctx.fillStyle = "#FFD60A";
    ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, 3);
    // Eye
    ctx.fillStyle = "#fff";
    ctx.fillRect(4, -6, 6, 6);
    ctx.fillStyle = "#333";
    ctx.fillRect(7, -5, 3, 4);
    // Beak
    ctx.fillStyle = "#FF9800";
    ctx.fillRect(BIRD_SIZE / 2, -2, 6, 5);
    // Wing
    ctx.fillStyle = "#FFC107";
    const wingY = Math.sin(frameRef.current * 0.3) * 3;
    ctx.fillRect(-6, 2 + wingY, 10, 6);
    ctx.restore();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, gapY: number, H: number) => {
    const topH = gapY - PIPE_GAP / 2;
    const botY = gapY + PIPE_GAP / 2;

    // Top pipe
    ctx.fillStyle = "#2E7D32";
    ctx.fillRect(x, 0, PIPE_W, topH);
    ctx.fillStyle = "#388E3C";
    ctx.fillRect(x - 3, topH - 16, PIPE_W + 6, 16);
    // Brick lines
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let row = 0; row < topH; row += 16) {
      ctx.fillRect(x, row, PIPE_W, 1);
    }

    // Bottom pipe
    ctx.fillStyle = "#2E7D32";
    ctx.fillRect(x, botY, PIPE_W, H - botY);
    ctx.fillStyle = "#388E3C";
    ctx.fillRect(x - 3, botY, PIPE_W + 6, 16);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let row = botY; row < H; row += 16) {
      ctx.fillRect(x, row, PIPE_W, 1);
    }
  };

  /* ── Game loop ────────────────────────────────── */
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    }

    const state = stateRef.current;
    const bird = birdRef.current;

    // ── Sky
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#87CEEB");
    grad.addColorStop(1, "#B8E6FF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── Clouds
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    const cloudX = (frameRef.current * 0.3) % (W + 100);
    ctx.beginPath();
    ctx.ellipse(W - cloudX, 60, 40, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W - cloudX + 100, 100, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Ground
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = "#8B6914";
    ctx.fillRect(0, H - 28, W, 28);

    if (state === "playing") {
      frameRef.current++;

      // Bird physics
      bird.vy += GRAVITY;
      bird.y += bird.vy;
      bird.angle = Math.min(bird.vy * 0.06, 1.2);

      // Ceiling/floor
      if (bird.y < 0) { bird.y = 0; bird.vy = 0; }
      if (bird.y > H - 40 - BIRD_SIZE) {
        stateRef.current = "gameover";
        setGameState("gameover");
        setLastScore(scoreRef.current);
      }

      // Spawn pipes
      if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < W - 200) {
        const minGap = 80;
        const maxGap = H - 40 - 80;
        const gapY = minGap + Math.random() * (maxGap - minGap);
        pipesRef.current.push({ x: W + 20, gapY, passed: false });
      }

      // Move & draw pipes
      pipesRef.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;

        // Score
        if (!pipe.passed && pipe.x + PIPE_W < 60) {
          pipe.passed = true;
          scoreRef.current++;
        }

        // Collision
        const bx = 60 + 4;
        const by = bird.y + 4;
        const bw = BIRD_SIZE - 8;
        const bh = BIRD_SIZE - 8;
        const topH = pipe.gapY - PIPE_GAP / 2;
        const botY = pipe.gapY + PIPE_GAP / 2;

        if (bx + bw > pipe.x && bx < pipe.x + PIPE_W) {
          if (by < topH || by + bh > botY) {
            stateRef.current = "gameover";
            setGameState("gameover");
            setLastScore(scoreRef.current);
          }
        }
      });

      pipesRef.current = pipesRef.current.filter((p) => p.x > -PIPE_W - 10);
    }

    // Draw pipes
    pipesRef.current.forEach((pipe) => {
      drawPipe(ctx, pipe.x, pipe.gapY, H);
    });

    // Draw bird
    const birdY = state === "menu" ? H / 2 - 20 + Math.sin(frameRef.current * 0.05) * 15 : bird.y;
    const birdAngle = state === "menu" ? 0 : bird.angle;
    drawBird(ctx, 60, birdY, birdAngle);

    // HUD
    if (state === "playing" || state === "gameover") {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 3;
      ctx.strokeText(String(scoreRef.current), W / 2, 60);
      ctx.fillText(String(scoreRef.current), W / 2, 60);
      ctx.textAlign = "start";
    }

    // Menu text
    if (state === "menu") {
      frameRef.current++;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.strokeText("🐔 플래피 블록", W / 2, H * 0.3);
      ctx.fillText("🐔 플래피 블록", W / 2, H * 0.3);
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("터치하여 시작!", W / 2, H * 0.38);
      ctx.textAlign = "start";
    }

    if (stateRef.current !== "gameover") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
  }, []);

  /* ── Start / Reset ───────────────────────────── */
  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    const H = canvas ? canvas.clientHeight : 400;
    stateRef.current = "playing";
    scoreRef.current = 0;
    frameRef.current = 0;
    birdRef.current = { y: H / 2 - 20, vy: 0, angle: 0 };
    pipesRef.current = [];
    setGameState("playing");
    setShowLeaderboard(false);
    playButtonClick();
  }, []);

  const handleRestart = useCallback(() => {
    startGame();
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [startGame, gameLoop]);

  /* ── Flap ─────────────────────────────────────── */
  const flap = useCallback(() => {
    if (stateRef.current === "menu") {
      startGame();
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(gameLoop);
      birdRef.current.vy = FLAP;
      return;
    }
    if (stateRef.current === "playing") {
      birdRef.current.vy = FLAP;
    }
  }, [startGame, gameLoop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flap]);

  useEffect(() => {
    stateRef.current = "menu";
    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameLoop]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black"
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🐔</span>
          <span className="text-[15px] font-bold text-white">플래피 블록</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl active:bg-white/10 cursor-pointer">
          <X className="w-5 h-5 text-white/40" />
        </button>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onTouchStart={(e) => { e.preventDefault(); if (gameState !== "gameover") flap(); }}
          onClick={() => { if (gameState !== "gameover") flap(); }}
          style={{ touchAction: "none" }}
        />

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
                <span className="text-4xl mb-2">💀</span>
                <h2 className="text-[22px] font-bold text-white">게임 오버!</h2>
                <div className="mt-4 w-full rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] text-white/40">점수</p>
                  <p className="text-[36px] font-bold text-white leading-tight">{lastScore}</p>
                </div>
                <div className="w-full mt-5 space-y-2.5">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleRestart}
                    className="w-full py-3.5 rounded-2xl text-[16px] font-bold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #30D158, #20c997)", color: "#fff" }}>
                    다시하기 🔄
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowLeaderboard(true)}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #FFD60A, #FF9F0A)", color: "#000" }}>
                    순위 등록 🏆
                  </motion.button>
                  <button onClick={onClose} className="w-full py-3 text-[14px] text-white/30 cursor-pointer">나가기</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLeaderboard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0" style={{ background: "rgba(0,0,0,0.85)" }}>
              <GameLeaderboard score={lastScore} onRestart={handleRestart} onClose={onClose} gameId="flappy-block" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
