import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  score: number;
  onRestart: () => void;
  onClose: () => void;
  gameId?: string;
}

interface ScoreEntry {
  id: number;
  player_name: string;
  score: number;
  created_at: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function GameLeaderboard({ score, onRestart, onClose, gameId = "mine-runner" }: Props) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch leaderboard
  const fetchScores = async () => {
    try {
      const { supabase } = await import("../lib/supabase");
      const { data } = await supabase
        .from("game_scores")
        .select("*")
        .eq("game_id", gameId)
        .order("score", { ascending: false })
        .limit(10);
      if (data) setScores(data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchScores();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);

    try {
      const { supabase, getSessionId } = await import("../lib/supabase");
      await supabase.from("game_scores").insert({
        game_id: gameId,
        player_name: name.trim(),
        score,
        session_id: getSessionId(),
      });

      setSubmitted(true);

      // Refresh and find rank
      const { data } = await supabase
        .from("game_scores")
        .select("*")
        .eq("game_id", gameId)
        .order("score", { ascending: false })
        .limit(10);

      if (data) {
        setScores(data);
        const rank = data.findIndex(
          (s) => s.player_name === name.trim() && s.score === score
        );
        if (rank >= 0) setMyRank(rank);
      }
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      <div className="max-w-[400px] mx-auto w-full flex flex-col gap-5">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-[22px] font-bold text-white">🏆 순위표</h2>
          <p className="text-[14px] text-white/40 mt-1">
            내 점수: <span className="text-[#FFD60A] font-bold">{score}</span>
          </p>
        </div>

        {/* Name input (before submit) */}
        {!submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-[13px] text-white/50 text-center">
              이름을 입력하고 순위를 등록하세요!
            </p>
            <div className="flex gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="이름 입력"
                maxLength={12}
                className="flex-1 px-4 py-3 rounded-2xl text-[16px] text-white text-center font-medium placeholder-white/20 outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: `1.5px solid ${name.trim() ? "rgba(255,214,10,0.4)" : "rgba(255,255,255,0.08)"}`,
                  transition: "border-color 0.3s",
                }}
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleSubmit}
                disabled={!name.trim() || submitting}
                className="px-5 py-3 rounded-2xl text-[15px] font-bold cursor-pointer disabled:opacity-30"
                style={{
                  background: "linear-gradient(135deg, #FFD60A, #FF9F0A)",
                  color: "#000",
                }}
              >
                {submitting ? "..." : "등록"}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Submitted confirmation */}
        {submitted && myRank !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-2"
          >
            <p className="text-[15px] text-[#30D158] font-semibold">
              ✓ 등록 완료! {myRank < 3 ? `${MEDALS[myRank]} ${myRank + 1}등!` : `${myRank + 1}등`}
            </p>
          </motion.div>
        )}

        {/* Leaderboard list */}
        <div className="space-y-1.5">
          {scores.length === 0 && (
            <p className="text-center text-[14px] text-white/30 py-8">
              아직 기록이 없어요. 첫 번째 기록을 세워보세요!
            </p>
          )}
          {scores.map((entry, i) => {
            const isMe = submitted && entry.player_name === name.trim() && entry.score === score;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isMe ? "rgba(48,209,88,0.12)" : "rgba(255,255,255,0.04)",
                  border: isMe ? "1px solid rgba(48,209,88,0.3)" : "1px solid transparent",
                }}
              >
                {/* Rank */}
                <span className="w-8 text-center text-[16px] font-bold flex-shrink-0">
                  {i < 3 ? MEDALS[i] : (
                    <span className="text-[14px] text-white/30">{i + 1}</span>
                  )}
                </span>
                {/* Name */}
                <span className={`flex-1 text-[15px] font-medium truncate ${isMe ? "text-[#30D158]" : "text-white/80"}`}>
                  {entry.player_name}
                </span>
                {/* Score */}
                <span className="text-[15px] font-bold text-white/60 tabular-nums">
                  {entry.score}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5 mt-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onRestart}
            className="w-full py-3.5 rounded-2xl text-[16px] font-bold cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #30D158, #20c997)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(48,209,88,0.3)",
            }}
          >
            다시하기 🔄
          </motion.button>
          <button
            onClick={onClose}
            className="w-full py-3 text-[14px] text-white/30 cursor-pointer"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}
