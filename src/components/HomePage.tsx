import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import PremiumTabBar from "./PremiumTabBar";
import BootSequence from "./BootSequence";
import Guestbook from "./Guestbook";
import Timeline from "./Timeline";
import VisitorCount from "./VisitorCount";
import AdminNotice from "./AdminNotice";
import ChatBot from "./ChatBot";
import { SITE_CONFIG } from "../config/site";

type Tab = "home" | "timeline" | "guestbook";

/* ─── App Icon Component ─── */
function AppIcon({
  icon,
  label,
  gradient,
  onClick,
  badge,
  delay = 0,
}: {
  icon: string;
  label: string;
  gradient: string;
  onClick: () => void;
  badge?: string;
  delay?: number;
}) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(false);

  const handleTap = () => {
    setPressed(true);
    setRipple(true);
    setTimeout(() => setPressed(false), 200);
    setTimeout(() => setRipple(false), 600);
    setTimeout(onClick, 150);
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleTap}
      className="flex flex-col items-center gap-1.5 cursor-pointer relative"
    >
      {/* Icon square */}
      <motion.div
        className="relative w-[60px] h-[60px] rounded-[16px] flex items-center justify-center overflow-hidden"
        style={{
          background: gradient,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
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

/* ═══════════════════════════════════════ */

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showFriendAdd, setShowFriendAdd] = useState(false);

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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Parallax Hero */}
                  <div className="relative w-full aspect-[16/9] max-h-[400px] overflow-hidden">
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
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 70%, #000 100%)",
                      }}
                    />
                    {/* Profile */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 max-w-[600px] mx-auto">
                      <div className="flex items-end gap-4">
                        <div
                          className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center flex-shrink-0 avatar-glow"
                          style={{ background: "linear-gradient(135deg, #30D158 0%, #0EA5E9 100%)" }}
                        >
                          <span className="text-[24px] font-bold text-white">L</span>
                        </div>
                        <div className="flex-1 min-w-0 pb-0.5">
                          <h1 className="text-[24px] font-bold leading-tight">
                            <span className="text-shimmer">LEESIHU</span>
                            <span className="text-white/30">.ONLINE</span>
                          </h1>
                          <p className="text-[13px] text-white/50">Game Creator</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <VisitorCount />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="max-w-[600px] mx-auto px-5 pt-6 pb-28">

                    <AdminNotice />

                    {/* ─── App Icon Grid (iOS Home Screen) ─── */}
                    <div className="grid grid-cols-4 gap-y-5 gap-x-2 justify-items-center mb-8 mt-2">
                      {SITE_CONFIG.servers.map((server, i) => (
                        <AppIcon
                          key={server.id}
                          icon={server.id === "game" ? "🎮" : "🔗"}
                          label={server.name}
                          gradient={server.gradient}
                          onClick={() => handleServerTap(server)}
                          delay={0.1 + i * 0.08}
                        />
                      ))}
                      <AppIcon
                        icon="💬"
                        label="방명록"
                        gradient="linear-gradient(135deg, #845ef7, #6366F1)"
                        onClick={() => setActiveTab("guestbook")}
                        delay={0.26}
                      />
                      <AppIcon
                        icon="📅"
                        label="타임라인"
                        gradient="linear-gradient(135deg, #ff922b, #f06595)"
                        onClick={() => setActiveTab("timeline")}
                        delay={0.34}
                      />
                      <AppIcon
                        icon="🤝"
                        label="친구추가"
                        gradient="linear-gradient(135deg, #30D158, #20c997)"
                        onClick={() => setShowFriendAdd(true)}
                        badge="N"
                        delay={0.42}
                      />
                      <AppIcon
                        icon={isPlaying ? "⏸️" : "🎵"}
                        label={isPlaying ? "재생 중" : "음악"}
                        gradient={isPlaying
                          ? "linear-gradient(135deg, #30D158, #51cf66)"
                          : "linear-gradient(135deg, #339af0, #228be6)"}
                        onClick={toggleMusic}
                        delay={0.5}
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/6" />
                      <span className="text-[11px] text-white/20 tracking-wider">QUICK ACCESS</span>
                      <div className="flex-1 h-px bg-white/6" />
                    </div>

                    {/* Server list (compact) */}
                    <div
                      className="rounded-2xl overflow-hidden mb-4"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      {SITE_CONFIG.servers.map((server, index) => {
                        const isLoading = loadingId === server.id;
                        const isLast = index === SITE_CONFIG.servers.length - 1;
                        return (
                          <div key={server.id}>
                            <motion.button
                              onClick={() => handleServerTap(server)}
                              disabled={server.disabled || isLoading}
                              className="w-full text-left cursor-pointer active:bg-white/5 transition-colors"
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-3 px-4 py-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-[15px] font-semibold text-white">{server.name}</h3>
                                    <div className="w-[5px] h-[5px] rounded-full bg-[#30D158]" />
                                  </div>
                                  <p className="text-[12px] text-white/35">{server.description}</p>
                                </div>
                                {isLoading ? (
                                  <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                ) : (
                                  <span className="text-white/20 text-sm">→</span>
                                )}
                              </div>
                            </motion.button>
                            {!isLast && (
                              <div className="ml-4 mr-4 h-px bg-white/5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───── TIMELINE ───── */}
              {activeTab === "timeline" && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
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

          {/* Friend Add Modal */}
          {showFriendAdd && (
            <FriendAddModal onClose={() => setShowFriendAdd(false)} />
          )}

          {/* Tab Bar */}
          <PremiumTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isPlaying={isPlaying}
            onToggleMusic={toggleMusic}
          />
        </motion.div>
      )}

      {booting && <BootSequence onComplete={handleBootComplete} />}
    </div>
  );
}

/* ─── Friend Add Modal (extracted for conditional render) ─── */
function FriendAddModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || sending) return;
    setSending(true);
    const { supabase } = await import("../lib/supabase");
    await supabase.from("guestbook").insert({
      name: `🤝 ${name.trim()}`,
      message: `친구추가 — ${phone.trim()}`,
      emoji: "🤝",
    });
    setSending(false);
    setSuccess(true);
    setTimeout(onClose, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => !success && onClose()}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] rounded-t-3xl sm:rounded-3xl p-6"
        style={{ background: "rgba(25,25,25,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {success ? (
          <div className="flex flex-col items-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
            >
              <span className="text-3xl">✅</span>
            </motion.div>
            <h3 className="text-[20px] font-bold text-white mb-1">친구추가 완료! 🎉</h3>
            <p className="text-[14px] text-white/40">{name}님, 환영합니다!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-[18px] font-bold text-white">친구추가</h3>
              <p className="text-[12px] text-white/35 mt-0.5">시후와 친구가 되어보세요!</p>
            </div>
            <div className="space-y-3 mb-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl text-[15px] text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                maxLength={13}
                className="w-full px-4 py-3 rounded-xl text-[15px] text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
            <motion.button
              onClick={handleSubmit}
              disabled={!name.trim() || !phone.trim() || sending}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-2xl text-[16px] font-semibold text-white cursor-pointer disabled:opacity-30"
              style={{
                background: name.trim() && phone.trim()
                  ? "linear-gradient(135deg, #30D158, #0EA5E9)" : "rgba(255,255,255,0.06)",
              }}
            >
              {sending ? "처리 중..." : "친구추가 하기"}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
