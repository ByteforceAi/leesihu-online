import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playButtonClick } from "../lib/sounds";
import GameLeaderboard from "./GameLeaderboard";

interface Props {
  onClose: () => void;
}

type GameState = "menu" | "playing" | "gameover";

interface Tower {
  x: number;
  y: number;
  type: "arrow" | "tnt" | "ice";
  range: number;
  damage: number;
  cooldown: number;
  timer: number;
}

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: "zombie" | "creeper" | "skeleton";
  pathIdx: number;
  frozen: number;
}

interface Bullet {
  x: number;
  y: number;
  tx: number;
  ty: number;
  type: "arrow" | "tnt" | "ice";
  speed: number;
}

// Path waypoints (relative to canvas, will be scaled)
const PATH_POINTS = [
  { x: 0, y: 0.5 },
  { x: 0.25, y: 0.5 },
  { x: 0.25, y: 0.2 },
  { x: 0.5, y: 0.2 },
  { x: 0.5, y: 0.7 },
  { x: 0.75, y: 0.7 },
  { x: 0.75, y: 0.4 },
  { x: 1.0, y: 0.4 },
];

const TOWER_TYPES = [
  { type: "arrow" as const, icon: "🏹", cost: 25, range: 80, damage: 15, cooldown: 30, color: "#8B4513" },
  { type: "tnt" as const, icon: "💣", cost: 50, range: 60, damage: 40, cooldown: 60, color: "#FF5722" },
  { type: "ice" as const, icon: "❄️", cost: 35, range: 70, damage: 8, cooldown: 25, color: "#00BCD4" },
];

/* ═══════════════════════════════════════════════════ */
export default function TowerDefense({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [selectedTower, setSelectedTower] = useState(0);
  const [gold, setGold] = useState(100);
  const [wave, setWave] = useState(0);
  const [lives, setLives] = useState(10);
  const [lastScore, setLastScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const stateRef = useRef<GameState>("menu");
  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const goldRef = useRef(100);
  const waveRef = useRef(0);
  const livesRef = useRef(10);
  const scoreRef = useRef(0);
  const waveTimer = useRef(0);
  const spawnTimer = useRef(0);
  const enemiesToSpawn = useRef(0);
  const animRef = useRef(0);
  const frameRef = useRef(0);

  const getPath = useCallback((W: number, H: number) => {
    const gameH = H - 80; // reserve bottom for UI
    return PATH_POINTS.map((p) => ({ x: p.x * W, y: p.y * gameH }));
  }, []);

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

    const path = getPath(W, H);
    const gameH = H - 80;

    // BG
    ctx.fillStyle = "#1a3a1a";
    ctx.fillRect(0, 0, W, gameH);

    // Draw path
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    // Path border
    ctx.strokeStyle = "#6B4F12";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.strokeStyle = "#A07828";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    if (stateRef.current === "playing") {
      frameRef.current++;

      // Wave spawning
      if (enemiesToSpawn.current > 0) {
        spawnTimer.current--;
        if (spawnTimer.current <= 0) {
          const wv = waveRef.current;
          const types: Enemy["type"][] = ["zombie", "creeper", "skeleton"];
          const type = types[Math.floor(Math.random() * Math.min(types.length, 1 + Math.floor(wv / 3)))];
          const hpMult = 1 + wv * 0.3;
          const hp = type === "zombie" ? Math.floor(40 * hpMult)
            : type === "creeper" ? Math.floor(60 * hpMult)
            : Math.floor(30 * hpMult);
          const spd = type === "skeleton" ? 1.5 : type === "creeper" ? 0.8 : 1.0;

          enemiesRef.current.push({
            x: path[0].x,
            y: path[0].y,
            hp,
            maxHp: hp,
            speed: spd,
            type,
            pathIdx: 0,
            frozen: 0,
          });

          enemiesToSpawn.current--;
          spawnTimer.current = 25;
        }
      } else if (enemiesRef.current.length === 0) {
        // Next wave
        waveTimer.current++;
        if (waveTimer.current > 90) {
          waveRef.current++;
          setWave(waveRef.current);
          enemiesToSpawn.current = 3 + waveRef.current * 2;
          spawnTimer.current = 0;
          waveTimer.current = 0;
        }
      }

      // Move enemies
      enemiesRef.current.forEach((enemy) => {
        const speedMod = enemy.frozen > 0 ? 0.3 : 1;
        if (enemy.frozen > 0) enemy.frozen--;

        const target = path[enemy.pathIdx + 1];
        if (!target) return;

        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3) {
          enemy.pathIdx++;
          if (enemy.pathIdx >= path.length - 1) {
            enemy.hp = 0;
            livesRef.current--;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              stateRef.current = "gameover";
              setGameState("gameover");
              setLastScore(scoreRef.current);
            }
          }
        } else {
          enemy.x += (dx / dist) * enemy.speed * speedMod;
          enemy.y += (dy / dist) * enemy.speed * speedMod;
        }
      });

      // Tower shooting
      towersRef.current.forEach((tower) => {
        tower.timer--;
        if (tower.timer > 0) return;

        // Find closest enemy in range
        let closest: Enemy | null = null;
        let closestDist = Infinity;
        enemiesRef.current.forEach((e) => {
          if (e.hp <= 0) return;
          const d = Math.sqrt((e.x - tower.x) ** 2 + (e.y - tower.y) ** 2);
          if (d < tower.range && d < closestDist) {
            closest = e;
            closestDist = d;
          }
        });

        if (closest) {
          tower.timer = tower.cooldown;
          bulletsRef.current.push({
            x: tower.x,
            y: tower.y,
            tx: (closest as Enemy).x,
            ty: (closest as Enemy).y,
            type: tower.type,
            speed: 5,
          });
        }
      });

      // Move bullets
      bulletsRef.current.forEach((bullet) => {
        const dx = bullet.tx - bullet.x;
        const dy = bullet.ty - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) {
          // Hit!
          enemiesRef.current.forEach((e) => {
            const d = Math.sqrt((e.x - bullet.tx) ** 2 + (e.y - bullet.ty) ** 2);
            const splashRange = bullet.type === "tnt" ? 40 : 12;
            if (d < splashRange && e.hp > 0) {
              const towerInfo = TOWER_TYPES.find((t) => t.type === bullet.type)!;
              e.hp -= towerInfo.damage;
              if (bullet.type === "ice") e.frozen = 60;
              if (e.hp <= 0) {
                goldRef.current += 10 + waveRef.current * 2;
                setGold(goldRef.current);
                scoreRef.current += 10;
              }
            }
          });
          bullet.speed = 0; // mark for removal
        } else {
          bullet.x += (dx / dist) * bullet.speed;
          bullet.y += (dy / dist) * bullet.speed;
        }
      });

      bulletsRef.current = bulletsRef.current.filter((b) => b.speed > 0);
      enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);
    }

    // ── Draw towers ──
    towersRef.current.forEach((tower) => {
      const info = TOWER_TYPES.find((t) => t.type === tower.type)!;
      ctx.fillStyle = info.color;
      ctx.fillRect(tower.x - 12, tower.y - 12, 24, 24);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(tower.x - 12, tower.y - 12, 24, 3);
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(info.icon, tower.x, tower.y + 5);
      ctx.textAlign = "start";
    });

    // ── Draw enemies ──
    enemiesRef.current.forEach((enemy) => {
      const color = enemy.type === "zombie" ? "#4CAF50"
        : enemy.type === "creeper" ? "#30D158"
        : "#E0E0E0";
      const frozen = enemy.frozen > 0;

      ctx.fillStyle = frozen ? "#90CAF9" : color;
      ctx.fillRect(enemy.x - 8, enemy.y - 8, 16, 16);
      // HP bar
      const hpPct = enemy.hp / enemy.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(enemy.x - 10, enemy.y - 14, 20, 3);
      ctx.fillStyle = hpPct > 0.5 ? "#4CAF50" : hpPct > 0.25 ? "#FFD60A" : "#FF5722";
      ctx.fillRect(enemy.x - 10, enemy.y - 14, 20 * hpPct, 3);
    });

    // ── Draw bullets ──
    bulletsRef.current.forEach((bullet) => {
      const color = bullet.type === "arrow" ? "#FFD60A"
        : bullet.type === "tnt" ? "#FF5722"
        : "#00BCD4";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Bottom UI bar ──
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, gameH, W, 80);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, gameH);
    ctx.lineTo(W, gameH);
    ctx.stroke();

    // HUD text
    ctx.fillStyle = "#FFD60A";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`💰 ${goldRef.current}`, 10, gameH + 20);
    ctx.fillStyle = "#FF5722";
    ctx.fillText(`❤️ ${livesRef.current}`, 90, gameH + 20);
    ctx.fillStyle = "#fff";
    ctx.fillText(`WAVE ${waveRef.current}`, 160, gameH + 20);
    ctx.fillStyle = "#30D158";
    ctx.fillText(`⛏ ${scoreRef.current}`, W - 80, gameH + 20);

    // Tower selection buttons
    TOWER_TYPES.forEach((t, i) => {
      const bx = 10 + i * 75;
      const by = gameH + 35;
      const isSelected = i === selectedTower;
      const canAfford = goldRef.current >= t.cost;

      ctx.fillStyle = isSelected ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
      if (!canAfford) ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(bx, by, 65, 38);
      ctx.strokeStyle = isSelected ? "#FFD60A" : "rgba(255,255,255,0.1)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(bx, by, 65, 38);

      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = canAfford ? 1 : 0.3;
      ctx.fillText(t.icon, bx + 20, by + 25);
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#FFD60A";
      ctx.fillText(`${t.cost}G`, bx + 48, by + 25);
      ctx.globalAlpha = 1;
      ctx.textAlign = "start";
    });

    // Menu overlay
    if (stateRef.current === "menu") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚔️ 타워 디펜스", W / 2, H * 0.3);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("빈 곳을 터치하여 타워 배치!", W / 2, H * 0.38);
      ctx.fillText("터치하여 시작", W / 2, H * 0.46);
      ctx.textAlign = "start";
    }

    if (stateRef.current !== "gameover") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
  }, [getPath, selectedTower]);

  /* ── Place tower on tap ───────────────────────── */
  const handleCanvasTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (stateRef.current === "menu") {
      // Start game
      stateRef.current = "playing";
      towersRef.current = [];
      enemiesRef.current = [];
      bulletsRef.current = [];
      goldRef.current = 100;
      livesRef.current = 10;
      waveRef.current = 0;
      scoreRef.current = 0;
      enemiesToSpawn.current = 5;
      spawnTimer.current = 0;
      waveTimer.current = 0;
      setGameState("playing");
      setGold(100);
      setLives(10);
      setWave(0);
      setShowLeaderboard(false);
      playButtonClick();
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (stateRef.current !== "playing") return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const H = canvas.clientHeight;
    const gameH = H - 80;

    // Check if tapping tower selection bar
    if (y > gameH + 35 && y < gameH + 73) {
      const idx = Math.floor((x - 10) / 75);
      if (idx >= 0 && idx < TOWER_TYPES.length) {
        setSelectedTower(idx);
        return;
      }
    }

    // Place tower on map
    if (y < gameH) {
      const towerType = TOWER_TYPES[selectedTower];
      if (goldRef.current < towerType.cost) return;

      // Check not too close to path or other towers
      const path = getPath(canvas.clientWidth, H);
      let tooCloseToPath = false;
      for (let i = 0; i < path.length - 1; i++) {
        const px = path[i].x;
        const py = path[i].y;
        const d = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        if (d < 25) { tooCloseToPath = true; break; }
      }
      if (tooCloseToPath) return;

      // Check not too close to other towers
      const tooClose = towersRef.current.some(
        (t) => Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) < 30
      );
      if (tooClose) return;

      goldRef.current -= towerType.cost;
      setGold(goldRef.current);
      towersRef.current.push({
        x,
        y,
        type: towerType.type,
        range: towerType.range,
        damage: towerType.damage,
        cooldown: towerType.cooldown,
        timer: 0,
      });
      playButtonClick();
    }
  }, [selectedTower, getPath, gameLoop]);

  /* ── Init ─────────────────────────────────────── */
  useEffect(() => {
    stateRef.current = "menu";
    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameLoop]);

  const handleRestart = useCallback(() => {
    stateRef.current = "menu";
    setGameState("menu");
    setShowLeaderboard(false);
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(gameLoop);
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
          <span className="text-lg">⚔️</span>
          <span className="text-[15px] font-bold text-white">타워 디펜스</span>
          {gameState === "playing" && (
            <span className="text-[12px] text-white/40 ml-2">Wave {wave}</span>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-xl active:bg-white/10 cursor-pointer">
          <X className="w-5 h-5 text-white/40" />
        </button>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onTouchStart={(e) => { e.preventDefault(); handleCanvasTap(e); }}
          onClick={handleCanvasTap}
          style={{ touchAction: "none" }}
        />

        <AnimatePresence>
          {gameState === "gameover" && !showLeaderboard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="w-[300px] max-w-[90vw] flex flex-col items-center text-center p-6 rounded-3xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-4xl mb-2">⚔️</span>
                <h2 className="text-[22px] font-bold text-white">기지 함락!</h2>
                <p className="text-[14px] text-white/40 mt-1">Wave {wave}까지 버텼어!</p>
                <div className="mt-4 w-full rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] text-white/40">점수</p>
                  <p className="text-[36px] font-bold text-white leading-tight">{lastScore}</p>
                </div>
                <div className="w-full mt-5 space-y-2.5">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleRestart}
                    className="w-full py-3.5 rounded-2xl text-[16px] font-bold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #30D158, #20c997)", color: "#fff" }}>다시하기 🔄</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowLeaderboard(true)}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #FFD60A, #FF9F0A)", color: "#000" }}>순위 등록 🏆</motion.button>
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
              <GameLeaderboard score={lastScore} onRestart={handleRestart} onClose={onClose} gameId="tower-defense" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
