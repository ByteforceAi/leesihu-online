import { motion } from "framer-motion";
import { SITE_CONFIG } from "../config/site";

export default function Timeline() {
  const groups = SITE_CONFIG.timeline;

  return (
    <div>
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        <div className="space-y-6">
          {groups.map((group, gi) => {
            const isCurrentYear = gi === 0;

            return (
              <div key={group.year}>
                {/* Year label */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <div
                    className={`w-[15px] h-[15px] rounded-full flex items-center justify-center relative z-10${isCurrentYear ? " timeline-pulse" : ""}`}
                    style={{
                      background: isCurrentYear ? "#30D158" : "rgba(255,255,255,0.15)",
                      boxShadow: isCurrentYear ? "0 0 12px rgba(48,209,88,0.3)" : "none",
                    }}
                  >
                    <div className="w-[5px] h-[5px] rounded-full bg-white" />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isCurrentYear ? "#30D158" : "rgba(255,255,255,0.4)" }}
                  >
                    {group.year}
                  </span>
                </motion.div>

                {/* Items */}
                <div className="pl-8 space-y-2">
                  {group.items.map((item, ii) => {
                    const isLatest = gi === 0 && ii === 0;

                    return (
                      <motion.div
                        key={`${gi}-${ii}`}
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-30px" }}
                        transition={{ delay: ii * 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        className="rounded-xl px-4 py-3 timeline-item"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-medium text-white/85">{item.title}</h3>
                          {item.date && (
                            <span className="text-[10px] text-white/20">{item.date}</span>
                          )}
                          {isLatest && (
                            <span className="relative flex items-center ml-auto">
                              <span className="timeline-now-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-40" />
                              <span className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider text-white bg-[#30D158]/80">
                                NOW
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{item.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
