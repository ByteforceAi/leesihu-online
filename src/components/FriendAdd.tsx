import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Check, PartyPopper } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function FriendAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || sending) return;
    setSending(true);

    // Store friend request in guestbook with special name prefix
    await supabase.from("guestbook").insert({
      name: `🤝 ${name.trim()}`,
      message: `친구추가 요청 — 연락처: ${phone.trim()}`,
      emoji: "🤝",
    });

    setSending(false);
    setSuccess(true);

    // Reset after 3s
    setTimeout(() => {
      setSuccess(false);
      setIsOpen(false);
      setName("");
      setPhone("");
    }, 3000);
  };

  return (
    <>
      {/* Friend add card in home */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left cursor-pointer active:bg-white/5 transition-colors duration-100"
      >
        <div className="flex items-center gap-3.5 px-4 py-3.5">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-medium text-white">친구추가</h3>
            <p className="text-[12px] text-white/35">시후와 친구가 되어보세요</p>
          </div>
          <div className="w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-white">N</span>
          </div>
        </div>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!success) { setIsOpen(false); } }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-t-3xl sm:rounded-3xl overflow-hidden"
              style={{
                background: "rgba(25,25,25,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
              }}
            >
              {success ? (
                /* Success state */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center py-12 px-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
                  >
                    <Check className="w-8 h-8 text-[#30D158]" />
                  </motion.div>
                  <h3 className="text-[20px] font-bold text-white mb-1">친구추가 완료! 🎉</h3>
                  <p className="text-[14px] text-white/40 text-center">
                    {name}님, 환영합니다!<br />시후가 곧 연락할 거예요.
                  </p>
                </motion.div>
              ) : (
                /* Form */
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div />
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#30D158] to-[#0EA5E9] flex items-center justify-center mx-auto mb-2">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-[18px] font-bold text-white">친구추가</h3>
                      <p className="text-[12px] text-white/35 mt-0.5">시후와 친구가 되어보세요!</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 cursor-pointer">
                      <X className="w-5 h-5 text-white/25" />
                    </button>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="text-[11px] text-white/30 uppercase tracking-wider mb-1 block px-1">이름</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                        maxLength={20}
                        className="w-full px-4 py-3 rounded-xl text-[15px] text-white placeholder-white/20 outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/30 uppercase tracking-wider mb-1 block px-1">연락처</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        maxLength={13}
                        className="w-full px-4 py-3 rounded-xl text-[15px] text-white placeholder-white/20 outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!name.trim() || !phone.trim() || sending}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-2xl text-[16px] font-semibold text-white cursor-pointer disabled:opacity-30"
                    style={{
                      background: name.trim() && phone.trim()
                        ? "linear-gradient(135deg, #30D158, #0EA5E9)"
                        : "rgba(255,255,255,0.06)",
                      boxShadow: name.trim() && phone.trim()
                        ? "0 4px 16px rgba(48,209,88,0.3)"
                        : "none",
                    }}
                  >
                    {sending ? "처리 중..." : "친구추가 하기"}
                  </motion.button>

                  <p className="text-[10px] text-white/15 text-center mt-3">
                    입력된 정보는 시후에게만 전달됩니다
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
