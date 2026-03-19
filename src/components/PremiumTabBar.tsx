import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Tab = "home" | "timeline" | "guestbook";

interface PremiumTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isPlaying: boolean;
  onToggleMusic: () => void;
}

/* ─── Custom SVG Icons (thicker, rounder, more personality) ─── */

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M4 10.5L12 4L20 10.5V19C20 19.55 19.55 20 19 20H15.5C14.95 20 14.5 19.55 14.5 19V15.5C14.5 14.95 14.05 14.5 13.5 14.5H10.5C9.95 14.5 9.5 14.95 9.5 15.5V19C9.5 19.55 9.05 20 8.5 20H5C4.45 20 4 19.55 4 19V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        initial={false}
        animate={{ fillOpacity: active ? 0.25 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}

function IconTimeline({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <motion.circle
        cx="12" cy="12" r="9"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
        initial={false}
        animate={{ fillOpacity: active ? 0.15 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M12 7V12L15 14"
        stroke={active ? "rgba(255,255,255,0.9)" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGuestbook({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M4 6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H8L4 20V6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        initial={false}
        animate={{ fillOpacity: active ? 0.2 : 0 }}
        transition={{ duration: 0.3 }}
      />
      {/* Dots inside bubble */}
      <circle cx="9" cy="10" r="1" fill={active ? "rgba(255,255,255,0.8)" : "currentColor"} />
      <circle cx="12" cy="10" r="1" fill={active ? "rgba(255,255,255,0.8)" : "currentColor"} />
      <circle cx="15" cy="10" r="1" fill={active ? "rgba(255,255,255,0.8)" : "currentColor"} />
    </svg>
  );
}

/* ─── Audio Visualizer Bars ─── */
function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[2.5px] h-[20px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-[2.5px] rounded-full"
          style={{
            background: "linear-gradient(to top, #30D158, #5AF27B)",
          }}
          initial={{ height: 4 }}
          animate={
            isPlaying
              ? {
                  height: [4, 8 + Math.random() * 12, 4, 12 + Math.random() * 8, 4],
                }
              : { height: 4 }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.8 + i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.08,
                }
              : { duration: 0.4 }
          }
        />
      ))}
    </div>
  );
}

/* ─── Music Icon (note icon with pulse ring) ─── */
function IconMusic({ isPlaying }: { isPlaying: boolean }) {
  if (isPlaying) {
    return <AudioVisualizer isPlaying={isPlaying} />;
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18V5L21 3V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="19" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/* ─── Floating Pill Indicator ─── */
function PillIndicator({ index }: { index: number }) {
  // Each tab slot is 25% wide, pill sits centered in the slot
  const xPercent = index * 25;

  return (
    <motion.div
      className="absolute top-0 h-full pointer-events-none"
      style={{ width: "25%" }}
      initial={false}
      animate={{ left: `${xPercent}%` }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 32,
        mass: 0.8,
      }}
    >
      <div className="absolute inset-x-3 top-[6px] bottom-[6px] rounded-2xl tab-pill-bg" />
    </motion.div>
  );
}

/* ─── Glow dot under active tab ─── */
function GlowDot({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute -bottom-[1px] left-1/2 -translate-x-1/2"
    >
      <div
        className="w-[4px] h-[4px] rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 8px 2px ${color}`,
        }}
      />
    </motion.div>
  );
}

/* ─── Music Pulse Ring (when playing) ─── */
function PulseRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 40,
          height: 40,
          border: "1.5px solid rgba(48, 209, 88, 0.3)",
        }}
        animate={{
          scale: [1, 1.6],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 40,
          height: 40,
          border: "1.5px solid rgba(48, 209, 88, 0.2)",
        }}
        animate={{
          scale: [1, 1.8],
          opacity: [0.3, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.4,
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PREMIUM TAB BAR
   ═══════════════════════════════════════════════ */

const TAB_ITEMS: {
  id: Tab | "music";
  label: string;
  labelPlaying?: string;
}[] = [
  { id: "home", label: "홈" },
  { id: "timeline", label: "타임라인" },
  { id: "guestbook", label: "방명록" },
  { id: "music", label: "음악", labelPlaying: "재생 중" },
];

export default function PremiumTabBar({
  activeTab,
  onTabChange,
  isPlaying,
  onToggleMusic,
}: PremiumTabBarProps) {
  const [tapped, setTapped] = useState<string | null>(null);

  // Haptic-like micro-feedback via brief scale bounce
  const handleTap = (id: string) => {
    setTapped(id);
    setTimeout(() => setTapped(null), 200);

    if (id === "music") {
      onToggleMusic();
    } else {
      onTabChange(id as Tab);
    }
  };

  // Figure out which slot index is "active" for the pill
  const activeIndex = (() => {
    const idx = TAB_ITEMS.findIndex((t) => t.id === activeTab);
    return idx >= 0 ? idx : 0;
  })();

  return (
    <div
      className="flex-shrink-0 w-full tab-bar-container"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="max-w-[600px] mx-auto relative">
        {/* Floating pill indicator behind the active tab */}
        <PillIndicator index={activeIndex} />

        <div className="relative grid grid-cols-4 h-[56px]">
          {TAB_ITEMS.map((tab) => {
            const isMusic = tab.id === "music";
            const isActive = isMusic ? false : activeTab === tab.id;
            const isMusicPlaying = isMusic && isPlaying;

            // Color logic
            const color = isMusicPlaying
              ? "#30D158"
              : isActive
                ? "#FFFFFF"
                : "rgba(255,255,255,0.35)";

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTap(tab.id)}
                className="relative flex flex-col items-center justify-center gap-[3px] cursor-pointer z-10"
                animate={{
                  scale: tapped === tab.id ? 0.88 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 600,
                  damping: 20,
                }}
              >
                {/* Pulse rings behind music icon when playing */}
                {isMusicPlaying && <PulseRing />}

                {/* Icon */}
                <motion.div
                  className="relative"
                  style={{ color }}
                  initial={false}
                  animate={{
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {tab.id === "home" && <IconHome active={isActive} />}
                  {tab.id === "timeline" && <IconTimeline active={isActive} />}
                  {tab.id === "guestbook" && <IconGuestbook active={isActive} />}
                  {tab.id === "music" && <IconMusic isPlaying={isPlaying} />}
                </motion.div>

                {/* Label */}
                <motion.span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color }}
                  initial={false}
                  animate={{
                    opacity: isActive || isMusicPlaying ? 1 : 0.6,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {isMusicPlaying ? tab.labelPlaying : tab.label}
                </motion.span>

                {/* Glow dot */}
                <AnimatePresence>
                  {(isActive || isMusicPlaying) && (
                    <GlowDot color={isMusicPlaying ? "#30D158" : "#0A84FF"} />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
