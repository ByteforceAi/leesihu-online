import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import PremiumTabBar from "./PremiumTabBar";
import BootSequence from "./BootSequence";
import Guestbook from "./Guestbook";
import Timeline from "./Timeline";
import VisitorCount from "./VisitorCount";
import AdminNotice from "./AdminNotice";
import ChatBot from "./ChatBot";
import DynamicIsland from "./DynamicIsland";
import MinecraftParticles from "./MinecraftParticles";
import FriendChatFlow from "./FriendChatFlow";
import { SITE_CONFIG } from "../config/site";
import { playTabSwitch, playButtonClick } from "../lib/sounds";

type Tab = "home" | "timeline" | "guestbook";

/* ─── Tab transition variants ─── */
const tabVariants = {
  initial: { opacity: 0, filter: "blur(8px)", scale: 0.97 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
  exit: { opacity: 0, filter: "blur(4px)", scale: 1.02 },
};

const tabTransition = { duration: 0.3 };

/* ─── App Icon Component ─── */
function AppIcon({
  icon,
  label,
  gradient,
  onClick,
  badge,
  delay = 0,
  jiggling = false,
  index = 0,
}: {
  icon: string;
  label: string;
  gradient: string;
  onClick: () => void;
  badge?: string;
  delay?: number;
  jiggling?: boolean;
  index?: number;
}) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const iconRef = useRef<HTMLDivElement>(null);

  const handleTap = () => {
    setPressed(true);
    setRipple(true);
    playButtonClick();
    setTimeout(() => setPressed(false), 200);
    setTimeout(() => setRipple(false), 600);
    setTimeout(onClick, 150);
  };

  // 3D tilt on mouse move (desktop)
  const handleMouseMove = (e: React.MouseEvent) => {
    const el = iconRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltX(y * -15);
    setTiltY(x * 15);
  };
  const handleMouseLeave = () => { setTiltX(0); setTiltY(0); };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleTap}
      className={`flex flex-col items-center gap-1.5 cursor-pointer relative ${jiggling ? "jiggle" : ""}`}
      style={{
        animation: jiggling ? undefined : "float-idle 3s ease-in-out infinite",
        animationDelay: `${index * 0.15}s`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon square with 3D tilt */}
      <motion.div
        ref={iconRef}
        className="relative w-[60px] h-[60px] rounded-[16px] flex items-center justify-center overflow-hidden"
        style={{
          background: gradient,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          transform: `perspective(200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: "transform 0.15s ease-out",
        }}
        animate={{ scale: pressed ? 0.85 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}
      >
        <span className="text-[26px]">{icon}</span>

        {/* Ripple effect */}
        {ripple && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="w-4 h-4 rounded-full bg-white/30"
              style={{ animation: "ripple-expand 0.6s ease-out forwards" }}
            />
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1">
            <span className="text-[10px] font-bold text-white">{badge}</span>
          </div>
        )}
      </motion.div>

      {/* Label */}
      <span className="text-[11px] text-white/60 font-medium">{label}</span>
    </motion.button>
  );
}

/* ─── Letter stagger for title ─── */
const letterContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ═══════════════════════════════════════ */

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showFriendAdd, setShowFriendAdd] = useState(false);
  const [jiggleMode, setJiggleMode] = useState(false);
  const [visitorCount] = useState(1);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Music
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parallax
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const heroY = useTransform(scrollY, [0, 300], [0, 80]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.15]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0.3]);

  const handleBootComplete = useCallback(() => {
    setBooting(false);
    setTimeout(() => setReady(true), 50);
  }, []);

  const handleServerTap = (server: (typeof SITE_CONFIG.servers)[0]) => {
    if (server.disabled || loadingId) return;
    setLoadingId(server.id);
    setTimeout(() => {
      window.open(server.url, "_blank");
      setLoadingId(null);
    }, 800);
  };

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play().catch(() => {}); }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black">
      {/* Audio */}
      {SITE_CONFIG.music.enabled && (
        <audio ref={audioRef} src={SITE_CONFIG.music.src} preload="metadata" loop />
      )}

      {/* Dynamic Island */}
      {ready && !booting && (
        <DynamicIsland
          visitorCount={visitorCount}
          isPlaying={isPlaying}
          songTitle={SITE_CONFIG.music.title}
        />
      )}

      {ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full flex flex-col"
        >
          {/* ══════ CONTENT ══════ */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <AnimatePresence mode="wait">

              {/* ───── HOME ───── */}
              {activeTab === "home" && (
                <motion.div
                  key="home"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={tabTransition}
                >
                  {/* Parallax Hero with Minecraft particles */}
                  <div className="relative w-full aspect-[16/9] max-h-[400px] overflow-hidden">
                    <MinecraftParticles />
                    {/* Cinematic entrance wrapper */}
                    <motion.div
                      className="absolute inset-0"
                      initial={{ filter: "blur(15px)", scale: 1.08 }}
                      animate={{ filter: "blur(0px)", scale: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <motion.img
                        src="/assets/bg.png"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          filter: "brightness(0.65) saturate(1.3)",
                          y: heroY,
                          scale: heroScale,
                          opacity: heroOpacity,
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </motion.div>
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 70%, #000 100%)",
                      }}
                    />
                    {/* Profile */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 max-w-[600px] mx-auto">
                      <h1 className="text-[28px] font-bold leading-tight mb-1">
                        <motion.span
                          className="text-shimmer inline-flex"
                          variants={letterContainerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {"LEESIHU".split("").map((char, i) => (
                            <motion.span key={i} variants={letterVariants}>
                              {char}
                            </motion.span>
                          ))}
                        </motion.span>
                        <span className="text-white/25">.ONLINE</span>
                      </h1>
                      <p className="text-[13px] text-white/45 mb-3">Game Creator</p>
                      <VisitorCount />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="max-w-[600px] mx-auto px-5 pt-6 pb-28">

                    <AdminNotice />

                    {/* ─── App Icon Grid (iOS Home Screen) ─── */}
                    {/* Long press to jiggle */}
                    {jiggleMode && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setJiggleMode(false)}
                        className="w-full text-center text-[12px] text-[#0A84FF] mb-2 cursor-pointer"
                      >
                        완료
                      </motion.button>
                    )}
                    <div
                      className="grid grid-cols-4 gap-y-5 gap-x-2 justify-items-center mb-8 mt-2"
                      onTouchStart={() => {
                        longPressTimer.current = setTimeout(() => setJiggleMode(true), 600);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      onMouseDown={() => {
                        longPressTimer.current = setTimeout(() => setJiggleMode(true), 600);
                      }}
                      onMouseUp={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                    >
                      {SITE_CONFIG.servers.map((server, i) => (
                        <AppIcon
                          key={server.id}
                          icon={server.id === "game" ? "🎮" : "🔗"}
                          label={server.name}
                          gradient={server.gradient}
                          onClick={() => handleServerTap(server)}
                          delay={0.1 + i * 0.08}
                          jiggling={jiggleMode}
                          index={i}
                        />
                      ))}
                      <AppIcon
                        icon="💬"
                        label="방명록"
                        gradient="linear-gradient(135deg, #845ef7, #6366F1)"
                        onClick={() => setActiveTab("guestbook")}
                        delay={0.26}
                        jiggling={jiggleMode}
                        index={SITE_CONFIG.servers.length}
                      />
                      <AppIcon
                        icon="📅"
                        label="타임라인"
                        gradient="linear-gradient(135deg, #ff922b, #f06595)"
                        onClick={() => setActiveTab("timeline")}
                        delay={0.34}
                        jiggling={jiggleMode}
                        index={SITE_CONFIG.servers.length + 1}
                      />
                      <AppIcon
                        icon="🤝"
                        label="친구추가"
                        gradient="linear-gradient(135deg, #30D158, #20c997)"
                        onClick={() => setShowFriendAdd(true)}

                        delay={0.42}
                        jiggling={jiggleMode}
                        index={SITE_CONFIG.servers.length + 2}
                      />
                      <AppIcon
                        icon={isPlaying ? "⏸️" : "🎵"}
                        label={isPlaying ? "재생 중" : "음악"}
                        gradient={isPlaying
                          ? "linear-gradient(135deg, #30D158, #51cf66)"
                          : "linear-gradient(135deg, #339af0, #228be6)"}
                        onClick={toggleMusic}
                        delay={0.5}
                        jiggling={jiggleMode}
                        index={SITE_CONFIG.servers.length + 3}
                      />
                    </div>

                    {/* Footer spacer */}
                    <div className="h-4" />
                  </div>
                </motion.div>
              )}

              {/* ───── TIMELINE ───── */}
              {activeTab === "timeline" && (
                <motion.div
                  key="timeline"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={tabTransition}
                  className="max-w-[600px] mx-auto px-5 pt-4 pb-28"
                >
                  <button
                    onClick={() => setActiveTab("home")}
                    className="flex items-center gap-1 text-[#0A84FF] text-[15px] mb-2 cursor-pointer"
                  >
                    <span>← 홈</span>
                  </button>
                  <h1 className="text-[34px] font-bold text-white mb-6">타임라인</h1>
                  <Timeline />
                </motion.div>
              )}

              {/* ───── GUESTBOOK ───── */}
              {activeTab === "guestbook" && (
                <motion.div
                  key="guestbook"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={tabTransition}
                  className="max-w-[600px] mx-auto px-5 pt-4 pb-28"
                >
                  <button
                    onClick={() => setActiveTab("home")}
                    className="flex items-center gap-1 text-[#0A84FF] text-[15px] mb-2 cursor-pointer"
                  >
                    <span>← 홈</span>
                  </button>
                  <h1 className="text-[34px] font-bold text-white mb-6">방명록</h1>
                  <Guestbook />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Chatbot */}
          <ChatBot />

          {/* Friend Chat Flow */}
          <AnimatePresence>
            {showFriendAdd && (
              <FriendChatFlow onClose={() => setShowFriendAdd(false)} />
            )}
          </AnimatePresence>

          {/* Tab Bar */}
          <PremiumTabBar
            activeTab={activeTab}
            onTabChange={(tab) => { playTabSwitch(); setActiveTab(tab); }}
            isPlaying={isPlaying}
            onToggleMusic={() => { playButtonClick(); toggleMusic(); }}
          />
        </motion.div>
      )}

      {booting && <BootSequence onComplete={handleBootComplete} />}
    </div>
  );
}

/* FriendAddModal removed — replaced by FriendChatFlow */
