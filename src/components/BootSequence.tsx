import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { playBootBeep, playBootComplete, playPortalEnter } from "../lib/sounds";

interface Props {
  onComplete: () => void;
}

// Matrix rain characters — game themed
const MATRIX_CHARS = "GAMEPLAYONLINECONNECTSIHUWORLD⛏🎮🔗💎🗡️⭐🏆🎵✦●".split("");

// Boot status messages
const BOOT_MESSAGES = [
  { text: "> 연결 중...", delay: 500, sound: false },
  { text: "> 서버 응답 확인 ✓", delay: 1500, sound: true },
  { text: "> 월드 데이터 로딩 ████████░░ 82%", delay: 2500, sound: false },
  { text: "> 포탈 개방 중... ✓", delay: 3200, sound: true },
  { text: "> 접속 완료!", delay: 3800, sound: true },
];

export default function BootSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState<"black" | "matrix" | "portal" | "ready" | "enter" | "done">("black");
  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const columnsRef = useRef<number[]>([]);

  // Matrix rain
  useEffect(() => {
    if (phase !== "matrix" && phase !== "portal") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const fontSize = 14;
    const cols = Math.floor(w / fontSize);
    if (columnsRef.current.length === 0) {
      columnsRef.current = Array(cols).fill(0).map(() => Math.random() * -50);
    }

    const draw = () => {
      // Trail fade
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < cols; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const x = i * fontSize;
        const y = columnsRef.current[i] * fontSize;

        // Color: green or cyan randomly
        ctx.fillStyle = Math.random() > 0.5
          ? `rgba(48, 209, 88, ${0.5 + Math.random() * 0.5})`
          : `rgba(14, 165, 233, ${0.3 + Math.random() * 0.4})`;

        ctx.fillText(char, x, y);

        // Bright head character
        if (Math.random() > 0.95) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillText(char, x, y);
        }

        // Reset column or advance
        if (y > h && Math.random() > 0.975) {
          columnsRef.current[i] = 0;
        }
        columnsRef.current[i] += 0.5 + Math.random() * 0.5;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  // Boot sequence timing
  useEffect(() => {
    // Phase 0→1: Start matrix
    const t0 = setTimeout(() => setPhase("matrix"), 400);

    // Messages appear one by one
    BOOT_MESSAGES.forEach((msg) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, msg.text]);
        if (msg.sound) playBootBeep();
      }, msg.delay);
    });

    // Progress bar
    const progId = setInterval(() => {
      setProgress((p) => Math.min(100, p + (100 - p) * 0.03 + 0.3));
    }, 30);

    // Phase 2: Portal opens
    const t2 = setTimeout(() => {
      setPhase("portal");
      playBootComplete();
      setProgress(100);
    }, 4200);

    // Phase 3: Ready to enter
    const t3 = setTimeout(() => setPhase("ready"), 5200);

    return () => {
      clearTimeout(t0);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(progId);
    };
  }, []);

  // Handle enter
  const handleEnter = useCallback(() => {
    if (phase !== "ready") return;
    setPhase("enter");
    playPortalEnter();
    setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 600);
  }, [phase, onComplete]);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden cursor-pointer"
      style={{ background: "#000" }}
      onClick={handleEnter}
      onTouchStart={handleEnter}
    >
      {/* Matrix rain canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          opacity: phase === "portal" || phase === "ready" ? 0.3 : phase === "enter" ? 0 : 1,
          transition: "opacity 1s ease-out",
        }}
      />

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Portal glow (Phase 2+) */}
      {(phase === "portal" || phase === "ready" || phase === "enter") && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: phase === "enter" ? "300vmax" : 300,
            height: phase === "enter" ? "300vmax" : 300,
            opacity: phase === "enter" ? 1 : 0.8,
          }}
          transition={{
            duration: phase === "enter" ? 0.5 : 1.5,
            ease: phase === "enter" ? "easeIn" : "easeOut",
          }}
          style={{
            background: "radial-gradient(circle, rgba(48,209,88,0.15) 0%, rgba(14,165,233,0.1) 40%, transparent 70%)",
            boxShadow: "0 0 80px 20px rgba(48,209,88,0.15), 0 0 160px 40px rgba(14,165,233,0.08)",
          }}
        />
      )}

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">

        {/* Logo (always visible after black) */}
        {phase !== "black" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: phase === "enter" ? 0 : 1,
              scale: phase === "enter" ? 1.5 : 1,
            }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="mb-6"
          >
            <h1 className="text-2xl tracking-[8px] font-bold text-center">
              <span style={{ color: "#30D158" }}>LEESIHU</span>
              <span className="text-white/20">.ONLINE</span>
            </h1>
          </motion.div>
        )}

        {/* Terminal messages */}
        {phase === "matrix" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-[300px] max-w-[85vw] space-y-1 mb-8"
          >
            {messages.map((msg, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[12px] font-mono"
                style={{
                  color: msg.includes("✓") ? "#30D158"
                    : msg.includes("완료") ? "#0EA5E9"
                    : "rgba(255,255,255,0.5)",
                }}
              >
                {msg}
              </motion.p>
            ))}
          </motion.div>
        )}

        {/* "터치하여 입장" */}
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-4"
          >
            <p className="text-[14px] text-white/50 tracking-[3px]">터치하여 입장</p>
          </motion.div>
        )}

        {/* Progress bar */}
        {(phase === "matrix") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-48 mt-2"
          >
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #30D158, #0EA5E9)",
                  boxShadow: "0 0 8px rgba(48,209,88,0.4)",
                  transition: "width 0.15s ease-out",
                }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Enter flash */}
      {phase === "enter" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute inset-0 bg-white z-20"
        />
      )}
    </div>
  );
}
