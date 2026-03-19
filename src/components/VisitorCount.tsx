import { useState, useEffect } from "react";
import { Eye } from "lucide-react";

const STORAGE_KEY = "leesihu-total-visits";

export default function VisitorCount() {
  const [total, setTotal] = useState(0);
  const [isLive] = useState(true);

  useEffect(() => {
    // Simple persistent counter using localStorage
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    const newTotal = stored + 1;
    localStorage.setItem(STORAGE_KEY, newTotal.toString());
    setTotal(newTotal);
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
        {isLive && (
          <div className="relative">
            <div className="w-[5px] h-[5px] rounded-full bg-[#30D158]" />
            <div className="absolute inset-0 w-[5px] h-[5px] rounded-full bg-[#30D158] animate-ping opacity-40" />
          </div>
        )}
        <Eye className="w-3 h-3 text-white/30" />
      </div>
      <span className="text-[11px] text-white/40">
        {total > 0 ? `${total}번째 방문자` : "..."}
      </span>
    </div>
  );
}
