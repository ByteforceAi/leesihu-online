import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [phase, setPhase] = useState<"black" | "typing" | "ready" | "flash" | "done">("black");
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [progress, setProgress] = useState(0);
  const fullText = "leesihu.online";
  const charIndex = useRef(0);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(id);
  }, []);

  // Boot phases
  useEffect(() => {
    // 0.5s: start typing
    const t1 = setTimeout(() => {
      setPhase("typing");
      // Typewriter interval
      const typeId = setInterval(() => {
        charIndex.current++;
        if (charIndex.current >= fullText.length) {
          clearInterval(typeId);
          setTypedText(fullText);
          // 0.5s after typing done → ready
          setTimeout(() => setPhase("ready"), 500);
        } else {
          setTypedText(fullText.slice(0, charIndex.current));
        }
      }, 90);
    }, 500);

    // Progress bar
    const progressId = setInterval(() => {
      setProgress((p) => Math.min(100, p + (100 - p) * 0.04 + 0.5));
    }, 30);

    return () => {
      clearTimeout(t1);
      clearInterval(progressId);
    };
  }, []);

  // Handle tap to enter
  const handleEnter = () => {
    if (phase !== "ready") return;
    setPhase("flash");
    setProgress(100);
    setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 500);
  };

  if (phase === "done") return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "flash" ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
      style={{ background: "#000" }}
      onClick={handleEnter}
      onTouchStart={handleEnter}
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

      {/* Logo + text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: phase !== "black" ? 1 : 0, scale: phase !== "black" ? 1 : 0.7 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-col items-center"
      >
        {/* Logo */}
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
          <span
            className="text-xl tracking-[6px] font-medium"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {typedText}
            <span
              className="inline-block w-[2px] h-[20px] ml-[2px] align-middle"
              style={{
                background: "#30D158",
                opacity: showCursor && phase !== "ready" ? 1 : 0,
              }}
            />
          </span>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: typedText === fullText ? 0.3 : 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[4px] mb-8"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          GAME CREATOR
        </motion.p>

        {/* Progress bar OR "tap to enter" */}
        {phase === "ready" ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-center"
          >
            <p className="text-[13px] text-white/40 tracking-wider">터치하여 입장</p>
          </motion.div>
        ) : (
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
              <div
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
    </motion.div>
  );
}
