import { useEffect, useRef } from "react";

const BLOCK_COLORS = [
  "#4a8c2a", // grass green
  "#6b5e3e", // dirt brown
  "#7a7a7a", // stone gray
  "#3b7ecf", // diamond blue
  "#c8b77a", // sand
  "#2d5a1b", // dark leaf
];

export default function MinecraftParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{
    x: number; y: number; size: number; speed: number;
    color: string; rotation: number; rotSpeed: number; opacity: number;
  }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: Math.random() * w,
        y: -Math.random() * h,
        size: 3 + Math.random() * 5,
        speed: 0.3 + Math.random() * 0.8,
        color: BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }

    let animId: number;
    const animate = () => {
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      ctx.clearRect(0, 0, cw, ch);

      for (const p of particlesRef.current) {
        p.y += p.speed;
        p.rotation += p.rotSpeed;

        if (p.y > ch + 20) {
          p.y = -20;
          p.x = Math.random() * cw;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        // Draw square block (Minecraft pixel style)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        // Inner highlight
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size / 2, p.size / 2);
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    // Touch to burst
    const handleTouch = (e: TouchEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const tx = "touches" in e ? e.touches[0].clientX - rect.left : (e as MouseEvent).clientX - rect.left;
      const ty = "touches" in e ? e.touches[0].clientY - rect.top : (e as MouseEvent).clientY - rect.top;

      // Burst nearby particles
      for (const p of particlesRef.current) {
        const dx = p.x - tx;
        const dy = p.y - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
          p.speed = -3 - Math.random() * 2;
          p.rotSpeed = (Math.random() - 0.5) * 0.1;
          setTimeout(() => {
            p.speed = 0.3 + Math.random() * 0.8;
            p.rotSpeed = (Math.random() - 0.5) * 0.02;
          }, 800);
        }
      }
    };

    canvas.addEventListener("touchstart", handleTouch);
    canvas.addEventListener("click", handleTouch);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", handleTouch);
      canvas.removeEventListener("click", handleTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 5 }}
    />
  );
}
