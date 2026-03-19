import { useState, useRef, useEffect, useCallback } from "react";
import { Music, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_CONFIG } from "../config/site";

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const config = SITE_CONFIG.music;
  if (!config.enabled) return null;

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
    const update = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  return (
    <>
      <audio ref={audioRef} src={config.src} preload="metadata" loop />

      {/* iOS Now Playing mini bar */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <Music className="w-4 h-4 text-white/60" />
        {isPlaying && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#30D158] rounded-full" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed bottom-[76px] right-6 z-40 w-[280px] rounded-2xl p-4"
            style={{
              background: "rgba(30,30,30,0.9)",
              backdropFilter: "blur(40px) saturate(150%)",
              WebkitBackdropFilter: "blur(40px) saturate(150%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-white/90 truncate font-medium">{config.title}</p>
                <p className="text-[11px] text-white/35 truncate">{config.artist}</p>
              </div>
            </div>

            {/* Progress */}
            <div
              ref={progressRef}
              onClick={handleSeek}
              className="w-full h-[3px] bg-white/10 rounded-full mb-3 cursor-pointer"
            >
              <div
                className="h-full bg-white/50 rounded-full"
                style={{ width: `${progress}%`, transition: "width 0.2s" }}
              />
            </div>

            {/* Play button */}
            <div className="flex justify-center">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white/80" />
                ) : (
                  <Play className="w-4 h-4 text-white/80 ml-0.5" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
