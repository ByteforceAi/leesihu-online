import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";
import { supabase } from "../lib/supabase";

const ADMIN_PIN = "8888";

interface Notice {
  id: number;
  message: string;
  created_at: string;
}

export default function AdminNotice() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showNotice, setShowNotice] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchNotices = useCallback(async () => {
    const { data } = await supabase
      .from("guestbook")
      .select("*")
      .eq("name", "📢 관리자")
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) setNotices(data);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handlePinSubmit = () => {
    if (pin === ADMIN_PIN) {
      setPinVerified(true);
    } else {
      setPin("");
    }
  };

  const handlePost = async () => {
    if (!newMessage.trim() || posting) return;
    setPosting(true);
    await supabase.from("guestbook").insert({
      name: "📢 관리자",
      message: newMessage.trim(),
      emoji: "📢",
    });
    setNewMessage("");
    setPosting(false);
    setPinVerified(false);
    setShowAdmin(false);
    fetchNotices();
  };

  const latestNotice = notices[0];

  if (!latestNotice || !showNotice) return null;

  return (
    <>
      {/* Notice banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          background: "rgba(255,149,0,0.08)",
          border: "1px solid rgba(255,149,0,0.15)",
        }}
      >
        <Megaphone className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white/70">{latestNotice.message}</p>
          <p className="text-[10px] text-white/20 mt-1">
            {new Date(latestNotice.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <button
          onClick={() => setShowNotice(false)}
          className="p-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-white/20" />
        </button>
      </motion.div>

      {/* Admin write button (hidden, long-press the notice banner) */}
      <button
        onClick={() => setShowAdmin(true)}
        className="hidden"
        id="admin-trigger"
      />

      {/* Admin modal */}
      <AnimatePresence>
        {showAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAdmin(false); setPinVerified(false); setPin(""); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[300px] rounded-2xl p-5"
              style={{ background: "rgba(30,30,30,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {!pinVerified ? (
                <>
                  <h3 className="text-[17px] font-semibold text-white text-center mb-4">관리자 인증</h3>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                    maxLength={4}
                    placeholder="PIN"
                    autoFocus
                    className="w-full text-center text-[24px] tracking-[12px] py-3 rounded-xl outline-none text-white placeholder-white/15 mb-4"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <button
                    onClick={handlePinSubmit}
                    className="w-full py-2.5 rounded-xl text-[15px] text-white font-medium cursor-pointer"
                    style={{ background: "#0A84FF" }}
                  >
                    확인
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-[17px] font-semibold text-white text-center mb-4">공지 작성</h3>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="공지 내용을 입력하세요..."
                    maxLength={200}
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-xl text-[14px] text-white placeholder-white/20 outline-none resize-none mb-3"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <button
                    onClick={handlePost}
                    disabled={!newMessage.trim() || posting}
                    className="w-full py-2.5 rounded-xl text-[15px] text-white font-medium cursor-pointer disabled:opacity-40"
                    style={{ background: "#FF9500" }}
                  >
                    {posting ? "올리는 중..." : "공지 올리기"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Export trigger function for use in HomePage
export function openAdminPanel() {
  document.getElementById("admin-trigger")?.click();
}
