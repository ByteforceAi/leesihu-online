import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
}

const bootLines = [
  { text: "LEESIHU.ONLINE PORTAL SYSTEM v2.0", delay: 0 },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 200 },
  { text: "", delay: 300 },
  { text: "Initializing quantum bridge...", delay: 400 },
  { text: "[OK] Neural network connected", delay: 900 },
  { text: "[OK] World data synchronized", delay: 1400 },
  { text: "[OK] Block matrix loaded: 256 chunks", delay: 1900 },
  { text: "", delay: 2300 },
  { text: "Establishing portal connection...", delay: 2400 },
  { text: "█████████████████████████ 100%", delay: 2900 },
  { text: "", delay: 3300 },
  { text: "PORTAL GATEWAY: ACTIVE", delay: 3400 },
  { text: "Welcome, Player.", delay: 3900 },
];

function TypewriterLine({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (text === "") {
      setDone(true);
      onDone();
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onDone();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [text, onDone]);

  if (text === "") return <div className="h-4" />;

  const isOk = text.startsWith("[OK]");
  const isPortal = text.includes("PORTAL GATEWAY: ACTIVE");
  const isWelcome = text.includes("Welcome");
  const isProgress = text.includes("█");
  const isTitle = text.includes("LEESIHU.ONLINE");

  return (
    <div
      className="font-mono leading-relaxed"
      style={{
        fontSize: "clamp(11px, 2vw, 14px)",
        color: isPortal
          ? "#34d399"
          : isWelcome
            ? "#fbbf24"
            : isOk
              ? "rgba(52,211,153,0.7)"
              : isProgress
                ? "rgba(52,211,153,0.5)"
                : isTitle
                  ? "rgba(200,230,210,0.9)"
                  : "rgba(200,230,210,0.5)",
        textShadow: isPortal
          ? "0 0 20px rgba(52,211,153,0.5)"
          : isWelcome
            ? "0 0 15px rgba(251,191,36,0.4)"
            : "none",
      }}
    >
      {displayed}
      {!done && (
        <span
          className="inline-block w-[8px] h-[14px] ml-[2px] align-middle"
          style={{
            backgroundColor: "rgba(52,211,153,0.8)",
            animation: "blink 0.6s step-end infinite",
          }}
        />
      )}
    </div>
  );
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [phase, setPhase] = useState<"boot" | "portal" | "done">("boot");
  const [_linesDone, setLinesDone] = useState<Set<number>>(new Set());

  // Trigger lines sequentially based on delay
  useEffect(() => {
    const timers = bootLines.map((line, index) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, index]);
      }, line.delay)
    );

    // After last line, wait then transition to portal phase
    const portalTimer = setTimeout(() => {
      setPhase("portal");
    }, 4800);

    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 6500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(portalTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const handleLineDone = useCallback((index: number) => {
    setLinesDone((prev) => new Set(prev).add(index));
  }, []);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ background: "#050a08" }}
        >
          {/* Neon spinning rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer ring */}
            <div
              className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full"
              style={{
                border: "1px solid rgba(52,211,153,0.1)",
                animation: "spin 8s linear infinite",
              }}
            >
              {/* Neon arc segment */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px]"
                style={{
                  background: "linear-gradient(to right, transparent, #34d399, transparent)",
                  boxShadow: "0 0 15px rgba(52,211,153,0.5), 0 0 30px rgba(52,211,153,0.2)",
                }}
              />
            </div>

            {/* Middle ring - counter spin */}
            <div
              className="absolute w-[220px] h-[220px] md:w-[300px] md:h-[300px] rounded-full"
              style={{
                border: "1px solid rgba(251,191,36,0.08)",
                animation: "spin 12s linear infinite reverse",
              }}
            >
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[2px]"
                style={{
                  background: "linear-gradient(to right, transparent, #fbbf24, transparent)",
                  boxShadow: "0 0 12px rgba(251,191,36,0.4), 0 0 25px rgba(251,191,36,0.15)",
                }}
              />
            </div>

            {/* Inner ring */}
            <div
              className="absolute w-[140px] h-[140px] md:w-[200px] md:h-[200px] rounded-full"
              style={{
                border: "1px solid rgba(52,211,153,0.06)",
                animation: "spin 6s linear infinite",
              }}
            >
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-[1.5px]"
                style={{
                  background: "linear-gradient(to right, transparent, #34d399, transparent)",
                  boxShadow: "0 0 10px rgba(52,211,153,0.4)",
                }}
              />
            </div>

            {/* Center dot pulse */}
            <div
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: "rgba(52,211,153,0.6)",
                boxShadow: "0 0 20px rgba(52,211,153,0.4), 0 0 40px rgba(52,211,153,0.2)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />

            {/* Portal activation flash */}
            {phase === "portal" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 3, opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-[200px] h-[200px] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(52,211,153,0.3) 0%, transparent 70%)",
                }}
              />
            )}
          </div>

          {/* Terminal text overlay */}
          <div className="relative z-10 w-full max-w-[500px] px-8">
            <div className="space-y-1">
              {visibleLines.map((lineIndex) => (
                <TypewriterLine
                  key={lineIndex}
                  text={bootLines[lineIndex].text}
                  onDone={() => handleLineDone(lineIndex)}
                />
              ))}
            </div>
          </div>

          {/* Scan lines overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(52,211,153,0.1) 2px, rgba(52,211,153,0.1) 4px)",
            }}
          />

          {/* Skip hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 text-center w-full"
            style={{
              fontSize: "11px",
              letterSpacing: "3px",
              color: "rgba(52,211,153,0.25)",
            }}
          >
            SYSTEM INITIALIZING...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
