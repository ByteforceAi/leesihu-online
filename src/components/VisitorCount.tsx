import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { supabase, getSessionId } from "../lib/supabase";

export default function VisitorCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sessionId = getSessionId();

    // Register this visitor
    async function heartbeat() {
      await supabase.from("visitors").upsert(
        { session_id: sessionId, last_seen: new Date().toISOString() },
        { onConflict: "session_id" }
      );
    }

    // Count active visitors (seen in last 3 minutes)
    async function countActive() {
      const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const { count: c } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", cutoff);

      setCount(c ?? 0);
    }

    // Cleanup old visitors (older than 5 minutes)
    async function cleanup() {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase.from("visitors").delete().lt("last_seen", cutoff);
    }

    // Initial
    heartbeat().then(countActive);
    cleanup();

    // Heartbeat every 30 seconds
    const interval = setInterval(() => {
      heartbeat().then(countActive);
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      supabase.from("visitors").delete().eq("session_id", sessionId);
    };
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <div className="w-[5px] h-[5px] rounded-full bg-[#30D158]" />
          <div className="absolute inset-0 w-[5px] h-[5px] rounded-full bg-[#30D158] animate-ping opacity-40" />
        </div>
        <Eye className="w-3 h-3 text-white/30" />
      </div>
      <span className="text-[11px] text-white/40">
        {count > 0 ? `${count}명이 보고 있어요` : "접속 중..."}
      </span>
    </div>
  );
}
