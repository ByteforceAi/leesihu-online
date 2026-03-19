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
  game: <Gamepad2 className="w-6 h-6" />,
  simulator: <Cpu className="w-6 h-6" />,
};

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleBootComplete = useCallback(() => {
    setBooting(false);
    setTimeout(() => setReady(true), 100);
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
      {/* Background image */}
      <div className="fixed inset-0 z-0">
        <img
          src="/assets/bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.15) blur(8px) saturate(1.3) scale(1.05)", transform: "scale(1.05)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.8) 100%)",
          }}
        />
      </div>

      {/* Scrollable content */}
      {ready && (
        <div
          className="relative z-10 w-full h-full overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="w-full max-w-[520px] mx-auto px-6 pt-16 pb-24">
            {/* Header — profile area */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-center mb-3"
            >
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-[22px] mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #30D158 0%, #0EA5E9 100%)",
                  boxShadow: "0 8px 32px rgba(48,209,88,0.2)",
                }}
              >
                <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                  L
                </span>
              </div>

              <h1
                className="text-2xl font-bold tracking-[1px] mb-1"
                style={{ color: "#fff" }}
              >
                LEESIHU<span style={{ color: "rgba(255,255,255,0.35)" }}>.ONLINE</span>
              </h1>
              <p className="text-sm text-white/35 mb-3">
                Game Creator & Music Producer
              </p>

              {/* Visitor count */}
              <VisitorCount />
            </motion.div>

            {/* Divider */}
            <div className="h-px my-6" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Server cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-3 mb-8"
            >
              <h2 className="text-lg font-semibold text-white mb-3">플레이</h2>
              {SITE_CONFIG.servers.map((server, index) => {
                const isLoading = loadingId === server.id;
                return (
                  <motion.button
                    key={server.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                    onClick={() => handleCardTap(server)}
                    disabled={server.disabled || isLoading}
                    className="group w-full rounded-2xl text-left cursor-pointer transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      backdropFilter: "blur(40px) saturate(150%)",
                      WebkitBackdropFilter: "blur(40px) saturate(150%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 2px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: server.gradient }}
                      >
                        <div className="text-white">{serverIcons[server.id]}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-[15px] font-semibold text-white">{server.name}</h3>
                          <div className="relative">
                            <div className="w-[6px] h-[6px] rounded-full bg-[#30D158]" />
                            <div className="absolute inset-0 w-[6px] h-[6px] rounded-full bg-[#30D158] animate-ping opacity-40" />
                          </div>
                        </div>
                        <p className="text-xs text-white/40">{server.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-white/15 group-hover:text-white/40 transition-colors" />
                        )}
                      </div>
                    </div>
                    {isLoading && (
                      <div className="px-4 pb-3">
                        <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
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
            </motion.div>

            {/* Divider */}
            <div className="h-px my-6" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Timeline />
            </motion.div>

            {/* Divider */}
            <div className="h-px my-6" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Guestbook */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Guestbook />
            </motion.div>

            {/* Footer */}
            <div className="text-center py-8">
              <p className="text-[11px] text-white/15">
                leesihu.online
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Music player */}
      {ready && <MusicPlayer />}

      {/* Boot sequence */}
      {booting && <BootSequence onComplete={handleBootComplete} />}
    </div>
  );
}
