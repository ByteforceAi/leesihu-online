import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, Home, Clock, MessageSquare, Music, Play, Pause, ExternalLink } from "lucide-react";
import BootSequence from "./BootSequence";
import Guestbook from "./Guestbook";
import Timeline from "./Timeline";
import VisitorCount from "./VisitorCount";
import { SITE_CONFIG } from "../config/site";

type Tab = "home" | "timeline" | "guestbook";

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Music state (inline in tab bar)
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black apple-border rounded-none md:rounded-[12px]">
      {/* Audio element */}
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
          {/* ══════ CONTENT AREA ══════ */}
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <AnimatePresence mode="wait">

              {/* ───────── HOME TAB ───────── */}
              {activeTab === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Hero Banner */}
                  <div className="relative w-full aspect-[16/9] max-h-[400px] overflow-hidden">
                    <img
                      src="/assets/bg.png"
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: "brightness(0.7) saturate(1.2)" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 75%, #000 100%)",
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 max-w-[600px] mx-auto">
                      <div className="flex items-end gap-4">
                        <div
                          className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #30D158 0%, #0EA5E9 100%)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                          }}
                        >
                          <span className="text-[24px] font-bold text-white">L</span>
                        </div>
                        <div className="flex-1 min-w-0 pb-0.5">
                          <h1 className="text-[24px] font-bold text-white leading-tight">
                            LEESIHU<span className="text-white/30">.ONLINE</span>
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

                    {/* Section: 플레이 */}
                    <h2 className="text-[22px] font-bold text-white mb-3">플레이</h2>
                    <div
                      className="rounded-2xl overflow-hidden mb-8"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      {SITE_CONFIG.servers.map((server, index) => {
                        const isLoading = loadingId === server.id;
                        const isLast = index === SITE_CONFIG.servers.length - 1;
                        return (
                          <div key={server.id}>
                            <button
                              onClick={() => handleCardTap(server)}
                              disabled={server.disabled || isLoading}
                              className="w-full text-left cursor-pointer active:bg-white/5 transition-colors duration-100"
                            >
                              <div className="flex items-center gap-3.5 px-4 py-3.5">
                                {/* No icon — clean text only */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-[16px] font-semibold text-white">{server.name}</h3>
                                    <div className="flex items-center gap-1">
                                      <div className="w-[5px] h-[5px] rounded-full bg-[#30D158]" />
                                      <span className="text-[10px] text-[#30D158] font-medium">ONLINE</span>
                                    </div>
                                  </div>
                                  <p className="text-[13px] text-white/40">{server.description}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  {isLoading ? (
                                    <Loader2 className="w-[18px] h-[18px] text-white/30 animate-spin" />
                                  ) : (
                                    <ChevronRight className="w-[18px] h-[18px] text-white/20" />
                                  )}
                                </div>
                              </div>
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
                            </button>
                            {!isLast && (
                              <div className="ml-4 mr-4">
                                <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Section: 시후의 유튜브 */}
                    <h2 className="text-[22px] font-bold text-white mb-3">시후의 유튜브</h2>
                    <div
                      className="rounded-2xl overflow-hidden mb-8"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      {SITE_CONFIG.youtube.map((yt, index) => {
                        const isLast = index === SITE_CONFIG.youtube.length - 1;
                        return (
                          <div key={index}>
                            <a
                              href={yt.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3.5 px-4 py-3.5 active:bg-white/5 transition-colors duration-100"
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <Play className="w-3.5 h-3.5 text-red-400 ml-0.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-medium text-white truncate">{yt.title}</h3>
                              </div>
                              <ExternalLink className="w-4 h-4 text-white/20 flex-shrink-0" />
                            </a>
                            {!isLast && (
                              <div className="ml-[52px] mr-4">
                                <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Section: 더 보기 */}
                    <h2 className="text-[22px] font-bold text-white mb-3">더 보기</h2>
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <button
                        onClick={() => setActiveTab("timeline")}
                        className="w-full text-left cursor-pointer active:bg-white/5 transition-colors duration-100"
                      >
                        <div className="flex items-center gap-3.5 px-4 py-3.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[15px] font-medium text-white">타임라인</h3>
                            <p className="text-[12px] text-white/35">나의 성장 기록</p>
                          </div>
                          <ChevronRight className="w-[18px] h-[18px] text-white/20" />
                        </div>
                      </button>
                      <div className="ml-[52px] mr-4">
                        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                      </div>
                      <button
                        onClick={() => setActiveTab("guestbook")}
                        className="w-full text-left cursor-pointer active:bg-white/5 transition-colors duration-100"
                      >
                        <div className="flex items-center gap-3.5 px-4 py-3.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[15px] font-medium text-white">방명록</h3>
                            <p className="text-[12px] text-white/35">메시지를 남겨보세요</p>
                          </div>
                          <ChevronRight className="w-[18px] h-[18px] text-white/20" />
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───────── TIMELINE TAB ───────── */}
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
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>홈</span>
                  </button>
                  <h1 className="text-[34px] font-bold text-white mb-6">타임라인</h1>
                  <Timeline />
                </motion.div>
              )}

              {/* ───────── GUESTBOOK TAB ───────── */}
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
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>홈</span>
                  </button>
                  <h1 className="text-[34px] font-bold text-white mb-6">방명록</h1>
                  <Guestbook />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ══════ iOS TAB BAR ══════ */}
          <div
            className="flex-shrink-0 w-full"
            style={{
              background: "rgba(20,20,20,0.85)",
              backdropFilter: "blur(30px) saturate(180%)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="max-w-[600px] mx-auto flex items-center h-[50px]">
              {/* Left tabs */}
              <div className="flex-1 flex items-center justify-around">
                {([
                  { id: "home" as Tab, icon: Home, label: "홈" },
                  { id: "timeline" as Tab, icon: Clock, label: "타임라인" },
                  { id: "guestbook" as Tab, icon: MessageSquare, label: "방명록" },
                ] as const).map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex flex-col items-center gap-0.5 cursor-pointer px-4 py-1"
                    >
                      <tab.icon
                        className="w-[22px] h-[22px]"
                        style={{ color: isActive ? "#0A84FF" : "rgba(255,255,255,0.35)" }}
                      />
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: isActive ? "#0A84FF" : "rgba(255,255,255,0.35)" }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Music button */}
              {SITE_CONFIG.music.enabled && (
                <button
                  onClick={toggleMusic}
                  className="flex flex-col items-center gap-0.5 cursor-pointer px-4 py-1 mr-2"
                >
                  {isPlaying ? (
                    <Pause className="w-[22px] h-[22px] text-[#30D158]" />
                  ) : (
                    <Music className="w-[22px] h-[22px]" style={{ color: "rgba(255,255,255,0.35)" }} />
                  )}
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: isPlaying ? "#30D158" : "rgba(255,255,255,0.35)" }}
                  >
                    {isPlaying ? "재생 중" : "음악"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Boot sequence */}
      {booting && <BootSequence onComplete={handleBootComplete} />}
    </div>
  );
}
