import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  angle: number;
  speed: number;
  pulseSpeed: number;
  pulseOffset: number;
  hue: number; // 0 = emerald, 1 = amber
}

interface ParticleCanvasProps {
  converge: boolean;
}

export default function ParticleCanvas({ converge }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 2,
        alpha: Math.random() * 0.5 + 0.3,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? 0 : 1,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const animate = () => {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particlesRef.current.forEach((p) => {
        if (converge) {
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          p.x += dx * 0.03;
          p.y += dy * 0.03;
          p.alpha = Math.max(p.alpha - 0.003, 0.05);
        } else {
          p.angle += (Math.random() - 0.5) * 0.1;
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed;

          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }

        const pulse = Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset) * 0.3 + 0.7;
        const finalAlpha = p.alpha * pulse;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);

        if (p.hue === 0) {
          // Emerald particle
          grad.addColorStop(0, `rgba(52, 211, 153, ${finalAlpha})`);
          grad.addColorStop(0.4, `rgba(16, 185, 129, ${finalAlpha * 0.6})`);
          grad.addColorStop(1, `rgba(5, 150, 105, 0)`);
        } else {
          // Amber particle
          grad.addColorStop(0, `rgba(251, 191, 36, ${finalAlpha})`);
          grad.addColorStop(0.4, `rgba(245, 158, 11, ${finalAlpha * 0.6})`);
          grad.addColorStop(1, `rgba(217, 119, 6, 0)`);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Inner bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle =
          p.hue === 0
            ? `rgba(167, 243, 208, ${finalAlpha})`
            : `rgba(253, 230, 138, ${finalAlpha})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [converge, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[2] pointer-events-none"
    />
  );
}
