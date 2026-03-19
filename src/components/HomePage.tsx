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

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

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
      {/* ─── Background ─── */}
      <div className="fixed inset-0 z-0">
        {/* Minecraft background image — visible! */}
        <img
          src="/assets/bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "brightness(0.35) saturate(1.4)",
            transform: "scale(1.02)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Gradient vignette — cinematic */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.5) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.6) 100%)
            `,
          }}
        />
        {/* Soft blur overlay for content readability */}
        <div
          className="absolute inset-0"
          style={{ backdropFilter: "blur(2px)" }}
        />
      </div>

      {/* ─── Scrollable Content ─── */}
      {ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full h-full overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="w-full max-w-[560px] mx-auto px-6 pt-14 pb-28 md:pt-20">

            {/* ─── Profile Header ─── */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-center mb-8"
            >
              {/* Avatar */}
              <div className="relative w-[72px] h-[72px] mx-auto mb-4">
                <div
                  className="w-full h-full rounded-[20px] flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #30D158 0%, #0EA5E9 100%)",
                    boxShadow: "0 8px 24px rgba(48,209,88,0.25), 0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  <span className="text-[28px] font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                    L
                  </span>
                </div>
              </div>

              <h1 className="text-[22px] font-bold tracking-[0.5px] mb-0.5 text-white">
                LEESIHU<span className="text-white/30">.ONLINE</span>
              </h1>
              <p className="text-[13px] text-white/35 tracking-wide mb-4">
                Game Creator & Music Producer
              </p>

              {/* Visitor count pill */}
              <VisitorCount />
            </motion.div>

            {/* ─── Play Section ─── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <h2 className="text-[15px] font-semibold text-white/90">플레이</h2>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              <div className="space-y-2.5">
                {SITE_CONFIG.servers.map((server, index) => {
                  const isLoading = loadingId === server.id;
                  return (
                    <motion.button
                      key={server.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.08, ...spring }}
                      onClick={() => handleCardTap(server)}
                      disabled={server.disabled || isLoading}
                      className="group w-full rounded-2xl text-left cursor-pointer
                        active:scale-[0.97] transition-transform duration-150"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(40px) saturate(160%)",
                        WebkitBackdropFilter: "blur(40px) saturate(160%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 1px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
                      }}
                    >
                      <div className="flex items-center gap-3.5 p-3.5">
                        {/* Icon */}
                        <div
                          className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0"
                          style={{
                            background: server.gradient,
                            boxShadow: `0 4px 12px ${server.id === "game" ? "rgba(48,209,88,0.25)" : "rgba(14,165,233,0.25)"}`,
                          }}
                        >
                          <div className="text-white">{serverIcons[server.id]}</div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-[15px] font-semibold text-white tracking-[0.3px]">
                              {server.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <div className="w-[5px] h-[5px] rounded-full bg-[#30D158]" />
                              <span className="text-[10px] text-[#30D158]/70 font-medium">ONLINE</span>
                            </div>
                          </div>
                          <p className="text-[12px] text-white/35 truncate">{server.description}</p>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 pr-1">
                          {isLoading ? (
                            <Loader2 className="w-[18px] h-[18px] text-white/25 animate-spin" />
                          ) : (
                            <ChevronRight className="w-[18px] h-[18px] text-white/15 group-hover:text-white/35 transition-colors" />
                          )}
                        </div>
                      </div>

                      {/* Loading progress */}
                      {isLoading && (
                        <div className="px-3.5 pb-3">
                          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
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
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ─── Timeline ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <h2 className="text-[15px] font-semibold text-white/90">타임라인</h2>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
              <Timeline />
            </motion.div>

            {/* ─── Guestbook ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <h2 className="text-[15px] font-semibold text-white/90">방명록</h2>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
              <Guestbook />
            </motion.div>

            {/* ─── Footer ─── */}
            <div className="text-center pt-4 pb-8">
              <p className="text-[10px] text-white/12 tracking-wider">
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
