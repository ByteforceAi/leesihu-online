import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Message {
  id: number;
  name: string;
  message: string;
  emoji: string;
  created_at: string;
}

const EMOJIS = ["👋", "🔥", "💜", "⭐", "🎮", "🎵"];

export default function Guestbook() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("👋");
  const [sending, setSending] = useState(false);
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

  return (
    <div className="relative">
      {/* Confetti */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute pointer-events-none"
          style={{
            left: `${c.x}%`, top: 0, width: 6, height: 6, borderRadius: 2,
            background: c.color, animation: "confetti-fall 1s ease-in forwards",
            animationDelay: `${c.delay}s`, zIndex: 50,
          }}
        />
      ))}

      {/* Messages — chat bubble style */}
      <div ref={scrollRef} className="space-y-3 mb-5 max-h-[350px] overflow-y-auto pr-1">
        {!loaded && (
          <div className="text-center py-8">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin mx-auto" />
          </div>
        )}
        {loaded && messages.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">💬</span>
            <p className="text-[13px] text-white/30">첫 번째 메시지를 남겨보세요!</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {messages.slice(0, 15).map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              layout
              className="flex gap-2.5"
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: `hsl(${msg.name.charCodeAt(0) * 37 % 360}, 50%, 35%)`,
                }}
              >
                <span className="text-sm">{msg.emoji}</span>
              </div>

              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-white/80">{msg.name}</span>
                  <span className="text-[10px] text-white/20">{timeAgo(msg.created_at)}</span>
                </div>
                <div
                  className="inline-block px-3.5 py-2 rounded-2xl rounded-tl-md max-w-full"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <p className="text-[14px] text-white/70 break-words leading-relaxed">{msg.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input — iMessage style */}
      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Emoji bar */}
          <div className="flex gap-1.5 px-3 pt-3 pb-1">
            {EMOJIS.map((e) => (
              <motion.button
                key={e}
                type="button"
                onClick={() => setSelectedEmoji(e)}
                whileTap={{ scale: 0.85 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[15px] cursor-pointer transition-all
                  ${selectedEmoji === e
                    ? "bg-white/12 ring-1 ring-white/20 scale-110"
                    : "hover:bg-white/8"}`}
              >
                {e}
              </motion.button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex gap-2 p-3 pt-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              maxLength={20}
              className="w-16 flex-shrink-0 px-3 py-2.5 rounded-full text-[13px] text-white placeholder-white/20 outline-none text-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <div className="flex-1 flex items-center rounded-full px-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메시지..."
                maxLength={100}
                className="flex-1 py-2.5 text-[13px] text-white placeholder-white/20 outline-none bg-transparent"
              />
              <motion.button
                type="submit"
                disabled={!name.trim() || !text.trim() || sending}
                whileTap={{ scale: 0.85 }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer disabled:opacity-20 ml-1"
                style={{
                  background: name.trim() && text.trim() ? "#0A84FF" : "transparent",
                }}
              >
                <Send className="w-3.5 h-3.5" style={{ color: name.trim() && text.trim() ? "#fff" : "rgba(255,255,255,0.2)" }} />
              </motion.button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
