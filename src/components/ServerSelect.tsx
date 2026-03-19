import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "../config/site";

interface ServerSelectProps {
  open: boolean;
  onClose: () => void;
}

const statusConfig = {
  smooth: { color: "#34d399", glow: "rgba(52,211,153,0.4)", label: "ONLINE", pulse: true },
  crowded: { color: "#fbbf24", glow: "rgba(251,191,36,0.4)", label: "BUSY", pulse: true },
  offline: { color: "#ef4444", glow: "rgba(239,68,68,0.4)", label: "OFFLINE", pulse: false },
};

// Custom SVG icons for premium feel
function GameIcon({ active }: { active: boolean }) {
  const color = active ? "#34d399" : "rgba(255,255,255,0.35)";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="transition-all duration-500">
      {/* Sword */}
      <path d="M14 34L24 24L34 14" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={active ? 1 : 0.6} />
      <path d="M30 14H34V18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : 0.6} />
      {/* Shield shape */}
      <path d="M24 8L36 14V26C36 32 30 38 24 40C18 38 12 32 12 26V14L24 8Z" stroke={color} strokeWidth="1.5" fill={active ? "rgba(52,211,153,0.06)" : "none"} opacity={active ? 0.9 : 0.4} />
      {/* Inner diamond */}
      <path d="M24 16L30 22L24 28L18 22Z" stroke={color} strokeWidth="1" fill={active ? "rgba(52,211,153,0.1)" : "none"} opacity={active ? 0.7 : 0.3} />
      {/* Glow center */}
      {active && <circle cx="24" cy="22" r="2" fill={color} opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </circle>}
    </svg>
  );
}

function SimulatorIcon({ active }: { active: boolean }) {
  const color = active ? "#34d399" : "rgba(255,255,255,0.35)";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="transition-all duration-500">
      {/* Circuit board pattern */}
      <rect x="12" y="12" width="24" height="24" rx="4" stroke={color} strokeWidth="1.5" fill={active ? "rgba(52,211,153,0.04)" : "none"} opacity={active ? 0.9 : 0.4} />
      {/* Inner grid */}
      <rect x="18" y="18" width="12" height="12" rx="2" stroke={color} strokeWidth="1" opacity={active ? 0.6 : 0.25} />
      {/* Connection lines */}
      <line x1="24" y1="8" x2="24" y2="12" stroke={color} strokeWidth="1.5" opacity={active ? 0.7 : 0.3} />
      <line x1="24" y1="36" x2="24" y2="40" stroke={color} strokeWidth="1.5" opacity={active ? 0.7 : 0.3} />
      <line x1="8" y1="24" x2="12" y2="24" stroke={color} strokeWidth="1.5" opacity={active ? 0.7 : 0.3} />
      <line x1="36" y1="24" x2="40" y2="24" stroke={color} strokeWidth="1.5" opacity={active ? 0.7 : 0.3} />
      {/* Corner nodes */}
      <circle cx="12" cy="12" r="1.5" fill={color} opacity={active ? 0.5 : 0.2} />
      <circle cx="36" cy="12" r="1.5" fill={color} opacity={active ? 0.5 : 0.2} />
      <circle cx="12" cy="36" r="1.5" fill={color} opacity={active ? 0.5 : 0.2} />
      <circle cx="36" cy="36" r="1.5" fill={color} opacity={active ? 0.5 : 0.2} />
      {/* Center pulse */}
      <circle cx="24" cy="24" r="3" fill={active ? color : "none"} stroke={color} strokeWidth="1" opacity={active ? 0.5 : 0.2} />
      {active && <circle cx="24" cy="24" r="3" fill={color} opacity="0.4">
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>}
      {/* Data flow dots */}
      {active && <>
        <circle cx="24" cy="10" r="1" fill={color} opacity="0.8">
          <animate attributeName="cy" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="38" cy="24" r="1" fill={color} opacity="0.8">
          <animate attributeName="cx" values="40;36;40" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </>}
    </svg>
  );
}

const iconComponents: Record<string, (props: { active: boolean }) => React.ReactNode> = {
  game: GameIcon,
  simulator: SimulatorIcon,
};

export default function ServerSelect({ open, onClose }: ServerSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setLoading(false);
      setHovered(null);
    }
  }, [open]);

  const handleEnter = () => {
    const server = SITE_CONFIG.servers.find((s) => s.id === selected);
    if (!server || server.disabled) return;

    setLoading(true);
    setTimeout(() => {
      window.open(server.url, "_blank");
      setLoading(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={onClose}
        >
          {/* Backdrop with deep blur */}
          <motion.div
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(20px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/70"
          />

          {/* Ambient light effects behind modal */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(52,211,153,0.08) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Modal container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[680px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glass panel */}
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(16,32,24,0.85) 0%, rgba(10,20,16,0.92) 100%)",
                border: "1px solid rgba(52,211,153,0.12)",
                boxShadow: `
                  0 0 0 1px rgba(52,211,153,0.05),
                  0 25px 80px rgba(0,0,0,0.6),
                  0 0 60px rgba(52,211,153,0.05),
                  inset 0 1px 0 rgba(255,255,255,0.03)
                `,
                backdropFilter: "blur(40px) saturate(150%)",
              }}
            >
              {/* Top shine line */}
              <div
                className="absolute top-0 left-[10%] right-[10%] h-px"
                style={{
                  background: "linear-gradient(to right, transparent, rgba(52,211,153,0.25), rgba(251,191,36,0.15), transparent)",
                }}
              />

              {/* Content */}
              <div className="p-8 md:p-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-[10px] tracking-[5px] mb-2 uppercase"
                      style={{ color: "rgba(52,211,153,0.5)" }}
                    >
                      Choose your path
                    </motion.p>
                    <motion.h2
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-display text-xl md:text-2xl tracking-[8px]"
                      style={{
                        background: "linear-gradient(135deg, rgba(200,230,210,0.95) 0%, rgba(52,211,153,0.7) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      SELECT DESTINATION
                    </motion.h2>
                  </div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer
                      hover:bg-white/5 group"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <X className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </motion.button>
                </div>

                {/* Server cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                  {SITE_CONFIG.servers.map((server, index) => {
                    const status = statusConfig[server.status];
                    const isSelected = selected === server.id;
                    const isHovered = hovered === server.id;
                    const IconComponent = iconComponents[server.id];

                    return (
                      <motion.button
                        key={server.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => !server.disabled && setSelected(server.id)}
                        onMouseEnter={() => setHovered(server.id)}
                        onMouseLeave={() => setHovered(null)}
                        disabled={server.disabled}
                        className={`
                          group relative rounded-2xl overflow-hidden text-left cursor-pointer
                          transition-all duration-500 ease-out
                          ${server.disabled ? "opacity-30 cursor-not-allowed" : ""}
                        `}
                        style={{
                          transform: isSelected ? "scale(1.02)" : isHovered ? "scale(1.01)" : "scale(1)",
                        }}
                      >
                        {/* Card background with glass layers */}
                        <div
                          className="absolute inset-0 rounded-2xl transition-all duration-500"
                          style={{
                            background: isSelected
                              ? "linear-gradient(145deg, rgba(52,211,153,0.08) 0%, rgba(16,32,24,0.9) 50%, rgba(52,211,153,0.04) 100%)"
                              : "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(16,32,24,0.6) 100%)",
                            border: `1px solid ${isSelected ? "rgba(52,211,153,0.3)" : isHovered ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)"}`,
                            boxShadow: isSelected
                              ? "0 0 40px rgba(52,211,153,0.1), inset 0 1px 0 rgba(52,211,153,0.1)"
                              : isHovered
                                ? "0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
                                : "0 4px 20px rgba(0,0,0,0.2)",
                          }}
                        />

                        {/* Hover light sweep effect */}
                        <div
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(52,211,153,0.04) 50%, transparent 60%)",
                          }}
                        />

                        {/* Selected corner glow */}
                        {isSelected && (
                          <div
                            className="absolute -top-20 -right-20 w-40 h-40 rounded-full"
                            style={{
                              background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)",
                            }}
                          />
                        )}

                        {/* Card content */}
                        <div className="relative z-10 p-6 md:p-7">
                          {/* Icon area with glow ring */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="relative">
                              {/* Glow ring behind icon */}
                              <div
                                className="absolute inset-0 -m-3 rounded-full transition-all duration-500"
                                style={{
                                  background: isSelected
                                    ? "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)"
                                    : "transparent",
                                }}
                              />
                              {IconComponent && <IconComponent active={isSelected || isHovered} />}
                            </div>

                            {/* Status indicator */}
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: status.color }}
                                />
                                {status.pulse && (
                                  <div
                                    className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                                    style={{ backgroundColor: status.color, opacity: 0.4 }}
                                  />
                                )}
                              </div>
                              <span
                                className="text-[10px] tracking-[3px] font-medium"
                                style={{ color: status.color }}
                              >
                                {status.label}
                              </span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3
                            className="font-display text-lg md:text-xl tracking-[6px] mb-2 transition-colors duration-300"
                            style={{
                              color: isSelected
                                ? "rgba(167,243,208,0.95)"
                                : "rgba(255,240,210,0.85)",
                            }}
                          >
                            {server.name}
                          </h3>

                          {/* Description */}
                          <p
                            className="text-xs tracking-wide transition-colors duration-300"
                            style={{
                              color: isSelected ? "rgba(200,230,210,0.5)" : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {server.description}
                          </p>

                          {/* Bottom decorative line */}
                          <div
                            className="mt-5 h-px transition-all duration-500"
                            style={{
                              background: isSelected
                                ? "linear-gradient(to right, rgba(52,211,153,0.3), transparent)"
                                : "linear-gradient(to right, rgba(255,255,255,0.05), transparent)",
                            }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Enter button area */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleEnter}
                    disabled={!selected || loading}
                    className="group relative cursor-pointer transition-all duration-500"
                    style={{ opacity: selected ? 1 : 0.3 }}
                  >
                    {/* Button glow background */}
                    {selected && !loading && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "radial-gradient(ellipse, rgba(52,211,153,0.15) 0%, transparent 70%)",
                          filter: "blur(10px)",
                          transform: "scale(1.5)",
                        }}
                      />
                    )}

                    <div
                      className={`
                        relative flex items-center gap-3 px-12 py-4 rounded-full font-display text-sm tracking-[5px]
                        transition-all duration-500
                        ${selected && !loading
                          ? "hover:shadow-[0_0_40px_rgba(52,211,153,0.15)]"
                          : "cursor-not-allowed"
                        }
                      `}
                      style={{
                        background: selected
                          ? "linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.06) 100%)"
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selected ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}`,
                        color: selected ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.2)",
                        textShadow: selected ? "0 0 15px rgba(52,211,153,0.3)" : "none",
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="animate-load-glow">{SITE_CONFIG.loadingText}</span>
                        </span>
                      ) : (
                        <>
                          접속하기
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-300 ${
                              selected ? "group-hover:translate-x-1" : ""
                            }`}
                          />
                        </>
                      )}
                    </div>
                  </button>
                </motion.div>
              </div>

              {/* Bottom shine line */}
              <div
                className="absolute bottom-0 left-[20%] right-[20%] h-px"
                style={{
                  background: "linear-gradient(to right, transparent, rgba(251,191,36,0.1), transparent)",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
