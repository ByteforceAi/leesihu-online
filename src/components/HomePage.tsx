import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParticleCanvas from "./ParticleCanvas";
import Stars from "./Stars";
import ServerSelect from "./ServerSelect";
import MusicPlayer from "./MusicPlayer";
import BootSequence from "./BootSequence";
import { SITE_CONFIG } from "../config/site";

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [phase, setPhase] = useState(0);
  const [showNav, setShowNav] = useState(false);

  // After boot completes, start Phase 0 → 1 transition
  const handleBootComplete = useCallback(() => {
    setBooting(false);
    // Phase 0 → 1: auto-transition after 500ms
    setTimeout(() => setPhase(1), 500);
  }, []);

  // Phase 2 → 3: auto-transition after 1500ms
  useEffect(() => {
    if (phase === 2) {
      const timer = setTimeout(() => setPhase(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Phase 1 click handler → Phase 2
  const handleClick = useCallback(() => {
    if (phase === 1) {
      setPhase(2);
    }
  }, [phase]);

  // Background filter based on phase
  const bgFilter =
    phase <= 1
      ? "brightness(0.5) saturate(1.1)"
      : phase === 2
        ? "brightness(0.7) saturate(1.25)"
        : "brightness(0.55) saturate(1.2)";

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ touchAction: phase === 1 ? "manipulation" : "auto" }}
      onClick={handleClick}
    >
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        {/* Background image */}
        <img
          src="/assets/bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-out"
          style={{ filter: bgFilter }}
          onError={(e) => {
            // Fallback: hide image so gradient shows through
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {/* CSS gradient fallback (shows when image missing or as overlay) */}
        <div
          className="absolute inset-0 transition-all duration-[1500ms] ease-out"
          style={{
            background: `
              radial-gradient(ellipse at 50% 40%, rgba(13, 60, 40, 0.8) 0%, rgba(10, 15, 20, 1) 70%),
              radial-gradient(ellipse at 80% 20%, rgba(52, 211, 153, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 60%, rgba(251, 191, 36, 0.05) 0%, transparent 50%),
              linear-gradient(to bottom, #0a0f14 0%, #0d1a12 50%, #0a0f14 100%)
            `,
            filter: bgFilter,
            mixBlendMode: "multiply",
          }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10, 15, 20, 0.5) 0%, rgba(13, 26, 18, 0.2) 40%, rgba(10, 15, 20, 0.6) 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      {/* Stars */}
      <Stars />

      {/* Particles */}
      <ParticleCanvas converge={phase === 2} />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* Phase 1: Atmospheric text */}
        <AnimatePresence>
          {phase === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center gap-4 cursor-pointer px-6"
            >
              <p
                className="font-display text-center leading-relaxed"
                style={{
                  fontSize: "clamp(14px, 4vw, 20px)",
                  letterSpacing: "3px",
                  color: "rgba(200, 230, 210, 0.7)",
                }}
              >
                블록 하나하나에 담긴 세계가
              </p>
              <p
                className="font-display text-center leading-relaxed"
                style={{
                  fontSize: "clamp(14px, 4vw, 20px)",
                  letterSpacing: "3px",
                  color: "rgba(200, 230, 210, 0.7)",
                }}
              >
                당신의 발걸음을 기다리고 있습니다
              </p>

              {/* Hint */}
              <p
                className="mt-12 animate-hint-breath"
                style={{
                  fontSize: "clamp(11px, 2.5vw, 13px)",
                  letterSpacing: "4px",
                  color: "rgba(52, 211, 153, 0.5)",
                }}
              >
                {SITE_CONFIG.enterText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 3: Portal reveal */}
        <AnimatePresence>
          {phase === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center px-6"
            >
              {/* Category text */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0 }}
                className="font-display mb-4"
                style={{
                  fontSize: "clamp(11px, 2.5vw, 14px)",
                  letterSpacing: "8px",
                  color: "rgba(52, 211, 153, 0.6)",
                  textShadow: "0 0 20px rgba(52, 211, 153, 0.3)",
                }}
              >
                {SITE_CONFIG.categoryText}
              </motion.p>

              {/* Main title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="font-display font-semibold text-center"
                style={{
                  fontSize: "clamp(38px, 11vw, 80px)",
                  letterSpacing: "clamp(6px, 2vw, 18px)",
                  background:
                    "linear-gradient(135deg, #a7f3d0 0%, #34d399 30%, #fbbf24 70%, #fde68a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 30px rgba(52, 211, 153, 0.3))",
                }}
              >
                {SITE_CONFIG.title}
              </motion.h1>

              {/* Decorative line */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-48 md:w-64 h-px my-4"
                style={{
                  background:
                    "linear-gradient(to right, transparent, rgba(52, 211, 153, 0.4), rgba(251, 191, 36, 0.3), transparent)",
                }}
              />

              {/* Suffix */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="font-display"
                style={{
                  fontSize: "clamp(16px, 4vw, 24px)",
                  letterSpacing: "clamp(4px, 1.5vw, 12px)",
                  color: "rgba(251, 191, 36, 0.7)",
                  textShadow: "0 0 15px rgba(251, 191, 36, 0.2)",
                }}
              >
                {SITE_CONFIG.titleSuffix}
              </motion.p>

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, delay: 1, ease: [0.23, 1, 0.32, 1] }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNav(true);
                }}
                className="mt-12 px-12 py-4 rounded-full font-display text-sm tracking-[6px] cursor-pointer
                  transition-all duration-500 hover:scale-105
                  hover:shadow-[0_0_40px_rgba(52,211,153,0.2)]"
                style={{
                  background: "rgba(52, 211, 153, 0.08)",
                  border: "1px solid rgba(52, 211, 153, 0.25)",
                  color: "rgba(52, 211, 153, 0.85)",
                  textShadow: "0 0 10px rgba(52, 211, 153, 0.3)",
                }}
              >
                {SITE_CONFIG.buttonText}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Server select modal */}
      <ServerSelect open={showNav} onClose={() => setShowNav(false)} />

      {/* Music player */}
      <MusicPlayer />

      {/* Boot sequence overlay */}
      {booting && <BootSequence onComplete={handleBootComplete} />}
    </div>
  );
}
