"use client";

import { useEffect, useRef, useState } from "react";

// 16 purely decorative SVG petal particles with varied paths, positions, and durations
const PETALS = [
  { id: 1, left: "8%", size: 14, delay: 0, duration: 8.5, drift: 28, rotate: 180, opacity: 0.65 },
  { id: 2, left: "18%", size: 11, delay: 2.2, duration: 9.8, drift: -24, rotate: 320, opacity: 0.5 },
  { id: 3, left: "27%", size: 16, delay: 4.1, duration: 7.9, drift: 35, rotate: 240, opacity: 0.75 },
  { id: 4, left: "38%", size: 12, delay: 1.5, duration: 10.5, drift: -30, rotate: 160, opacity: 0.6 },
  { id: 5, left: "46%", size: 15, delay: 3.3, duration: 8.2, drift: 22, rotate: 280, opacity: 0.7 },
  { id: 6, left: "55%", size: 10, delay: 5.6, duration: 11.2, drift: -26, rotate: 210, opacity: 0.45 },
  { id: 7, left: "64%", size: 17, delay: 0.8, duration: 9.1, drift: 38, rotate: 340, opacity: 0.8 },
  { id: 8, left: "73%", size: 13, delay: 2.9, duration: 8.8, drift: -32, rotate: 190, opacity: 0.65 },
  { id: 9, left: "82%", size: 15, delay: 4.7, duration: 10.1, drift: 25, rotate: 270, opacity: 0.7 },
  { id: 10, left: "91%", size: 12, delay: 1.8, duration: 9.4, drift: -28, rotate: 310, opacity: 0.55 },
  { id: 11, left: "14%", size: 13, delay: 6.2, duration: 8.6, drift: 30, rotate: 220, opacity: 0.6 },
  { id: 12, left: "32%", size: 16, delay: 7.1, duration: 9.6, drift: -35, rotate: 170, opacity: 0.75 },
  { id: 13, left: "50%", size: 11, delay: 6.8, duration: 10.8, drift: 20, rotate: 290, opacity: 0.5 },
  { id: 14, left: "68%", size: 14, delay: 5.2, duration: 8.4, drift: -25, rotate: 230, opacity: 0.7 },
  { id: 15, left: "86%", size: 15, delay: 7.5, duration: 9.2, drift: 34, rotate: 330, opacity: 0.65 },
  { id: 16, left: "4%", size: 12, delay: 3.9, duration: 10.3, drift: -20, rotate: 150, opacity: 0.5 },
];

export default function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setPrefersReducedMotion(true);
      return;
    }

    const currentEl = containerRef.current;
    if (!currentEl) return;

    // Pause animation when hero leaves viewport to conserve CPU/battery
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(currentEl);

    return () => {
      if (currentEl) observer.unobserve(currentEl);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
    >
      {/* 1. Subtle, original vector Torii Gate outline silhouette sitting low in hero background */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(380px,92vw)] opacity-15 text-red-500">
        <svg
          viewBox="0 0 240 180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-auto drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        >
          {/* Top Kasagi roof beam with curved ends */}
          <path d="M 10 32 Q 120 18 230 32 L 235 42 Q 120 28 5 42 Z" fill="currentColor" fillOpacity="0.25" />
          {/* Secondary Shimaki beam */}
          <path d="M 24 50 L 216 50 L 214 58 L 26 58 Z" fill="currentColor" fillOpacity="0.2" />
          {/* Main vertical Hashira pillars */}
          <rect x="52" y="58" width="12" height="118" rx="2" fill="currentColor" fillOpacity="0.2" />
          <rect x="176" y="58" width="12" height="118" rx="2" fill="currentColor" fillOpacity="0.2" />
          {/* Pillar base plinths (Kamebara) */}
          <rect x="48" y="168" width="20" height="8" rx="1.5" fill="currentColor" fillOpacity="0.3" />
          <rect x="172" y="168" width="20" height="8" rx="1.5" fill="currentColor" fillOpacity="0.3" />
          {/* Nuki horizontal tie beam */}
          <rect x="36" y="82" width="168" height="7" rx="1.5" fill="currentColor" fillOpacity="0.25" />
          {/* Central Gakuzuka tablet tie */}
          <rect x="114" y="58" width="12" height="24" rx="1" fill="currentColor" fillOpacity="0.3" />
        </svg>
      </div>

      {/* 2. Soft atmospheric sun/glow disc */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(420px,85vw)] h-[min(420px,85vw)] rounded-full blur-[90px] opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, rgba(249, 115, 22, 0.2) 50%, transparent 75%)",
        }}
      />

      {/* 3. Falling Sakura Petals (omitted on reduced-motion, paused when out of view) */}
      {!prefersReducedMotion && isInView && (
        <div className="absolute inset-0">
          <style jsx>{`
            @keyframes sakuraFall {
              0% {
                transform: translateY(-20px) translateX(0) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 0.8;
              }
              100% {
                transform: translateY(115vh) translateX(var(--drift)) rotate(var(--rot));
                opacity: 0;
              }
            }

            .sakura-petal {
              position: absolute;
              top: -20px;
              will-change: transform;
              animation-name: sakuraFall;
              animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
              animation-iteration-count: infinite;
            }
          `}</style>

          {PETALS.map((petal) => (
            <div
              key={petal.id}
              className="sakura-petal"
              style={
                {
                  left: petal.left,
                  width: `${petal.size}px`,
                  height: `${petal.size * 1.3}px`,
                  animationDuration: `${petal.duration}s`,
                  animationDelay: `${petal.delay}s`,
                  "--drift": `${petal.drift}px`,
                  "--rot": `${petal.rotate}deg`,
                  opacity: petal.opacity,
                } as React.CSSProperties
              }
            >
              {/* Sakura petal curved SVG shape */}
              <svg
                viewBox="0 0 24 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_1px_3px_rgba(244,114,182,0.35)]"
              >
                <path
                  d="M12 0C7 0 0 8 0 18C0 26 5 32 12 32C19 32 24 26 24 18C24 8 17 0 12 0Z"
                  fill="url(#petalGradient)"
                />
                <path
                  d="M12 2C8 4 4 10 4 18"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="0.75"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity="0.65" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
