import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playFriendAdd, playButtonClick } from "../lib/sounds";

interface Props {
  onClose: () => void;
}

type NpcEmotion = "default" | "happy" | "heart";

const KAOMOJI: Record<NpcEmotion, string> = {
  default: "(◕‿◕)",
  happy: "(≧◡≦)",
  heart: "(♡ᴗ♡)",
};

const ACCENT: Record<NpcEmotion, string> = {
  default: "#30D158",
  happy: "#FFD60A",
  heart: "#FF375F",
};

const GLOW: Record<NpcEmotion, string> = {
  default: "rgba(48,209,88,0.4)",
  happy: "rgba(255,214,10,0.4)",
  heart: "rgba(255,55,95,0.4)",
};

/* ── Card transition variants ──────────────────── */
const cardVariants = {
  enter: { opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" },
  center: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -30, scale: 1.02, filter: "blur(4px)" },
};

/* ── NPC Face ──────────────────────────────────── */
function NpcFace({ emotion, size = 80 }: { emotion: NpcEmotion; size?: number }) {
  const color = ACCENT[emotion];
  return (
    <motion.div
      key={emotion}
      initial={{ scale: 0.8, rotate: -5 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center relative"
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 ${size * 0.3}px ${size * 0.08}px ${GLOW[emotion]}, 0 0 ${size * 0.7}px ${size * 0.15}px ${GLOW[emotion]}40`,
      }}
    >
      {/* Neon breathing ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: -3,
          border: `2px solid ${color}50`,
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className="leading-none select-none"
        style={{ fontSize: size * 0.28 }}
      >
        {KAOMOJI[emotion]}
      </span>
    </motion.div>
  );
}

/* ── Neon Pulse Dots (decorative) ──────────────── */
function NeonDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-[5px] justify-center mt-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-[5px] h-[5px] rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}60`,
          }}
          animate={{
            scale: [0.8, 1.3, 0.8],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function FriendChatFlow({ onClose }: Props) {
  const [step, setStep] = useState(0);
  // 0 = intro ("친구할래?")
  // 1 = name input
  // 2 = phone input
  // 3 = complete
  const [name, setName] = useState("");
  const [input, setInput] = useState("");
  const [emotion, setEmotion] = useState<NpcEmotion>("default");
  const [showHearts, setShowHearts] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const goNext = useCallback((nextStep: number) => {
    playButtonClick();
    setStep(nextStep);
    if (nextStep === 1 || nextStep === 2) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, []);

  const handleNameSubmit = () => {
    if (!input.trim()) return;
    setName(input.trim());
    setInput("");
    setEmotion("happy");
    goNext(2);
  };

  const handlePhoneSubmit = async () => {
    if (!input.trim()) return;
    const phoneVal = input.trim();
    setInput("");
    setEmotion("heart");
    playFriendAdd();
    setConfetti(true);
    setShowHearts(true);
    setStep(3);

    // Save to Supabase
    try {
      const { supabase: sb } = await import("../lib/supabase");
      await sb.from("guestbook").insert({
        name: `🤝 ${name}`,
        message: `친구추가 — ${phoneVal}`,
        emoji: "🤝",
      });
    } catch {
      /* silent */
    }

    setTimeout(onClose, 3500);
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    setInput(formatted);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black"
    >
      {/* ── Ambient BG gradient ───────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(ellipse at 50% 40%, ${GLOW[emotion]} 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 0.8 }}
        style={{ opacity: 0.3 }}
      />

      {/* ── Top bar ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 relative z-10 flex-shrink-0">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-[3px] rounded-full transition-all duration-500"
              style={{
                width: s <= step ? 20 : 10,
                background: s <= step ? ACCENT[emotion] : "rgba(255,255,255,0.1)",
                boxShadow: s === step ? `0 0 8px ${ACCENT[emotion]}80` : "none",
              }}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-xl active:bg-white/10 cursor-pointer"
        >
          <X className="w-5 h-5 text-white/40" />
        </button>
      </div>

      {/* ── Card Content ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* ── STEP 0: Intro ─────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="intro"
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full max-w-[340px] flex flex-col items-center text-center"
            >
              <NpcFace emotion="default" size={88} />
              <NeonDots color={ACCENT.default} />

              <h2 className="text-[22px] font-bold text-white mt-6 leading-tight">
                시후와 친구가 될래?
              </h2>
              <p className="text-[14px] text-white/40 mt-2 leading-relaxed">
                친구를 추가하면 시후가 직접 연락할 거야!
              </p>

              <div className="w-full mt-8 space-y-3">
                {/* Primary CTA */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => goNext(1)}
                  className="w-full py-4 rounded-2xl text-[17px] font-bold cursor-pointer relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #30D158, #20c997)",
                    color: "#fff",
                    boxShadow: "0 4px 24px rgba(48,209,88,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10">네! 좋아 😄</span>
                </motion.button>

                {/* Secondary */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playButtonClick();
                    setTimeout(onClose, 300);
                  }}
                  className="w-full py-3.5 rounded-2xl text-[15px] font-medium cursor-pointer"
                  style={{
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  다음에 할게요
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Name ──────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="name"
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full max-w-[340px] flex flex-col items-center text-center"
            >
              <NpcFace emotion="default" size={72} />

              <h2 className="text-[22px] font-bold text-white mt-5">
                이름이 뭐야? 🎮
              </h2>
              <p className="text-[14px] text-white/35 mt-1.5">
                닉네임이나 실명 아무거나 좋아!
              </p>

              <div className="w-full mt-8">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  placeholder="이름 입력"
                  maxLength={20}
                  autoFocus
                  className="w-full px-5 py-4 rounded-2xl text-[18px] text-white text-center font-medium placeholder-white/20 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1.5px solid ${input.trim() ? "#30D158" + "60" : "rgba(255,255,255,0.08)"}`,
                    transition: "border-color 0.3s, box-shadow 0.3s",
                    boxShadow: input.trim() ? "0 0 20px rgba(48,209,88,0.1)" : "none",
                  }}
                />

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleNameSubmit}
                  disabled={!input.trim()}
                  className="w-full py-4 rounded-2xl text-[16px] font-bold mt-4 cursor-pointer disabled:opacity-20"
                  style={{
                    background: input.trim() ? "linear-gradient(135deg, #0A84FF, #0070E0)" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                    boxShadow: input.trim() ? "0 4px 20px rgba(10,132,255,0.3)" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  다음 →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Phone ─────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="phone"
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full max-w-[340px] flex flex-col items-center text-center"
            >
              <NpcFace emotion="happy" size={72} />

              <h2 className="text-[22px] font-bold text-white mt-5">
                <span style={{ color: "#FFD60A" }}>{name}</span>
                <span className="text-white/60">,</span> 멋진 이름! 💙
              </h2>
              <p className="text-[14px] text-white/35 mt-1.5">
                연락처를 남기면 시후가 연락할게
              </p>

              <div className="w-full mt-8">
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  value={input}
                  onChange={handlePhoneInput}
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  autoFocus
                  className="w-full px-5 py-4 rounded-2xl text-[20px] text-white text-center font-mono tracking-wider placeholder-white/20 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1.5px solid ${input.length >= 12 ? "#FFD60A60" : "rgba(255,255,255,0.08)"}`,
                    transition: "border-color 0.3s, box-shadow 0.3s",
                    boxShadow: input.length >= 12 ? "0 0 20px rgba(255,214,10,0.1)" : "none",
                  }}
                />

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePhoneSubmit}
                  disabled={input.replace(/\D/g, "").length < 10}
                  className="w-full py-4 rounded-2xl text-[16px] font-bold mt-4 cursor-pointer disabled:opacity-20"
                  style={{
                    background: input.replace(/\D/g, "").length >= 10
                      ? "linear-gradient(135deg, #FFD60A, #FF9F0A)"
                      : "rgba(255,255,255,0.06)",
                    color: input.replace(/\D/g, "").length >= 10 ? "#000" : "#fff",
                    boxShadow: input.replace(/\D/g, "").length >= 10 ? "0 4px 20px rgba(255,214,10,0.25)" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  친구추가 완료! 🎉
                </motion.button>

                {/* Skip option */}
                <button
                  onClick={() => {
                    setInput("비공개");
                    setTimeout(handlePhoneSubmit, 100);
                  }}
                  className="mt-3 text-[13px] text-white/25 cursor-pointer"
                >
                  연락처 없이 추가하기
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Complete ──────────────────────── */}
          {step === 3 && (
            <motion.div
              key="done"
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full max-w-[340px] flex flex-col items-center text-center"
            >
              <NpcFace emotion="heart" size={96} />
              <NeonDots color={ACCENT.heart} />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-[24px] font-bold text-white mt-5">
                  친구추가 완료! 🎉
                </h2>
                <p className="text-[15px] text-white/50 mt-2 leading-relaxed">
                  <span style={{ color: "#FF375F" }}>{name}</span>님을 환영해!
                  <br />
                  시후가 곧 연락할 거야 ✨
                </p>
              </motion.div>

              {/* Success checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, times: [0, 0.6, 1], delay: 0.5 }}
                className="mt-6 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(48,209,88,0.12)",
                  boxShadow: "0 0 40px rgba(48,209,88,0.2)",
                }}
              >
                <span className="text-3xl text-[#30D158]">✓</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Confetti ──────────────────────────────────── */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${3 + Math.random() * 94}%`,
                top: -14,
                width: 7 + Math.random() * 7,
                height: 7 + Math.random() * 7,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                background: [
                  "#ff6b6b", "#ffd43b", "#51cf66", "#339af0",
                  "#845ef7", "#f06595", "#30D158", "#0EA5E9",
                ][i % 8],
                animation: "confetti-fall 2s ease-in forwards",
                animationDelay: `${Math.random() * 0.7}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Floating hearts ──────────────────────────── */}
      {showHearts && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-lg"
              style={{
                left: `${8 + i * 11}%`,
                bottom: "20%",
                animation: "float-heart 2.4s ease-out forwards",
                animationDelay: `${i * 0.18}s`,
                opacity: 0,
              }}
            >
              {["❤️", "💚", "💙", "💛"][i % 4]}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
