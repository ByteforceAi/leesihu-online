import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [phase, setPhase] = useState<"black" | "logo" | "typing" | "flash" | "done">("black");
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [progress, setProgress] = useState(0);

  const fullText = "leesihu.online";

  useEffect(() => {
    // Phase 0: Pure black (0.3s)
    const t0 = setTimeout(() => setPhase("logo"), 300);

    // Phase 1: Logo appears (0.8s)
    const t1 = setTimeout(() => setPhase("typing"), 1100);

    // Phase 2: Typewriter starts at 1.1s
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (phase !== "typing" && phase !== "logo") return;
      if (charIndex < fullText.length) {
        charIndex++;
        setTypedText(fullText.slice(0, charIndex));
      }
    }, 100); // 100ms per character

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        const remaining = 100 - p;
        return Math.min(100, p + remaining * 0.04 + 0.5);
      });
    }, 30);

    // Phase 3: Flash at 3.2s
    const t3 = setTimeout(() => {
      setProgress(100);
      setPhase("flash");
    }, 3200);

    // Phase 4: Done at 3.7s
    const t4 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3700);

    // Cursor blink
    const cursorInterval = setInterval(() => {
      setShowCursor((c) => !c);
    }, 530);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(typeInterval);
      clearInterval(progressInterval);
      clearInterval(cursorInterval);
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
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-white"
        />
      )}

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{
          opacity: phase !== "black" ? 1 : 0,
          scale: phase !== "black" ? 1 : 0.7,
        }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-col items-center"
      >
        {/* Logo mark */}
        <div className="relative mb-8">
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #30D158 0%, #34d399 50%, #0EA5E9 100%)",
            }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(48,209,88,0.2)",
                "0 0 40px rgba(48,209,88,0.4)",
                "0 0 20px rgba(48,209,88,0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white text-2xl font-bold">L</span>
          </motion.div>
        </div>

        {/* Typewriter text */}
        <div className="h-8 flex items-center justify-center mb-2">
          <motion.span
            className="text-xl tracking-[6px] font-medium"
            style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Inter', sans-serif" }}
          >
            {typedText}
            <motion.span
              className="inline-block w-[2px] h-[20px] ml-[2px] align-middle"
              style={{
                background: "#30D158",
                opacity: showCursor ? 1 : 0,
              }}
            />
          </motion.span>
        </div>

        {/* Subtitle (fades in after typing) */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: typedText.length >= fullText.length ? 0.3 : 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[4px] mb-10"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          GAME CREATOR
        </motion.p>
      </motion.div>

      {/* Progress bar */}
      {phase !== "black" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-40"
        >
          <div
            className="h-[2px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #30D158, #0EA5E9)",
                boxShadow: "0 0 8px rgba(48,209,88,0.4)",
                transition: "width 0.1s ease-out",
              }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
