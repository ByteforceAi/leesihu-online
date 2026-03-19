import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playFriendAdd } from "../lib/sounds";

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
  typewriter?: boolean;
}

interface Props {
  onClose: () => void;
}

type NpcEmotion = "default" | "thinking" | "happy" | "heart";

const KAOMOJI: Record<NpcEmotion, string> = {
  default: "(◕‿◕)",
  thinking: "(◠_◠)",
  happy: "(≧◡≦)",
  heart: "(♡ᴗ♡)",
};

const GLOW_COLOR: Record<NpcEmotion, string> = {
  default: "rgba(48,209,88,0.5)",
  thinking: "rgba(10,132,255,0.5)",
  happy: "rgba(255,214,10,0.5)",
  heart: "rgba(255,55,95,0.5)",
};

const BG_GRADIENT: Record<NpcEmotion, string> = {
  default: "radial-gradient(ellipse at 50% 30%, rgba(48,209,88,0.05) 0%, #000 70%)",
  thinking: "radial-gradient(ellipse at 50% 30%, rgba(10,132,255,0.06) 0%, #000 70%)",
  happy: "radial-gradient(ellipse at 50% 30%, rgba(255,214,10,0.05) 0%, #000 70%)",
  heart: "radial-gradient(ellipse at 50% 30%, rgba(255,55,95,0.06) 0%, #000 70%)",
};

/* ── TypewriterText ─────────────────────────────────────── */
function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed("");

    const timer = setInterval(() => {
      idx.current++;
      if (idx.current >= text.length) {
        setDisplayed(text);
        clearInterval(timer);
        onDone?.();
      } else {
        setDisplayed(text.slice(0, idx.current));
      }
    }, 15);

    return () => clearInterval(timer);
  }, [text, onDone]);

  return <>{displayed}</>;
}

/* ── NPC Avatar (large, centered) ──────────────────────── */
function NpcAvatar({ emotion }: { emotion: NpcEmotion }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        key={emotion}
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 12 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center relative"
        style={{
          boxShadow: `0 0 24px 6px ${GLOW_COLOR[emotion]}, 0 0 60px 12px ${GLOW_COLOR[emotion]}`,
        }}
      >
        {/* Glowing ring */}
        <motion.div
          className="absolute inset-[-3px] rounded-full"
          style={{
            border: `2px solid ${GLOW_COLOR[emotion]}`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.04, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-[24px] leading-none select-none">{KAOMOJI[emotion]}</span>
      </motion.div>
      <span className="text-[16px] font-semibold text-white/80">시후봇</span>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function FriendChatFlow({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0); // 0=intro, 1=name, 2=phone, 3=done
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const [emotion, setEmotion] = useState<NpcEmotion>("default");
  const phone = useRef("");
  const [confetti, setConfetti] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgId = useRef(0);

  const scroll = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const addBot = useCallback(
    (text: string, delay = 500) => {
      setTyping(true);
      setEmotion("thinking");
      scroll();
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          msgId.current++;
          setMessages((prev) => [...prev, { id: msgId.current, role: "bot", text, typewriter: true }]);
          setTyping(false);
          scroll();
          resolve();
        }, delay);
      });
    },
    [scroll],
  );

  const addUser = useCallback(
    (text: string) => {
      msgId.current++;
      setMessages((prev) => [...prev, { id: msgId.current, role: "user", text }]);
      scroll();
    },
    [scroll],
  );

  // Step 0: Introduction
  useEffect(() => {
    const run = async () => {
      await addBot("안녕! 나는 시후봇이야 👋", 600);
      setEmotion("default");
      await addBot("시후와 친구가 되고 싶어?", 800);
      setEmotion("default");
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoice = async (choice: boolean) => {
    if (!choice) {
      addUser("아니요");
      await addBot("괜찮아! 다음에 또 와줘 😊", 600);
      setEmotion("default");
      setTimeout(onClose, 1500);
      return;
    }
    addUser("네! 😄");
    await addBot("좋아! 이름을 알려줘!", 700);
    setEmotion("default");
    setStep(1);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const value = input.trim();
    setInput("");

    if (step === 1) {
      // Name step
      setName(value);
      addUser(value);
      setEmotion("happy");
      await addBot(`${value}! 멋진 이름이다! 💙`, 600);
      setEmotion("default");
      await addBot("연락처를 남겨주면 시후가 연락할게! 📱", 800);
      setEmotion("default");
      setStep(2);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (step === 2) {
      // Phone step
      phone.current = value;
      addUser(value);
      await addBot("저장했어! 잠깐만...", 600);

      // Save to Supabase
      try {
        const { supabase: sb } = await import("../lib/supabase");
        await sb.from("guestbook").insert({
          name: `🤝 ${name}`,
          message: `친구추가 — ${value}`,
          emoji: "🤝",
        });
      } catch {
        /* silent */
      }

      setStep(3);
      setEmotion("heart");
      playFriendAdd();
      setConfetti(true);
      setShowHearts(true);
      await addBot(`친구추가 완료! 🎉\n${name}님을 환영해!`, 500);
      await addBot("시후가 곧 연락할 거야! 기다려줘 ✨", 800);
      setTimeout(onClose, 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: BG_GRADIENT[emotion],
        transition: "background 0.6s ease",
      }}
    >
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Small header avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] leading-none select-none">{KAOMOJI[emotion]}</span>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white">시후봇</p>
            <p className="text-[11px] text-[#30D158] font-medium">● 온라인</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl active:bg-white/10 cursor-pointer">
          <X className="w-6 h-6 text-white/40" />
        </button>
      </div>

      {/* ── SCROLLABLE BODY ───────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* ── NPC CHARACTER AREA ──────────────────────────── */}
        <div className="flex items-center justify-center py-8" style={{ minHeight: "30vh" }}>
          <NpcAvatar emotion={emotion} />
        </div>

        {/* ── DIALOGUE AREA ──────────────────────────────── */}
        <div className="px-4 pb-4 space-y-3">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {msg.role === "bot" ? (
                  /* Bot speech card — full width */
                  <div
                    className="w-full rounded-2xl p-4 text-[16px] leading-relaxed whitespace-pre-line"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    {msg.typewriter ? (
                      <TypewriterText text={msg.text} onDone={scroll} />
                    ) : (
                      msg.text
                    )}
                  </div>
                ) : (
                  /* User message — right aligned */
                  <div className="flex justify-end">
                    <div
                      className="max-w-[80%] px-5 py-3 text-[16px] leading-relaxed whitespace-pre-line"
                      style={{
                        background: "#0A84FF",
                        color: "#fff",
                        borderRadius: "20px 20px 4px 20px",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Choice buttons (INLINE in dialogue) */}
          {step === 0 && messages.length >= 2 && !typing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5"
            >
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChoice(true)}
                className="w-full py-3.5 rounded-2xl text-[16px] font-semibold cursor-pointer active:brightness-90"
                style={{ background: "#0A84FF", color: "#fff" }}
              >
                네! 😄
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChoice(false)}
                className="w-full py-3.5 rounded-2xl text-[15px] font-medium cursor-pointer active:bg-white/10"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
              >
                다음에 할게요
              </motion.button>
            </motion.div>
          )}

          {/* Typing indicator */}
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-white/40"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Choice buttons moved INLINE into dialogue area above */}

      {/* ── INPUT (Step 1 & 2) ────────────────────────────── */}
      {(step === 1 || step === 2) && !typing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-4 pb-6 pt-2 border-t border-white/8"
        >
          <div className="flex gap-3 items-center">
            <input
              ref={inputRef}
              type={step === 2 ? "tel" : "text"}
              inputMode={step === 2 ? "numeric" : "text"}
              value={input}
              onChange={(e) => {
                if (step === 2) {
                  // Auto-format phone: 010-0000-0000
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 3 && digits.length <= 7) {
                    formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                  } else if (digits.length > 7) {
                    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                  }
                  setInput(formatted);
                } else {
                  setInput(e.target.value);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={step === 1 ? "이름을 입력해줘" : "010-0000-0000"}
              maxLength={step === 1 ? 20 : 13}
              autoFocus
              className="flex-1 px-5 py-4 rounded-2xl text-[16px] text-white placeholder-white/35 outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer disabled:opacity-20 flex-shrink-0"
              style={{ background: input.trim() ? "#0A84FF" : "rgba(255,255,255,0.06)" }}
            >
              <span className="text-white text-xl font-bold">↑</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Confetti ──────────────────────────────────────── */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: -10,
                width: 10,
                height: 10,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                background: ["#ff6b6b", "#ffd43b", "#51cf66", "#339af0", "#845ef7", "#f06595"][i % 6],
                animation: "confetti-fall 1.5s ease-in forwards",
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Floating hearts ──────────────────────────────── */}
      {showHearts && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${20 + i * 15}%`,
                bottom: "30%",
                animation: "float-heart 2s ease-out forwards",
                animationDelay: `${i * 0.25}s`,
                opacity: 0,
              }}
            >
              ❤️
            </div>
          ))}
        </div>
      )}

      {/* ── Success checkmark ────────────────────────────── */}
      {step === 3 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.6, times: [0, 0.6, 1], ease: "easeOut", delay: 0.3 }}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: "rgba(48,209,88,0.15)", backdropFilter: "blur(8px)" }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1], delay: 0.5 }}
              className="text-5xl text-[#30D158]"
            >
              ✓
            </motion.span>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
