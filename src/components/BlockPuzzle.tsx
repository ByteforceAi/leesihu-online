import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playButtonClick } from "../lib/sounds";
import GameLeaderboard from "./GameLeaderboard";

interface Props {
  onClose: () => void;
}

type GameState = "menu" | "playing" | "gameover";

const COLS = 10;
const ROWS = 20;
const COLORS = ["#30D158", "#0EA5E9", "#FFD60A", "#FF5722", "#845EF7", "#FF6B6B", "#00BCD4"];

// Tetromino shapes (standard 7 pieces)
const SHAPES = [
  [[1,1,1,1]],                          // I
  [[1,1],[1,1]],                        // O
  [[0,1,0],[1,1,1]],                    // T
  [[1,0,0],[1,1,1]],                    // L
  [[0,0,1],[1,1,1]],                    // J
  [[0,1,1],[1,1,0]],                    // S
  [[1,1,0],[0,1,1]],                    // Z
];

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: number;
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: number[][] = [];
  for (let c = 0; c < cols; c++) {
    result.push([]);
    for (let r = rows - 1; r >= 0; r--) {
      result[c].push(shape[r][c]);
    }
  }
  return result;
}

/* ═══════════════════════════════════════════════════ */
export default function BlockPuzzle({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [lastScore, setLastScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLines, setDisplayLines] = useState(0);

  const stateRef = useRef<GameState>("menu");
  const boardRef = useRef<number[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const pieceRef = useRef<Piece | null>(null);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const dropTimer = useRef(0);
  const animRef = useRef(0);
  const cellSize = useRef(0);
  const levelRef = useRef(1);

  const newPiece = useCallback((): Piece => {
    const idx = Math.floor(Math.random() * SHAPES.length);
    return {
      shape: SHAPES[idx],
      x: Math.floor((COLS - SHAPES[idx][0].length) / 2),
      y: 0,
      color: idx + 1,
    };
  }, []);

  const collides = useCallback((board: number[][], piece: Piece, dx = 0, dy = 0, shape?: number[][]): boolean => {
    const s = shape || piece.shape;
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        const nx = piece.x + c + dx;
        const ny = piece.y + r + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece) return;
    const board = boardRef.current;

    // Place piece
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const y = piece.y + r;
        const x = piece.x + c;
        if (y < 0) {
          // Game over
          stateRef.current = "gameover";
          setGameState("gameover");
          setLastScore(scoreRef.current);
          return;
        }
        board[y][x] = piece.color;
      }
    }

    // Clear lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((c) => c !== 0)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
        r++; // recheck same row
      }
    }

    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] || 800;
      scoreRef.current += points * levelRef.current;
      linesRef.current += cleared;
      levelRef.current = Math.floor(linesRef.current / 10) + 1;
      setDisplayScore(scoreRef.current);
      setDisplayLines(linesRef.current);
    }

    // New piece
    const next = newPiece();
    if (collides(board, next)) {
      stateRef.current = "gameover";
      setGameState("gameover");
      setLastScore(scoreRef.current);
      return;
    }
    pieceRef.current = next;
  }, [newPiece, collides]);

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

    const cs = Math.floor(Math.min(W * 0.9 / COLS, (H - 60) / ROWS));
    cellSize.current = cs;
    const boardW = cs * COLS;
    const boardH = cs * ROWS;
    const offsetX = (W - boardW) / 2;
    const offsetY = (H - boardH) / 2 + 20;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Board border
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX - 1, offsetY - 1, boardW + 2, boardH + 2);

    // Board background
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(offsetX, offsetY, boardW, boardH);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + r * cs);
      ctx.lineTo(offsetX + boardW, offsetY + r * cs);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + c * cs, offsetY);
      ctx.lineTo(offsetX + c * cs, offsetY + boardH);
      ctx.stroke();
    }

    const board = boardRef.current;
    const piece = pieceRef.current;

    // Draw board cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          const color = COLORS[board[r][c] - 1];
          ctx.fillStyle = color;
          ctx.fillRect(offsetX + c * cs + 1, offsetY + r * cs + 1, cs - 2, cs - 2);
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(offsetX + c * cs + 1, offsetY + r * cs + 1, cs - 2, 2);
        }
      }
    }

    // Draw current piece
    if (piece && stateRef.current === "playing") {
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (!piece.shape[r][c]) continue;
          const color = COLORS[piece.color - 1];
          ctx.fillStyle = color;
          ctx.fillRect(
            offsetX + (piece.x + c) * cs + 1,
            offsetY + (piece.y + r) * cs + 1,
            cs - 2, cs - 2
          );
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(
            offsetX + (piece.x + c) * cs + 1,
            offsetY + (piece.y + r) * cs + 1,
            cs - 2, 2
          );
        }
      }

      // Drop piece
      dropTimer.current++;
      const dropSpeed = Math.max(5, 30 - levelRef.current * 3);
      if (dropTimer.current >= dropSpeed) {
        dropTimer.current = 0;
        if (!collides(board, piece, 0, 1)) {
          piece.y++;
        } else {
          lock();
        }
      }
    }

    // HUD
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE: ${scoreRef.current}`, offsetX, offsetY - 8);
    ctx.textAlign = "right";
    ctx.fillText(`LINES: ${linesRef.current}  LV.${levelRef.current}`, offsetX + boardW, offsetY - 8);
    ctx.textAlign = "start";

    // Menu overlay
    if (stateRef.current === "menu") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🧩 블록 퍼즐", W / 2, H * 0.35);
      ctx.font = "15px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("터치하여 시작!", W / 2, H * 0.43);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText("← → 이동 | ↑ 회전 | ↓ 드롭", W / 2, H * 0.49);
      ctx.textAlign = "start";
    }

    if (stateRef.current !== "gameover") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
  }, [collides, lock]);

  /* ── Controls ─────────────────────────────────── */
  const moveLeft = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || stateRef.current !== "playing") return;
    if (!collides(boardRef.current, piece, -1, 0)) piece.x--;
  }, [collides]);

  const moveRight = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || stateRef.current !== "playing") return;
    if (!collides(boardRef.current, piece, 1, 0)) piece.x++;
  }, [collides]);

  const rotatePiece = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || stateRef.current !== "playing") return;
    const rotated = rotate(piece.shape);
    if (!collides(boardRef.current, piece, 0, 0, rotated)) {
      piece.shape = rotated;
    }
  }, [collides]);

  const hardDrop = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || stateRef.current !== "playing") return;
    while (!collides(boardRef.current, piece, 0, 1)) {
      piece.y++;
    }
    lock();
  }, [collides, lock]);

  /* ── Start ────────────────────────────────────── */
  const startGame = useCallback(() => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    dropTimer.current = 0;
    pieceRef.current = newPiece();
    stateRef.current = "playing";
    setGameState("playing");
    setShowLeaderboard(false);
    setDisplayScore(0);
    setDisplayLines(0);
    playButtonClick();
  }, [newPiece]);

  const handleRestart = useCallback(() => {
    startGame();
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [startGame, gameLoop]);

  const handleStart = useCallback(() => {
    startGame();
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [startGame, gameLoop]);

  /* ── Key input ────────────────────────────────── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (stateRef.current === "menu") {
        if (e.code === "Space") { e.preventDefault(); handleStart(); }
        return;
      }
      if (stateRef.current !== "playing") return;
      switch (e.code) {
        case "ArrowLeft": e.preventDefault(); moveLeft(); break;
        case "ArrowRight": e.preventDefault(); moveRight(); break;
        case "ArrowUp": e.preventDefault(); rotatePiece(); break;
        case "ArrowDown": e.preventDefault(); hardDrop(); break;
        case "Space": e.preventDefault(); hardDrop(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [moveLeft, moveRight, rotatePiece, hardDrop, handleStart]);

  /* ── Touch controls ───────────────────────────── */
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (stateRef.current === "menu") { handleStart(); return; }
    if (stateRef.current !== "playing") return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, [handleStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStart.current || stateRef.current !== "playing") return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;

    if (dt < 200 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      // Tap = rotate
      rotatePiece();
    } else if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 30) moveRight();
      else if (dx < -30) moveLeft();
    } else {
      // Vertical swipe down = hard drop
      if (dy > 40) hardDrop();
    }
    touchStart.current = null;
  }, [moveLeft, moveRight, rotatePiece, hardDrop]);

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
          <span className="text-lg">🧩</span>
          <span className="text-[15px] font-bold text-white">블록 퍼즐</span>
          {gameState === "playing" && (
            <span className="text-[12px] text-white/40 ml-2">
              {displayScore}점 | {displayLines}줄
            </span>
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => { if (gameState === "menu") handleStart(); }}
          style={{ touchAction: "none" }}
        />

        {/* Mobile controls (bottom buttons) */}
        {gameState === "playing" && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
            <button onTouchStart={(e) => { e.preventDefault(); moveLeft(); }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl active:bg-white/20"
              style={{ background: "rgba(255,255,255,0.08)" }}>←</button>
            <button onTouchStart={(e) => { e.preventDefault(); rotatePiece(); }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl active:bg-white/20"
              style={{ background: "rgba(255,255,255,0.08)" }}>↻</button>
            <button onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl active:bg-white/20"
              style={{ background: "rgba(255,255,255,0.08)" }}>↓</button>
            <button onTouchStart={(e) => { e.preventDefault(); moveRight(); }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl active:bg-white/20"
              style={{ background: "rgba(255,255,255,0.08)" }}>→</button>
          </div>
        )}

        <AnimatePresence>
          {gameState === "gameover" && !showLeaderboard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="w-[300px] max-w-[90vw] flex flex-col items-center text-center p-6 rounded-3xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-4xl mb-2">🧩</span>
                <h2 className="text-[22px] font-bold text-white">게임 오버!</h2>
                <div className="mt-4 w-full rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] text-white/40">최종 점수</p>
                  <p className="text-[36px] font-bold text-white leading-tight">{lastScore}</p>
                  <p className="text-[13px] text-white/30 mt-1">{displayLines}줄 클리어</p>
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
              <GameLeaderboard score={lastScore} onRestart={handleRestart} onClose={onClose} gameId="block-puzzle" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
