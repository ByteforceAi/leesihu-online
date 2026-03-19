import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visitorCount: number;
  isPlaying: boolean;
  songTitle?: string;
}

export default function DynamicIsland({ visitorCount, isPlaying, songTitle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const show = true;

  // Auto-collapse after 3s
  useEffect(() => {
    if (expanded) {
      const t = setTimeout(() => setExpanded(false), 3000);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  if (!show) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        initial={{ borderRadius: 20, width: 120, height: 32 }}
        animate={{
          borderRadius: expanded ? 24 : 20,
          width: expanded ? 260 : 140,
          height: expanded ? 64 : 32,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 h-full"
            >
              {isPlaying ? (
                <>
                  <div className="flex items-end gap-[2px] h-4">
                    {[0,1,2,3].map(i => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-[#30D158]"
                        animate={{ height: [4, 12 + Math.random()*4, 4] }}
                        transition={{ duration: 0.6 + i*0.1, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/50">재생 중</p>
                    <p className="text-[12px] text-white truncate">{songTitle || "음악"}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-[#30D158]" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#30D158] animate-ping opacity-40" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-white/50">실시간</p>
                    <p className="text-[13px] text-white font-medium">{visitorCount}명 접속 중</p>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 h-full px-3"
            >
              <div className="relative">
                <div className="w-[6px] h-[6px] rounded-full bg-[#30D158]" />
                <div className="absolute inset-0 w-[6px] h-[6px] rounded-full bg-[#30D158] animate-ping opacity-40" />
              </div>
              <span className="text-[11px] text-white/60 font-medium">
                {isPlaying ? "♫ 재생 중" : `${visitorCount}명 온라인`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
