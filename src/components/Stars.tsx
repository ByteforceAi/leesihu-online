import { useMemo } from "react";

export default function Stars() {
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 60}%`,
      size: Math.random() * 2.5 + 1,
      delay: `${Math.random() * 3}s`,
      duration: `${Math.random() * 2 + 2}s`,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: `radial-gradient(circle, rgba(52,211,153,0.9) 0%, rgba(251,191,36,0.4) 60%, transparent 100%)`,
            animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
}
