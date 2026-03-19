export const SITE_CONFIG = {
  title: "LEESIHU",
  titleSuffix: ".ONLINE",
  loadingText: "접속 중...",

  servers: [
    {
      id: "game",
      name: "GAME",
      description: "Chase the Burger — by Sihu",
      status: "smooth" as const,
      url: "https://arcade.makecode.com/14822-55492-85994-94645",
      disabled: false,
      gradient: "linear-gradient(135deg, #30D158, #34d399)",
    },
    {
      id: "simulator",
      name: "연동",
      description: "AI Game Factory — AI 게임 생성기",
      status: "smooth" as const,
      url: "https://ai-game-factory.vercel.app/",
      disabled: false,
      gradient: "linear-gradient(135deg, #0EA5E9, #6366F1)",
    },
  ],

  timeline: [
    {
      year: "2026",
      items: [
        { title: "leesihu.online 런칭", desc: "개인 포탈 사이트 오픈", date: "03월" },
        { title: "AI Game Factory", desc: "AI 기반 게임 생성 플랫폼 제작", date: "03월" },
        { title: "Chase the Burger", desc: "MakeCode Arcade 첫 게임 출시", date: "02월" },
      ],
    },
    {
      year: "2025",
      items: [
        { title: "코딩 시작", desc: "프로그래밍의 세계에 첫 발을 내딛다", date: "" },
      ],
    },
  ],

  meta: {
    title: "Leesihu Online — 이시후월드",
    description: "이시후의 개인 포탈. 게임, 음악, 그리고 더 많은 것들.",
    ogImage: "/og-image.jpg",
    url: "https://leesihu.online",
  },

  music: {
    enabled: true,
    src: "/assets/bgm.wav",
    title: "밤양갱 — Soul Blues Ballad",
    artist: "이시후월드",
  },

  // Supabase config — fill in to enable real-time features
  supabase: {
    url: "",       // e.g. "https://xxx.supabase.co"
    anonKey: "",   // public anon key
  },
};
