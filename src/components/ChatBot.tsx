import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const BOT_NAME = "시후봇";

// Simple rule-based chatbot (no API needed)
function getBotResponse(input: string): string {
  const q = input.toLowerCase().trim();

  // Greetings
  if (q.match(/안녕|하이|헬로|hi|hello|ㅎㅇ/))
    return "안녕하세요! 👋 이시후의 개인 포탈에 오신 걸 환영합니다! 무엇이 궁금하세요?";

  // Who is Sihu
  if (q.match(/시후|누구|소개|who/))
    return "이시후는 게임 크리에이터예요! 🎮 MakeCode Arcade로 게임도 만들고, AI Game Factory도 운영하고 있어요. 코딩을 2025년에 시작했답니다!";

  // Games
  if (q.match(/게임|game|버거|burger|chase/))
    return "Chase the Burger 🍔 — 시후가 MakeCode Arcade로 만든 첫 게임이에요! 홈 화면에서 GAME을 눌러보세요!";

  // Simulator / AI
  if (q.match(/시뮬|연동|ai|인공지능|factory/))
    return "AI Game Factory는 AI로 게임을 생성하는 플랫폼이에요! 🤖 홈 화면에서 '연동'을 눌러보세요!";

  // Music
  if (q.match(/음악|노래|music|밤양갱/))
    return "하단의 음악 탭을 누르면 밤양갱 Soul Blues Ballad 리믹스를 들을 수 있어요! 🎵";

  // Guestbook
  if (q.match(/방명록|guest|메시지|남기/))
    return "하단 탭에서 '방명록'을 눌러보세요! ✏️ 이름과 메시지를 남기면 실시간으로 다른 사람들도 볼 수 있어요.";

  // Timeline
  if (q.match(/타임|연대|역사|history|timeline/))
    return "타임라인 탭에서 시후의 성장 기록을 볼 수 있어요! 📅 2025년 코딩 시작부터 지금까지의 여정이 담겨있답니다.";

  // Minecraft
  if (q.match(/마크|마인|minecraft|블록/))
    return "시후는 마인크래프트를 좋아해요! ⛏️ 이 사이트의 배경 이미지도 마인크래프트 스크린샷이랍니다!";

  // Age / school
  if (q.match(/나이|학교|몇살|학년/))
    return "비밀이에요! 🤫 하지만 어린 나이에 코딩을 시작한 건 정말 대단하죠?";

  // How made / tech
  if (q.match(/어떻게|만들|기술|tech|react|코드/))
    return "이 사이트는 React + TypeScript + Tailwind CSS로 만들어졌어요! 💻 Vercel에 배포되어 있고, Supabase로 실시간 방명록도 구현했답니다.";

  // Fun
  if (q.match(/재밌|좋아|멋|cool|awesome|대박/))
    return "감사합니다! 😄 시후도 기뻐할 거예요! 방명록에 응원 메시지를 남겨주세요!";

  // Contact
  if (q.match(/연락|contact|이메일|email/))
    return "방명록에 메시지를 남겨주시면 시후가 확인할 거예요! 📬";

  // Default
  const defaults = [
    "흠... 🤔 다른 질문을 해보세요! 시후, 게임, 음악에 대해 물어볼 수 있어요.",
    "잘 모르겠어요! 😅 '시후가 누구야?', '게임 뭐 만들었어?' 같은 질문은 어때요?",
    "재미있는 질문이네요! 🎮 시후의 게임이나 이 사이트에 대해 더 물어봐주세요!",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: `안녕하세요! 저는 ${BOT_NAME}이에요 🤖 이시후월드에 대해 뭐든 물어보세요!` },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const response = getBotResponse(userMsg);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <>
      {/* Floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[72px] right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
              boxShadow: "0 4px 20px rgba(14,165,233,0.4)",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed bottom-[72px] right-5 z-50 w-[340px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden flex flex-col"
            style={{
              height: "min(400px, calc(100vh - 140px))",
              background: "rgba(20,20,20,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{BOT_NAME}</p>
                  <p className="text-[10px] text-white/30">항상 응답 가능</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 cursor-pointer">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className="max-w-[75%] px-3 py-2 rounded-2xl text-[14px] leading-relaxed"
                    style={{
                      background: msg.role === "user" ? "#0A84FF" : "rgba(255,255,255,0.12)",
                      color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.8)",
                      borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                      borderBottomLeftRadius: msg.role === "bot" ? 4 : 16,
                    }}
                  >
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-white/50" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-[6px] h-[6px] rounded-full bg-white/30"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-3 py-2.5 rounded-xl text-[13px] text-white placeholder-white/35 outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer disabled:opacity-20"
                  style={{
                    background: input.trim() ? "#0A84FF" : "rgba(255,255,255,0.04)",
                  }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
