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
    }, 25);

    return () => clearInterval(timer);
  }, [text, onDone]);

  return <>{displayed}</>;
}

/* ── NPC Avatar ─────────────────────────────────────────── */
function NpcAvatar({ emotion, size = "sm" }: { emotion: NpcEmotion; size?: "sm" | "header" }) {
  const dim = size === "header" ? "w-8 h-8" : "w-7 h-7";
  const textSize = size === "header" ? "text-[9px]" : "text-[8px]";

  return (
    <motion.div
      key={emotion}
      initial={{ scale: 0.7 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 12 }}
      className={`${dim} rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${textSize} leading-none select-none`}>{KAOMOJI[emotion]}</span>
    </motion.div>
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
    (text: string, delay = 800) => {
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
        const { supabase } = await import("../lib/supabase");
        await supabase.from("guestbook").insert({
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
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-[400px] h-[85vh] sm:h-[500px] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2.5">
            <NpcAvatar emotion={emotion} size="header" />
            <div>
              <p className="text-[14px] font-semibold text-white">시후봇</p>
              <p className="text-[10px] text-[#30D158]">● 온라인</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 cursor-pointer">
            <X className="w-5 h-5 text-white/30" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "bot" && (
                  <div className="mr-2 mt-1">
                    <NpcAvatar emotion={emotion} />
                  </div>
                )}
                <div
                  className="max-w-[75%] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-line"
                  style={{
                    background: msg.role === "user" ? "#0A84FF" : "rgba(255,255,255,0.08)",
                    color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.85)",
                    borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  }}
                >
                  {msg.role === "bot" && msg.typewriter ? (
                    <TypewriterText text={msg.text} onDone={scroll} />
                  ) : (
                    msg.text
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-center gap-2">
              <NpcAvatar emotion="thinking" />
              <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-[6px] h-[6px] rounded-full bg-white/30"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Choice buttons (Step 0) */}
          {step === 0 && messages.length >= 2 && !typing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 pl-9"
            >
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleChoice(true)}
                className="px-5 py-2.5 rounded-full text-[14px] font-medium cursor-pointer"
                style={{ background: "#0A84FF", color: "#fff" }}
              >
                네! 😄
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleChoice(false)}
                className="px-5 py-2.5 rounded-full text-[14px] font-medium cursor-pointer"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                다음에요
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Confetti */}
        {confetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: -10,
                  width: 8,
                  height: 8,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  background: ["#ff6b6b", "#ffd43b", "#51cf66", "#339af0", "#845ef7", "#f06595"][i % 6],
                  animation: "confetti-fall 1.5s ease-in forwards",
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Floating hearts */}
        {showHearts && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute text-lg"
                style={{
                  left: `${35 + i * 15}%`,
                  bottom: "30%",
                  animation: "float-heart 2s ease-out forwards",
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0,
                }}
              >
                ❤️
              </div>
            ))}
          </div>
        )}

        {/* Success checkmark */}
        {step === 3 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.6, times: [0, 0.6, 1], ease: "easeOut", delay: 0.3 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(48,209,88,0.15)" }}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1], delay: 0.5 }}
                className="text-4xl"
              >
                ✓
              </motion.span>
            </motion.div>
          </div>
        )}

        {/* Input (Step 1 & 2) */}
        {(step === 1 || step === 2) && !typing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 border-t border-white/6"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type={step === 2 ? "tel" : "text"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={step === 1 ? "이름을 입력해줘" : "010-0000-0000"}
                maxLength={step === 1 ? 20 : 13}
                autoFocus
                className="flex-1 px-4 py-3 rounded-full text-[14px] text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-20"
                style={{ background: input.trim() ? "#0A84FF" : "rgba(255,255,255,0.04)" }}
              >
                <span className="text-white text-lg">↑</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
