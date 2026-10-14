"use client";

import { useEffect, useState, useRef } from "react";

export default function ScrollNav() {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setPrefersReducedMotion(true);
    }

    const onScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const pastHero = window.scrollY > 120;
          setIsVisible(pastHero);
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Check initial scroll position
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <nav
      aria-label="Quick Navigation"
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b border-neutral-800/80 bg-[#0d0d10]/85 backdrop-blur-md shadow-lg shadow-black/40 ${
        prefersReducedMotion
          ? isVisible
            ? "block"
            : "hidden"
          : `transition-all duration-300 ease-out ${
              isVisible
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "-translate-y-full opacity-0 pointer-events-none"
            }`
      }`}
    >
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        {/* Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => handleNavClick(e, "top")}
          className="flex items-center gap-2 group focus:outline-none"
        >
          <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white group-hover:text-red-400 transition-colors">
            Anime<span className="text-red-500">verse</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-neutral-400 px-2 py-0.5 rounded bg-neutral-800/70 border border-neutral-700/50">
            ACM
          </span>
        </a>

        {/* Navigation Anchor Links */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
          <a
            href="#rounds"
            onClick={(e) => handleNavClick(e, "rounds")}
            className="text-neutral-300 hover:text-white transition-colors"
          >
            Rounds
          </a>
          <a
            href="#prizes"
            onClick={(e) => handleNavClick(e, "prizes")}
            className="text-neutral-300 hover:text-white transition-colors"
          >
            Prizes
          </a>
          <a
            href="#hunt"
            onClick={(e) => handleNavClick(e, "hunt")}
            className="text-neutral-300 hover:text-white transition-colors"
          >
            Hunt
          </a>
          <a
            href="#register"
            onClick={(e) => handleNavClick(e, "register")}
            className="relative px-3.5 py-1.5 rounded-full font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-sm shadow-red-600/30 transition-all hover:scale-105"
          >
            Register
          </a>
        </div>
      </div>
    </nav>
  );
}
