import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Cpu, Loader2 } from "lucide-react";
import BootSequence from "./BootSequence";
import MusicPlayer from "./MusicPlayer";
import Guestbook from "./Guestbook";
import Timeline from "./Timeline";
import VisitorCount from "./VisitorCount";
import { SITE_CONFIG } from "../config/site";

const serverIcons: Record<string, React.ReactNode> = {
  game: <Gamepad2 className="w-5 h-5" />,
  simulator: <Cpu className="w-5 h-5" />,
};

// iOS card style
const glassCard = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(60px) saturate(180%)",
  WebkitBackdropFilter: "blur(60px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "20px",
  boxShadow: "0 2px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
} as const;

// iOS section card (grouped items, like Settings)
const sectionCard = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(60px) saturate(180%)",
  WebkitBackdropFilter: "blur(60px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "16px",
  overflow: "hidden" as const,
} as const;

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleBootComplete = useCallback(() => {
    setBooting(false);
    setTimeout(() => setReady(true), 50);
  }, []);

  const handleCardTap = (server: (typeof SITE_CONFIG.servers)[0]) => {
    if (server.disabled || loadingId) return;
    setLoadingId(server.id);
    setTimeout(() => {
      window.open(server.url, "_blank");
      setLoadingId(null);
    }, 800);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* ─── Background: heavily blurred wallpaper ─── */}
      <div className="fixed inset-0 z-0">
        <img
          src="/assets/bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "brightness(0.5) saturate(1.2) blur(20px)",
            transform: "scale(1.1)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Dark overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>

      {/* ─── Scrollable Content ─── */}
      {ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full h-full overflow-y-auto flex justify-center"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="w-full max-w-[480px] px-5 pt-12 pb-28 md:pt-16">

            {/* ═══════ Profile Card ═══════ */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="p-6 mb-5"
              style={glassCard}
            >
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div
                  className="w-[68px] h-[68px] rounded-[18px] flex items-center justify-center mb-3"
                  style={{
                    background: "linear-gradient(135deg, #30D158 0%, #0EA5E9 100%)",
                    boxShadow: "0 6px 20px rgba(48,209,88,0.3)",
                  }}
                >
                  <span className="text-[26px] font-bold text-white">L</span>
                </div>

                <h1 className="text-[20px] font-bold tracking-[0.5px] text-white mb-0.5">
                  LEESIHU<span className="text-white/30">.ONLINE</span>
                </h1>
                <p className="text-[13px] text-white/40 mb-3">
                  Game Creator
                </p>

                <VisitorCount />
              </div>
            </motion.div>

            {/* ═══════ Play Section ═══════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-5"
            >
              <p className="text-[13px] font-medium text-white/40 uppercase tracking-wider mb-2 px-2">
                플레이
              </p>
              <div style={sectionCard}>
                {SITE_CONFIG.servers.map((server, index) => {
                  const isLoading = loadingId === server.id;
                  const isLast = index === SITE_CONFIG.servers.length - 1;
                  return (
                    <button
                      key={server.id}
                      onClick={() => handleCardTap(server)}
                      disabled={server.disabled || isLoading}
                      className="w-full text-left cursor-pointer active:bg-white/8 transition-colors duration-100"
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
                          style={{
                            background: server.gradient,
                            boxShadow: `0 3px 10px ${server.id === "game" ? "rgba(48,209,88,0.3)" : "rgba(14,165,233,0.3)"}`,
                          }}
                        >
                          <div className="text-white">{serverIcons[server.id]}</div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-white">{server.name}</h3>
                            <div className="flex items-center gap-1">
                              <div className="w-[5px] h-[5px] rounded-full bg-[#30D158]" />
                              <span className="text-[10px] text-[#30D158] font-medium">ONLINE</span>
                            </div>
                          </div>
                          <p className="text-[12px] text-white/35 truncate">{server.description}</p>
                        </div>

                        {/* Arrow or loader */}
                        <div className="flex-shrink-0">
                          {isLoading ? (
                            <Loader2 className="w-[18px] h-[18px] text-white/30 animate-spin" />
                          ) : (
                            <ChevronRight className="w-[18px] h-[18px] text-white/20" />
                          )}
                        </div>
                      </div>

                      {/* Loading bar */}
                      {isLoading && (
                        <div className="px-4 pb-3">
                          <div className="h-[2px] rounded-full overflow-hidden bg-white/5">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.7, ease: "easeInOut" }}
                              className="h-full rounded-full"
                              style={{ background: server.gradient }}
                            />
                          </div>
                        </div>
                      )}

                      {/* iOS divider between items */}
                      {!isLast && (
                        <div className="ml-[68px] mr-4">
                          <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* ═══════ Timeline Section ═══════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5 }}
              className="mb-5"
            >
              <p className="text-[13px] font-medium text-white/40 uppercase tracking-wider mb-2 px-2">
                타임라인
              </p>
              <div className="p-4" style={sectionCard}>
                <Timeline />
              </div>
            </motion.div>

            {/* ═══════ Guestbook Section ═══════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5 }}
              className="mb-5"
            >
              <p className="text-[13px] font-medium text-white/40 uppercase tracking-wider mb-2 px-2">
                방명록
              </p>
              <div className="p-4" style={sectionCard}>
                <Guestbook />
              </div>
            </motion.div>

            {/* ═══════ Footer ═══════ */}
            <div className="text-center pt-4 pb-8">
              <p className="text-[11px] text-white/15">
                leesihu.online — 이시후월드
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Music player */}
      {ready && <MusicPlayer />}

      {/* Boot sequence */}
      {booting && <BootSequence onComplete={handleBootComplete} />}
    </div>
  );
}
