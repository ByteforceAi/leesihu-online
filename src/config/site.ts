export const SITE_CONFIG = {
  title: "LEESIHU",
  titleSuffix: ".ONLINE",
  categoryText: "WELCOME TO",
  subtitle: "블록 하나하나에 담긴 세계가\n당신의 발걸음을 기다리고 있습니다",
  enterText: "화면을 터치하세요",
  buttonText: "GAME START",
  loadingText: "접속 중...",

  servers: [
    {
      id: "game",
      name: "GAME",
      description: "이시후의 마인크래프트 월드",
      status: "smooth" as const,
      url: "https://arcade.makecode.com/14822-55492-85994-94645",
      image: "/assets/game-thumb.jpg",
      disabled: false,
    },
    {
      id: "simulator",
      name: "SIMULATOR",
      description: "AI 게임 팩토리",
      status: "smooth" as const,
      url: "https://ai-game-factory.vercel.app/",
      image: "/assets/sim-thumb.jpg",
      disabled: false,
    },
  ],

  meta: {
    title: "Leesihu Online — 이시후월드",
    description: "블록 하나하나에 담긴 세계가 당신의 발걸음을 기다리고 있습니다.",
    ogImage: "/og-image.jpg",
    url: "https://leesihu.online",
  },

  music: {
    enabled: true,
    src: "/assets/bgm.wav",
    title: "밤양갱 — Soul Blues Ballad",
    artist: "이시후월드",
  },
};
