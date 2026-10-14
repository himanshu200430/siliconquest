"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete?: () => void;
  isReady?: boolean;
}

export default function SplashScreen({ onComplete, isReady = false }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"idle" | "eyebrow" | "title" | "tagline" | "progress" | "fadeout" | "done">("idle");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setPrefersReducedMotion(true);
      setStage("done");
      if (onComplete) onComplete();
      return;
    }

    setMounted(true);
    setStage("eyebrow");

    // Timed entrance sequence
    const t1 = setTimeout(() => setStage("title"), 400);
    const t2 = setTimeout(() => setStage("tagline"), 1100);
    const t3 = setTimeout(() => setStage("progress"), 1600);
    const t4 = setTimeout(() => setStage("fadeout"), 2500);
    const t5 = setTimeout(() => {
      setStage("done");
      if (onComplete) onComplete();
    }, 2900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  // If initial content signals ready and we're past title stage, allow graceful completion
  useEffect(() => {
    if (isReady && (stage === "tagline" || stage === "progress")) {
      const exitTimer = setTimeout(() => {
        setStage("fadeout");
        setTimeout(() => {
          setStage("done");
          if (onComplete) onComplete();
        }, 400);
      }, 500);
      return () => clearTimeout(exitTimer);
    }
  }, [isReady, stage, onComplete]);

  if (prefersReducedMotion || stage === "done" || !mounted) {
    return null;
  }

  const isFadingOut = stage === "fadeout";

  return (
    <aside
      aria-label="Event Introduction"
      aria-hidden={isFadingOut ? "true" : "false"}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d0d10] px-4 select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Soft red/orange radial glow backdrop */}
      <div
        className="absolute w-[min(500px,90vw)] h-[min(500px,90vw)] rounded-full pointer-events-none blur-[100px] opacity-40 transition-opacity duration-1000"
        style={{
          background: "radial-gradient(circle, rgba(239,68,68,0.45) 0%, rgba(249,115,22,0.2) 45%, transparent 75%)",
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Eyebrow: Silicon Quest presents */}
        <p
          className={`text-[clamp(11px,3vw,13px)] font-semibold uppercase tracking-[0.28em] text-[#e8b84b] transition-all duration-700 ease-out ${
            stage === "idle"
              ? "opacity-0 translate-y-3"
              : "opacity-100 translate-y-0"
          }`}
        >
          Silicon Quest presents
        </p>

        {/* Big Brand Title: Animeverse */}
        <h1
          className={`mt-2 font-black tracking-tight text-white transition-all duration-700 ease-out ${
            stage === "idle" || stage === "eyebrow"
              ? "opacity-0 scale-90 translate-y-4"
              : "opacity-100 scale-100 translate-y-0"
          }`}
          style={{
            fontSize: "clamp(2.75rem, 10vw, 4.5rem)",
            lineHeight: 1.05,
            textShadow:
              "0 0 20px rgba(239, 68, 68, 0.4), 0 0 45px rgba(220, 38, 38, 0.25), 0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          Animeverse
        </h1>

        {/* Tagline */}
        <p
          className={`mt-3 text-[clamp(13px,3.5vw,16px)] italic font-light tracking-wide text-neutral-300 transition-all duration-700 ease-out ${
            stage === "idle" || stage === "eyebrow" || stage === "title"
              ? "opacity-0 translate-y-2"
              : "opacity-100 translate-y-0"
          }`}
        >
          &ldquo;more than an anime event, it&apos;s a universe.&rdquo;
        </p>

        {/* Subtle Event Host Credit */}
        <div
          className={`mt-4 flex items-center justify-center gap-2 text-[clamp(10px,2.5vw,11px)] text-neutral-400 font-medium tracking-wider uppercase transition-opacity duration-700 ${
            stage === "idle" || stage === "eyebrow" || stage === "title"
              ? "opacity-0"
              : "opacity-80"
          }`}
        >
          <span>Presented by ACM</span>
          <span className="text-neutral-600">•</span>
          <span>USAR</span>
        </div>

        {/* Progress Bar Container */}
        <div
          className={`mt-8 w-44 sm:w-56 h-[3px] bg-neutral-800/80 rounded-full overflow-hidden transition-opacity duration-500 ${
            stage === "progress" || stage === "fadeout"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-all ease-linear"
            style={{
              width: stage === "progress" || stage === "fadeout" ? "100%" : "0%",
              transitionDuration: "900ms",
            }}
          />
        </div>
      </div>
    </aside>
  );
}
