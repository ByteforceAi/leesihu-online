import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playFriendAdd } from "../lib/sounds";

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
}

interface Props {
  onClose: () => void;
}

export default function FriendChatFlow({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0); // 0=intro, 1=name, 2=phone, 3=done
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const phone = useRef("");
  const [confetti, setConfetti] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgId = useRef(0);

  const scroll = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const addBot = (text: string, delay = 800) => {
    setTyping(true);
    scroll();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        msgId.current++;
        setMessages((prev) => [...prev, { id: msgId.current, role: "bot", text }]);
        setTyping(false);
        scroll();
        resolve();
      }, delay);
    });
  };

  const addUser = (text: string) => {
    msgId.current++;
    setMessages((prev) => [...prev, { id: msgId.current, role: "user", text }]);
    scroll();
  };

  // Step 0: Introduction
  useEffect(() => {
    const run = async () => {
      await addBot("안녕! 나는 시후봇이야 👋", 600);
      await addBot("시후와 친구가 되고 싶어?", 800);
    };
    run();
  }, []);

  const handleChoice = async (choice: boolean) => {
    if (!choice) {
      addUser("아니요");
      await addBot("괜찮아! 다음에 또 와줘 😊", 600);
      setTimeout(onClose, 1500);
      return;
    }
    addUser("네! 😄");
    await addBot("좋아! 이름을 알려줘!", 700);
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
      await addBot(`${value}! 멋진 이름이다! 💙`, 600);
      await addBot("연락처를 남겨주면 시후가 연락할게! 📱", 800);
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
      } catch { /* silent */ }

      setStep(3);
      playFriendAdd();
      setConfetti(true);
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
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
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <span className="text-xs">🤖</span>
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
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center">
                <span className="text-xs">🤖</span>
              </div>
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
                  background: ["#ff6b6b","#ffd43b","#51cf66","#339af0","#845ef7","#f06595"][i % 6],
                  animation: "confetti-fall 1.5s ease-in forwards",
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
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
