import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"logo" | "loading" | "flash" | "done">("logo");

  useEffect(() => {
    // Phase 1: Show logo (0.5s)
    const t1 = setTimeout(() => setPhase("loading"), 500);

    // Phase 2: Progress bar fills (2s)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Ease-in-out progress curve
        const remaining = 100 - p;
        const step = Math.max(0.5, remaining * 0.06);
        return Math.min(100, p + step);
      });
    }, 30);

    // Phase 3: Flash + done (at 2.8s)
    const t3 = setTimeout(() => {
      setProgress(100);
      setPhase("flash");
    }, 2800);

    // Phase 4: Complete (at 3.3s)
    const t4 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(interval);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "flash" ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "#000" }}
    >
      {/* White flash */}
      {phase === "flash" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-white"
        />
      )}

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-col items-center"
      >
        {/* Logo mark - minimal geometric */}
        <div className="relative mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #30D158 0%, #34d399 50%, #0EA5E9 100%)",
              boxShadow: "0 0 40px rgba(48,209,88,0.2)",
            }}
          >
            <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
              L
            </span>
          </div>
          {/* Subtle glow ring */}
          <div
            className="absolute -inset-4 rounded-3xl"
            style={{
              background: "radial-gradient(circle, rgba(48,209,88,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Title */}
        <h1
          className="text-xl tracking-[8px] mb-2 font-medium"
          style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Inter', sans-serif" }}
        >
          LEESIHU
        </h1>
        <p
          className="text-xs tracking-[4px] mb-12"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          .ONLINE
        </p>
      </motion.div>

      {/* iOS-style progress bar */}
      {(phase === "loading" || phase === "flash") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-48"
        >
          <div
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #30D158, #34d399)",
                boxShadow: "0 0 10px rgba(48,209,88,0.4)",
                transition: "width 0.1s ease-out",
              }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
