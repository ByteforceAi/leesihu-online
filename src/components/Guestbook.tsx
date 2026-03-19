import { useState, useEffect, useCallback } from "react";
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

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setMessages(data);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel("guestbook-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guestbook" },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  return (
    <div>
      {/* Section title */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-semibold text-white">방명록</h2>
        <span className="text-xs text-white/30">
          {!loaded
            ? "불러오는 중..."
            : messages.length > 0
              ? `${messages.length}개의 메시지`
              : "첫 번째 메시지를 남겨보세요"}
        </span>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Emoji picker */}
          <div className="flex gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setSelectedEmoji(e)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer
                  ${selectedEmoji === e ? "bg-white/15 scale-110" : "bg-white/5 hover:bg-white/10"}`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Name + message inputs */}
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              maxLength={20}
              className="w-20 flex-shrink-0 px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="메시지를 남겨보세요..."
              maxLength={100}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <button
              type="submit"
              disabled={!name.trim() || !text.trim() || sending}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer
                disabled:opacity-20"
              style={{
                background: name.trim() && text.trim() ? "rgba(48,209,88,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${name.trim() && text.trim() ? "rgba(48,209,88,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <Send className="w-4 h-4" style={{ color: name.trim() && text.trim() ? "#30D158" : "rgba(255,255,255,0.2)" }} />
            </button>
          </div>
        </div>
      </form>

      {/* Messages */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {messages.slice(0, 10).map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              layout
              className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="text-base mt-0.5">{msg.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white/80">{msg.name}</span>
                  <span className="text-[10px] text-white/20">{timeAgo(msg.created_at)}</span>
                </div>
                <p className="text-sm text-white/50 break-words">{msg.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
