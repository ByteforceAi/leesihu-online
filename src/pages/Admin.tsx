import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/* ─── Types ─── */
interface Message {
  id: number;
  name: string;
  message: string;
  emoji: string;
  created_at: string;
}

type FilterMode = "all" | "friend" | "notice";

/* ─── PIN Screen ─── */
function PinScreen({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (pin === "8888") {
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div
        className={`w-full max-w-xs text-center transition-transform ${
          shake ? "animate-[shake_0.5s_ease-in-out]" : ""
        }`}
      >
        <div className="text-5xl mb-6">🔐</div>
        <h1 className="text-white text-xl font-semibold mb-2">관리자 인증</h1>
        <p className="text-gray-500 text-sm mb-6">PIN을 입력하세요</p>
        <input
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={handleKeyDown}
          placeholder="••••"
          className={`w-full text-center text-3xl tracking-[0.5em] bg-white/5 border ${
            error ? "border-red-500" : "border-white/10"
          } rounded-2xl px-4 py-4 text-white placeholder-white/20 outline-none focus:border-purple-500 transition-colors`}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={pin.length !== 4}
          className="mt-4 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-2xl transition-colors"
        >
          확인
        </button>
        {error && (
          <p className="text-red-400 text-sm mt-3">잘못된 PIN입니다</p>
        )}
      </div>
    </div>
  );
}

/* ─── Stats Card ─── */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-white text-3xl font-bold">{value}</div>
    </div>
  );
}

/* ─── Dashboard ─── */
function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [noticeText, setNoticeText] = useState("");
  const [posting, setPosting] = useState(false);
  const [visitorsToday, setVisitorsToday] = useState(0);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  }, []);

  const fetchVisitors = useCallback(async () => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();

    const { count } = await supabase
      .from("visitors")
      .select("*", { count: "exact", head: true })
      .gte("visited_at", startOfDay);

    setVisitorsToday(count ?? 0);
  }, []);

  useEffect(() => {
    void fetchMessages();
    void fetchVisitors();
  }, [fetchMessages, fetchVisitors]);

  /* ─── Delete message ─── */
  const handleDelete = async (id: number) => {
    await supabase.from("guestbook").delete().eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  /* ─── Post notice ─── */
  const handlePostNotice = async () => {
    if (!noticeText.trim()) return;
    setPosting(true);
    await supabase.from("guestbook").insert({
      name: "\uD83D\uDCE2 관리자",
      message: noticeText.trim(),
      emoji: "\uD83D\uDCE2",
    });
    setNoticeText("");
    setPosting(false);
    await fetchMessages();
  };

  /* ─── Filter logic ─── */
  const filtered = messages.filter((m) => {
    if (filter === "friend") return m.emoji === "\uD83E\uDD1D";
    if (filter === "notice") return m.emoji === "\uD83D\uDCE2";
    return true;
  });

  const totalMessages = messages.length;
  const friendRequests = messages.filter(
    (m) => m.emoji === "\uD83E\uDD1D"
  ).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/50 text-lg">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">⚙️ 관리자 대시보드</h1>
          <a
            href="/"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← 홈으로
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* ─── 1. Stats ─── */}
        <section>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
            📊 통계
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="전체 메시지"
              value={totalMessages}
              icon="💬"
            />
            <StatCard
              label="친구 요청"
              value={friendRequests}
              icon="🤝"
            />
            <StatCard
              label="오늘 방문자"
              value={visitorsToday}
              icon="👀"
            />
          </div>
        </section>

        {/* ─── 2. Post Notice ─── */}
        <section>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
            📢 공지 작성
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <textarea
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              placeholder="공지 내용을 입력하세요..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500 resize-none transition-colors"
            />
            <button
              onClick={() => void handlePostNotice()}
              disabled={!noticeText.trim() || posting}
              className="mt-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              {posting ? "올리는 중..." : "공지 올리기"}
            </button>
          </div>
        </section>

        {/* ─── 3. Message Management ─── */}
        <section>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
            💬 메시지 관리
          </h2>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {(
              [
                ["all", "전체"],
                ["friend", "🤝 친구요청"],
                ["notice", "📢 공지"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-white/50 hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center text-white/30 py-10">
                메시지가 없습니다
              </div>
            )}
            {filtered.map((msg) => (
              <div
                key={msg.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-4"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {msg.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{msg.name}</span>
                    <span className="text-white/30 text-xs">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm break-all">
                    {msg.message}
                  </p>
                </div>
                <button
                  onClick={() => void handleDelete(msg.id)}
                  className="flex-shrink-0 text-red-400/60 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 4. Friend Requests ─── */}
        <section>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
            🤝 친구 요청
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {messages.filter((m) => m.emoji === "\uD83E\uDD1D").length ===
            0 ? (
              <div className="text-center text-white/30 py-10">
                친구 요청이 없습니다
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {messages
                  .filter((m) => m.emoji === "\uD83E\uDD1D")
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className="px-5 py-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-sm">{msg.name}</div>
                        <div className="text-white/50 text-xs mt-1">
                          {msg.message}
                        </div>
                      </div>
                      <span className="text-white/30 text-xs">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Export ─── */
export default function Admin() {
  const [authed, setAuthed] = useState(false);

  if (!authed) return <PinScreen onAuth={() => setAuthed(true)} />;
  return <Dashboard />;
}
