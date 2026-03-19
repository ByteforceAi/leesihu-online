import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Cpu, X, Loader2 } from "lucide-react";
import { SITE_CONFIG } from "../config/site";

interface ServerSelectProps {
  open: boolean;
  onClose: () => void;
}

const statusColors = {
  smooth: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "원활" },
  crowded: { bg: "bg-amber-500/20", text: "text-amber-400", label: "혼잡" },
  offline: { bg: "bg-red-500/20", text: "text-red-400", label: "점검중" },
};

const icons: Record<string, React.ReactNode> = {
  game: <Gamepad2 className="w-8 h-8" />,
  simulator: <Cpu className="w-8 h-8" />,
};

export default function ServerSelect({ open, onClose }: ServerSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEnter = () => {
    const server = SITE_CONFIG.servers.find((s) => s.id === selected);
    if (!server || server.disabled) return;

    setLoading(true);
    setTimeout(() => {
      window.open(server.url, "_blank");
      setLoading(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 w-[90vw] max-w-[600px] p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <h2
              className="text-center font-display text-lg md:text-xl tracking-[6px] mb-8"
              style={{ color: "rgba(200, 230, 210, 0.9)" }}
            >
              SELECT DESTINATION
            </h2>

            {/* Server grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {SITE_CONFIG.servers.map((server, index) => {
                const status = statusColors[server.status];
                const isSelected = selected === server.id;

                return (
                  <motion.button
                    key={server.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onClick={() => !server.disabled && setSelected(server.id)}
                    disabled={server.disabled}
                    className={`
                      relative rounded-2xl overflow-hidden text-left transition-all duration-300 cursor-pointer
                      ${server.disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02]"}
                      ${isSelected ? "ring-2 ring-emerald-glow/50 shadow-[0_0_30px_rgba(52,211,153,0.15)]" : ""}
                    `}
                    style={{
                      background: "rgba(16, 32, 24, 0.7)",
                      border: `1px solid ${isSelected ? "rgba(52, 211, 153, 0.3)" : "rgba(52, 211, 153, 0.1)"}`,
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Thumbnail area */}
                    <div className="h-28 md:h-32 bg-gradient-to-br from-emerald-900/30 to-forest-dark flex items-center justify-center">
                      <div
                        className={`
                          p-4 rounded-full transition-all duration-300
                          ${isSelected ? "text-emerald-glow bg-emerald-glow/10" : "text-white/50"}
                        `}
                      >
                        {icons[server.id] || <Gamepad2 className="w-8 h-8" />}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className="font-display text-base tracking-[4px]"
                          style={{ color: "rgba(255, 240, 210, 0.9)" }}
                        >
                          {server.name}
                        </h3>
                        <span
                          className={`flex items-center gap-1.5 text-xs ${status.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${status.bg} ${
                              server.status === "smooth" ? "bg-emerald-400" : ""
                            }`}
                          />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/40">{server.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Enter button */}
            <div className="flex justify-center">
              <button
                onClick={handleEnter}
                disabled={!selected || loading}
                className={`
                  px-10 py-3 rounded-full font-display text-sm tracking-[4px] transition-all duration-300 cursor-pointer
                  ${
                    selected && !loading
                      ? "bg-emerald-glow/15 text-emerald-glow border border-emerald-glow/30 hover:bg-emerald-glow/25 hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]"
                      : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                  }
                `}
              >
                {loading ? (
                  <span className="flex items-center gap-2 animate-load-glow">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {SITE_CONFIG.loadingText}
                  </span>
                ) : (
                  "접속하기"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
