import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Cpu, Loader2 } from "lucide-react";
import BootSequence from "./BootSequence";
import MusicPlayer from "./MusicPlayer";
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
      {/* Background image + overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "brightness(0.35) blur(2px) saturate(1.2)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Dark gradient overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      {/* Main content */}
      {ready && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-5">
          {/* Title area */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-center mb-10"
          >
            <h1
              className="text-3xl md:text-4xl font-bold tracking-[2px] mb-1"
              style={{ color: "#fff", fontFamily: "'Inter', sans-serif" }}
            >
              LEESIHU<span style={{ color: "rgba(255,255,255,0.4)" }}>.ONLINE</span>
            </h1>
            <p
              className="text-sm tracking-wide"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              이시후월드에 오신 것을 환영합니다
            </p>
          </motion.div>

          {/* Server cards — iOS glass style */}
          <div className="w-full max-w-[420px] space-y-3">
            {SITE_CONFIG.servers.map((server, index) => {
              const isLoading = loadingId === server.id;

              return (
                <motion.button
                  key={server.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + index * 0.12,
                    duration: 0.6,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  onClick={() => handleCardTap(server)}
                  disabled={server.disabled || isLoading}
                  className={`
                    group w-full rounded-2xl text-left cursor-pointer
                    transition-all duration-300 ease-out
                    active:scale-[0.97]
                    ${server.disabled ? "opacity-40 cursor-not-allowed" : ""}
                  `}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(40px) saturate(150%)",
                    WebkitBackdropFilter: "blur(40px) saturate(150%)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-4 p-4 md:p-5">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: server.id === "game"
                          ? "linear-gradient(135deg, #30D158, #34d399)"
                          : "linear-gradient(135deg, #0EA5E9, #6366F1)",
                      }}
                    >
                      <div className="text-white">
                        {serverIcons[server.id]}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3
                          className="text-base font-semibold"
                          style={{ color: "#fff" }}
                        >
                          {server.name}
                        </h3>
                        {/* Status dot */}
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <div
                              className="w-[6px] h-[6px] rounded-full bg-[#30D158]"
                            />
                            <div
                              className="absolute inset-0 w-[6px] h-[6px] rounded-full bg-[#30D158] animate-ping opacity-40"
                            />
                          </div>
                        </div>
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {server.description}
                      </p>
                    </div>

                    {/* Arrow / Loading */}
                    <div className="flex-shrink-0">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Loading bar */}
                  {isLoading && (
                    <div className="px-4 pb-3">
                      <div
                        className="h-[2px] rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.7, ease: "easeInOut" }}
                          className="h-full rounded-full"
                          style={{
                            background: server.id === "game"
                              ? "linear-gradient(90deg, #30D158, #34d399)"
                              : "linear-gradient(90deg, #0EA5E9, #6366F1)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 text-center"
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "1px",
            }}
          >
            leesihu.online
          </motion.p>
        </div>
      )}

      {/* Music player */}
      {ready && <MusicPlayer />}

      {/* Boot sequence */}
      {booting && <BootSequence onComplete={handleBootComplete} />}
    </div>
  );
}
