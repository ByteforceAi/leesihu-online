import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Message {
  id: number;
  name: string;
  message: string;
  emoji: string;
  created_at: string;
}

const EMOJIS = ["👋", "🔥", "💜", "⭐", "🎮", "🎵"];

// Floating sparkle for empty state background
function Sparkle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: "rgba(255,255,255,0.15)",
      }}
      animate={{
        opacity: [0, 0.6, 0],
        scale: [0.5, 1.2, 0.5],
        y: [0, -12, 0],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function Guestbook() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("👋");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setMessages(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("guestbook-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "guestbook" }, (payload) => {
        setMessages((prev) => [payload.new as Message, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages]);

  // Auto-scroll to top when new messages arrive (newest first)
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("guestbook").insert({
      name: name.trim().slice(0, 20),
      message: text.trim().slice(0, 100),
      emoji: selectedEmoji,
    });
    if (!error) {
      setText("");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 800);
      const colors = ["#ff6b6b", "#ffd43b", "#51cf66", "#339af0", "#845ef7", "#f06595"];
      const particles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: 20 + Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
      }));
      setConfetti(particles);
      setTimeout(() => setConfetti([]), 1200);
    }
    setSending(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "방금 전";
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const avatarColor = (n: string) =>
    `hsl(${n.charCodeAt(0) * 37 % 360}, 50%, 35%)`;

  const sparkles = Array.from({ length: 14 }, (_, i) => ({
    delay: i * 0.4,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 3 + Math.random() * 4,
  }));

  return (
    <div className="relative flex flex-col h-full min-h-[70vh]">
      {/* Confetti */}
      <AnimatePresence>
        {confetti.map((c) => (
          <motion.div
            key={c.id}
            className="absolute pointer-events-none z-50"
            style={{
              left: `${c.x}%`,
              top: 0,
              width: 6,
              height: 6,
              borderRadius: 2,
              background: c.color,
            }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 300, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: c.delay, ease: "easeIn" }}
          />
        ))}
      </AnimatePresence>

      {/* ── 1. INPUT CARD (TOP) ── */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 mb-4">
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Emoji row */}
          <div className="flex gap-1.5 mb-3">
            {EMOJIS.map((e) => (
              <motion.button
                key={e}
                type="button"
                onClick={() => setSelectedEmoji(e)}
                whileTap={{ scale: 1.3, transition: { duration: 0.1, type: "spring", stiffness: 500 } }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[16px] cursor-pointer transition-all
                  ${selectedEmoji === e
                    ? "bg-white/12 ring-1 ring-white/20 scale-110"
                    : "hover:bg-white/8"}`}
              >
                {e}
              </motion.button>
            ))}
          </div>

          {/* Name + message + send */}
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              maxLength={20}
              className="w-20 flex-shrink-0 px-3 py-3 rounded-xl text-[13px] text-white placeholder-white/35 outline-none text-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <div
              className="flex-1 flex items-center rounded-xl px-3"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메시지를 남겨보세요..."
                maxLength={100}
                className="flex-1 py-3 text-[14px] text-white placeholder-white/35 outline-none bg-transparent"
              />
              <motion.button
                type="submit"
                disabled={!name.trim() || !text.trim() || sending}
                whileTap={{ scale: 0.85 }}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer disabled:opacity-20 ml-2"
                style={{
                  background: sendSuccess
                    ? "#30D158"
                    : name.trim() && text.trim()
                      ? "#0A84FF"
                      : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                <AnimatePresence mode="wait">
                  {sendSuccess ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="send"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Send
                        className="w-4 h-4"
                        style={{ color: name.trim() && text.trim() ? "#fff" : "rgba(255,255,255,0.2)" }}
                      />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </form>

      {/* ── 2. MESSAGES LIST / 3. EMPTY STATE ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {/* Loading spinner */}
        {!loaded && (
          <div className="flex items-center justify-center h-full min-h-[40vh]">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state — fills remaining space */}
        {loaded && messages.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[50vh]">
            <div className="relative w-full max-w-xs mx-auto">
              {/* Sparkle particles */}
              {sparkles.map((s, i) => (
                <Sparkle key={i} {...s} />
              ))}

              <div className="flex flex-col items-center gap-3 py-12">
                <motion.span
                  className="text-6xl block"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  💬
                </motion.span>
                <p className="text-[18px] text-white/50 font-medium mt-2">
                  아직 아무도 없어요
                </p>
                <p className="text-[14px] text-white/30">
                  첫 번째로 발자국을 남겨보세요! 🎉
                </p>

                {/* Animated dots */}
                <div className="flex gap-2 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/20"
                      animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.4, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message cards */}
        {loaded && messages.length > 0 && (
          <div className="space-y-3 pb-4">
            <AnimatePresence mode="popLayout">
              {messages.slice(0, 30).map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.025, duration: 0.3 }}
                  layout
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: avatarColor(msg.name) }}
                    >
                      <span className="text-sm">{msg.emoji}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[14px] font-bold text-white/85">{msg.name}</span>
                        <span className="text-[11px] text-white/25">{timeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-[15px] text-white/90 break-words leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
