import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playButtonClick } from "../lib/sounds";
import GameLeaderboard from "./GameLeaderboard";

interface Props {
  onClose: () => void;
}

type GameState = "menu" | "playing" | "gameover";

/* ── Pixel art color palettes ──────────────────── */
const COLORS = {
  sky: ["#87CEEB", "#6BB3D9", "#4A90B8"],       // day gradient
  nightSky: ["#1a1a2e", "#16213e", "#0f3460"],  // night gradient
  grass: "#4CAF50",
  grassDark: "#388E3C",
  dirt: "#8B6914",
  dirtDark: "#6B4F12",
  player: "#D2691E",
  playerLight: "#DEB887",
  playerEye: "#fff",
  creeper: "#30D158",
  creeperDark: "#1B5E20",
  creeperFace: "#000",
  diamond: "#00BCD4",
  diamondLight: "#4DD0E1",
  gold: "#FFD700",
  cloud: "rgba(255,255,255,0.8)",
  lava: "#FF5722",
  lavaGlow: "#FF9800",
};

/* ── Game constants ─────────────────────────────── */
const GROUND_H = 50;        // ground height from bottom
const PLAYER_W = 28;
const PLAYER_H = 32;
const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const BASE_SPEED = 4;
const BLOCK_SIZE = 16;

interface Obstacle {
  x: number;
  w: number;
  h: number;
  type: "creeper" | "cactus" | "lava";
}

interface Item {
  x: number;
  y: number;
  type: "diamond" | "gold";
  collected: boolean;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  speed: number;
}

/* ═══════════════════════════════════════════════════ */
export default function MineRunner({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [hiScore, setHiScore] = useState(() => {
    return parseInt(localStorage.getItem("mineRunnerHi") || "0", 10);
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  // Game refs (mutable in animation loop)
  const stateRef = useRef<GameState>("menu");
  const scoreRef = useRef(0);
  const playerRef = useRef({ x: 60, y: 0, vy: 0, jumping: false, frame: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const groundOffsetRef = useRef(0);
  const frameCountRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const itemTimerRef = useRef(0);
  const animRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);

  /* ── Draw helpers ─────────────────────────────── */
  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(x + w - 2, y, 2, h);
    ctx.fillRect(x, y + h - 2, w, 2);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Body
    drawBlock(ctx, x, y, PLAYER_W, PLAYER_H, COLORS.player);
    // Head lighter area
    ctx.fillStyle = COLORS.playerLight;
    ctx.fillRect(x + 4, y + 2, PLAYER_W - 8, 12);
    // Eyes
    ctx.fillStyle = COLORS.playerEye;
    ctx.fillRect(x + 8, y + 6, 4, 4);
    ctx.fillRect(x + 16, y + 6, 4, 4);
    // Pupils
    ctx.fillStyle = "#333";
    ctx.fillRect(x + 10, y + 7, 2, 3);
    ctx.fillRect(x + 18, y + 7, 2, 3);
    // Legs (running animation)
    const legOffset = Math.sin(frameCountRef.current * 0.3) * 3;
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(x + 4, y + PLAYER_H, 8, 6 + legOffset);
    ctx.fillRect(x + PLAYER_W - 12, y + PLAYER_H, 8, 6 - legOffset);
  };

  const drawCreeper = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    drawBlock(ctx, x, y, w, h, COLORS.creeper);
    // Face
    if (w >= 24 && h >= 28) {
      const faceX = x + (w - 16) / 2;
      const faceY = y + 4;
      ctx.fillStyle = COLORS.creeperFace;
      // Eyes
      ctx.fillRect(faceX + 2, faceY + 2, 4, 4);
      ctx.fillRect(faceX + 10, faceY + 2, 4, 4);
      // Mouth
      ctx.fillRect(faceX + 6, faceY + 8, 4, 4);
      ctx.fillRect(faceX + 4, faceY + 12, 8, 4);
    }
  };

  const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x + 16, y + 8);
    ctx.lineTo(x + 8, y + 16);
    ctx.closePath();
    ctx.fill();
    // Inner shine
    ctx.fillStyle = COLORS.diamondLight;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 8);
    ctx.lineTo(x + 8, y + 4);
    ctx.lineTo(x + 12, y + 8);
    ctx.lineTo(x + 8, y + 12);
    ctx.closePath();
    ctx.fill();
  };

  const drawGold = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x + 2, y + 2, 12, 12);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x + 4, y + 4, 4, 4);
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

    // Resize canvas to match display
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    }

    const groundY = H - GROUND_H;
    const state = stateRef.current;
    const speed = speedRef.current;
    const player = playerRef.current;

    // ── Clear + Sky ──
    const isNight = scoreRef.current > 150;
    const sky = isNight ? COLORS.nightSky : COLORS.sky;
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(0.5, sky[1]);
    grad.addColorStop(1, sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, groundY);

    // ── Clouds ──
    if (cloudsRef.current.length < 4) {
      cloudsRef.current.push({
        x: W + Math.random() * 200,
        y: 30 + Math.random() * (groundY * 0.4),
        w: 40 + Math.random() * 60,
        speed: 0.3 + Math.random() * 0.5,
      });
    }
    cloudsRef.current.forEach((cloud) => {
      if (state === "playing") cloud.x -= cloud.speed;
      ctx.fillStyle = COLORS.cloud;
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cloud.x - cloud.w * 0.25, cloud.y + 4, cloud.w * 0.3, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cloud.x + cloud.w * 0.25, cloud.y + 2, cloud.w * 0.25, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    cloudsRef.current = cloudsRef.current.filter((c) => c.x > -100);

    // ── Ground (scrolling block tiles) ──
    if (state === "playing") {
      groundOffsetRef.current = (groundOffsetRef.current + speed) % BLOCK_SIZE;
    }
    // Grass layer
    for (let x = -groundOffsetRef.current; x < W; x += BLOCK_SIZE) {
      drawBlock(ctx, x, groundY, BLOCK_SIZE, BLOCK_SIZE, COLORS.grass);
    }
    // Dirt layers
    for (let row = 1; row < 3; row++) {
      for (let x = -groundOffsetRef.current; x < W; x += BLOCK_SIZE) {
        drawBlock(ctx, x, groundY + row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE,
          row === 1 ? COLORS.dirt : COLORS.dirtDark);
      }
    }

    // ── Player physics ──
    if (state === "playing") {
      player.vy += GRAVITY;
      player.y += player.vy;

      const floorY = groundY - PLAYER_H - 6; // 6 = leg height
      if (player.y >= floorY) {
        player.y = floorY;
        player.vy = 0;
        player.jumping = false;
      }

      frameCountRef.current++;

      // Speed increase
      const sc = scoreRef.current;
      speedRef.current = sc < 50 ? BASE_SPEED : sc < 150 ? BASE_SPEED + 2 : BASE_SPEED + 4;

      // Score (distance)
      if (frameCountRef.current % 6 === 0) {
        scoreRef.current++;
        setScore(scoreRef.current);
      }

      // Spawn obstacles
      spawnTimerRef.current -= speed;
      if (spawnTimerRef.current <= 0) {
        const types: Obstacle["type"][] = ["creeper", "cactus", "lava"];
        const type = types[Math.floor(Math.random() * types.length)];
        const h = type === "creeper" ? 32 + Math.random() * 16 : type === "cactus" ? 24 + Math.random() * 20 : 12;
        const w = type === "lava" ? 30 + Math.random() * 20 : 24 + Math.random() * 8;
        obstaclesRef.current.push({ x: W + 20, w, h, type });
        const minGap = sc < 50 ? 200 : sc < 150 ? 160 : 120;
        const maxGap = sc < 50 ? 350 : sc < 150 ? 280 : 200;
        spawnTimerRef.current = minGap + Math.random() * (maxGap - minGap);
      }

      // Spawn items
      itemTimerRef.current -= speed;
      if (itemTimerRef.current <= 0) {
        const type = Math.random() > 0.6 ? "diamond" : "gold";
        itemsRef.current.push({
          x: W + 20,
          y: groundY - 60 - Math.random() * 60,
          type,
          collected: false,
        });
        itemTimerRef.current = 180 + Math.random() * 250;
      }
    }

    // ── Draw & move obstacles ──
    obstaclesRef.current.forEach((ob) => {
      if (state === "playing") ob.x -= speedRef.current;
      const obY = groundY - ob.h;

      if (ob.type === "creeper") {
        drawCreeper(ctx, ob.x, obY, ob.w, ob.h);
      } else if (ob.type === "cactus") {
        drawBlock(ctx, ob.x, obY, ob.w, ob.h, "#2E7D32");
        // Spikes
        ctx.fillStyle = "#1B5E20";
        ctx.fillRect(ob.x - 3, obY + 8, 4, 6);
        ctx.fillRect(ob.x + ob.w - 1, obY + 12, 4, 6);
      } else {
        // Lava
        ctx.fillStyle = COLORS.lava;
        ctx.fillRect(ob.x, obY + ob.h * 0.3, ob.w, ob.h * 0.7);
        ctx.fillStyle = COLORS.lavaGlow;
        ctx.fillRect(ob.x + 2, obY, ob.w - 4, ob.h * 0.5);
        // Glow
        ctx.fillStyle = `rgba(255,87,34,${0.2 + Math.sin(frameCountRef.current * 0.1) * 0.1})`;
        ctx.fillRect(ob.x - 4, obY - 4, ob.w + 8, ob.h + 8);
      }

      // Collision (AABB)
      if (state === "playing") {
        const px = player.x + 4;
        const py = player.y + 4;
        const pw = PLAYER_W - 8;
        const ph = PLAYER_H - 4;
        if (px < ob.x + ob.w && px + pw > ob.x && py < obY + ob.h && py + ph > obY) {
          // Game over!
          stateRef.current = "gameover";
          setGameState("gameover");
          const finalScore = scoreRef.current;
          setLastScore(finalScore);
          if (finalScore > hiScore) {
            setHiScore(finalScore);
            localStorage.setItem("mineRunnerHi", String(finalScore));
          }
        }
      }
    });
    obstaclesRef.current = obstaclesRef.current.filter((o) => o.x > -60);

    // ── Draw & move items ──
    itemsRef.current.forEach((item) => {
      if (state === "playing") item.x -= speedRef.current;
      if (item.collected) return;

      // Bob animation
      const bob = Math.sin(frameCountRef.current * 0.08 + item.x * 0.01) * 4;

      if (item.type === "diamond") {
        drawDiamond(ctx, item.x, item.y + bob);
      } else {
        drawGold(ctx, item.x, item.y + bob);
      }

      // Collection check
      if (state === "playing") {
        const px = player.x;
        const py = player.y;
        if (px < item.x + 16 && px + PLAYER_W > item.x && py < item.y + 16 + bob && py + PLAYER_H > item.y + bob) {
          item.collected = true;
          scoreRef.current += item.type === "diamond" ? 10 : 5;
          setScore(scoreRef.current);
        }
      }
    });
    itemsRef.current = itemsRef.current.filter((i) => i.x > -20);

    // ── Draw player ──
    const pDrawY = state === "menu" ? groundY - PLAYER_H - 6 : player.y;
    drawPlayer(ctx, player.x, pDrawY);

    // ── HUD ──
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(8, 8, 110, 28);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`⛏ ${scoreRef.current}`, 16, 27);

    if (hiScore > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(126, 8, 100, 28);
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`HI ${hiScore}`, 134, 27);
    }

    // ── Menu overlay ──
    if (state === "menu") {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⛏️ 마인 러너", W / 2, H * 0.35);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("터치하여 시작!", W / 2, H * 0.45);

      ctx.textAlign = "start";
    }

    // ── Continue loop ──
    if (stateRef.current !== "gameover") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
  }, [hiScore]);

  /* ── Start / Reset game ───────────────────────── */
  const startGame = useCallback(() => {
    stateRef.current = "playing";
    scoreRef.current = 0;
    speedRef.current = BASE_SPEED;
    frameCountRef.current = 0;
    spawnTimerRef.current = 150;
    itemTimerRef.current = 100;

    const canvas = canvasRef.current;
    const groundY = canvas ? canvas.clientHeight - GROUND_H - PLAYER_H - 6 : 300;
    playerRef.current = { x: 60, y: groundY, vy: 0, jumping: false, frame: 0 };
    obstaclesRef.current = [];
    itemsRef.current = [];

    setScore(0);
    setGameState("playing");
    setShowLeaderboard(false);

    playButtonClick();
  }, []);

  const handleRestart = useCallback(() => {
    startGame();
    // Restart animation loop
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [startGame, gameLoop]);

  /* ── Jump ─────────────────────────────────────── */
  const jump = useCallback(() => {
    const state = stateRef.current;
    if (state === "menu") {
      startGame();
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    if (state === "playing" && !playerRef.current.jumping) {
      playerRef.current.vy = JUMP_FORCE;
      playerRef.current.jumping = true;
    }
  }, [startGame, gameLoop]);

  /* ── Input handlers ───────────────────────────── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  /* ── Init canvas loop ─────────────────────────── */
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
      {/* ── Header ──────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⛏️</span>
          <span className="text-[15px] font-bold text-white">마인 러너</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl active:bg-white/10 cursor-pointer"
        >
          <X className="w-5 h-5 text-white/40" />
        </button>
      </div>

      {/* ── Game Canvas ─────────────────────────── */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onTouchStart={(e) => {
            e.preventDefault();
            if (gameState === "gameover") return;
            jump();
          }}
          onClick={() => {
            if (gameState === "gameover") return;
            jump();
          }}
          style={{ touchAction: "none" }}
        />

        {/* ── Game Over Overlay ──────────────────── */}
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
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <span className="text-4xl mb-2">💀</span>
                <h2 className="text-[22px] font-bold text-white">게임 오버!</h2>
                <p className="text-[14px] text-white/40 mt-1">장애물에 부딪혔어!</p>

                {/* Score display */}
                <div className="mt-4 w-full rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] text-white/40">점수</p>
                  <p className="text-[36px] font-bold text-white leading-tight">{lastScore}</p>
                  {lastScore >= hiScore && lastScore > 0 && (
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[13px] font-bold mt-1"
                      style={{ color: "#FFD700" }}
                    >
                      🏆 새 최고기록!
                    </motion.p>
                  )}
                </div>

                {/* Buttons */}
                <div className="w-full mt-5 space-y-2.5">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleRestart}
                    className="w-full py-3.5 rounded-2xl text-[16px] font-bold cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #30D158, #20c997)",
                      color: "#fff",
                      boxShadow: "0 4px 16px rgba(48,209,88,0.3)",
                    }}
                  >
                    다시하기 🔄
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #FFD60A, #FF9F0A)",
                      color: "#000",
                      boxShadow: "0 4px 16px rgba(255,214,10,0.25)",
                    }}
                  >
                    순위 등록 🏆
                  </motion.button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-[14px] text-white/30 cursor-pointer"
                  >
                    나가기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Leaderboard Overlay ────────────────── */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
            >
              <GameLeaderboard
                score={lastScore}
                onRestart={handleRestart}
                onClose={onClose}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
