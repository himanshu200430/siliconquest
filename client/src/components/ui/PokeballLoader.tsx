"use client";

import React from "react";

interface PokeballLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  sublabel?: string;
  tier?: "Common" | "Rare" | "Legendary" | "default";
  variant?: "fullscreen" | "inline";
}

export const PokeballLoader: React.FC<PokeballLoaderProps> = ({
  size = "md",
  label = "Loading AR Scanner...",
  sublabel,
  tier = "default",
  variant = "inline",
}) => {
  // Dimension mappings
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-20 h-20",
    xl: "w-28 h-28",
  };

  const buttonDimensions = {
    sm: "w-2.5 h-2.5",
    md: "w-4 h-4",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const innerLedDimensions = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2.5 h-2.5",
    xl: "w-3.5 h-3.5",
  };

  // Color schemes based on tier
  const tierColors = {
    default: {
      top: "from-red-500 via-red-600 to-rose-700",
      led: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
      pulse: "border-red-500/40 bg-red-500/10",
      text: "text-red-400",
      subtext: "text-slate-400",
    },
    Common: {
      top: "from-emerald-500 via-emerald-600 to-teal-700",
      led: "bg-emerald-300 shadow-[0_0_12px_#34d399]",
      pulse: "border-emerald-500/40 bg-emerald-500/10",
      text: "text-emerald-400",
      subtext: "text-emerald-300/70",
    },
    Rare: {
      top: "from-blue-500 via-indigo-600 to-cyan-700",
      led: "bg-cyan-300 shadow-[0_0_12px_#38bdf8]",
      pulse: "border-cyan-500/40 bg-cyan-500/10",
      text: "text-cyan-400",
      subtext: "text-cyan-300/70",
    },
    Legendary: {
      top: "from-amber-400 via-yellow-500 to-purple-800",
      led: "bg-amber-300 shadow-[0_0_12px_#fbbf24]",
      pulse: "border-amber-500/40 bg-amber-500/10",
      text: "text-amber-400",
      subtext: "text-amber-300/70",
    },
  };

  const currentTheme = tierColors[tier] || tierColors.default;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 select-none animate-fadeIn">
      {/* Pokeball 3D Container */}
      <div className="relative flex items-center justify-center">
        {/* Outward pulsing energy ripples (Movie capture shockwave) */}
        <div
          className={`absolute -inset-3 rounded-full border border-dashed ${currentTheme.pulse} animate-ping opacity-60 pointer-events-none`}
        />
        <div
          className={`absolute -inset-6 rounded-full border border-dashed ${currentTheme.pulse} animate-pulse opacity-40 pointer-events-none`}
        />

        {/* 3D Animated Pokeball Sphere */}
        <div
          className={`relative ${dimensions[size]} rounded-full overflow-hidden border-2 border-slate-900 shadow-2xl shadow-black/80 animate-[pokeball-rock_2s_ease-in-out_infinite] transition-transform duration-300`}
          style={{
            boxShadow:
              "inset -4px -4px 8px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(255,255,255,0.3), 0 10px 25px -5px rgba(0,0,0,0.8)",
          }}
        >
          {/* Top Hemisphere */}
          <div
            className={`w-full h-1/2 bg-gradient-to-b ${currentTheme.top} relative`}
          >
            {/* Glossy specular highlight reflection */}
            <div className="absolute top-1 left-2 right-2 h-2/5 bg-gradient-to-b from-white/45 to-transparent rounded-t-full pointer-events-none" />
          </div>

          {/* Dividing Center Belt */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[18%] bg-slate-950 border-y border-slate-800/80 z-10" />

          {/* Bottom Hemisphere */}
          <div className="w-full h-1/2 bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 relative">
            {/* Ambient sphere shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Center Release Button */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${buttonDimensions[size]} rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center z-20 shadow-md`}
          >
            {/* Chrome Button Ring */}
            <div className="w-3/4 h-3/4 rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center shadow-inner">
              {/* LED Laser Indicator Core */}
              <div
                className={`${innerLedDimensions[size]} rounded-full ${currentTheme.led} animate-pulse`}
              />
            </div>
          </div>
        </div>

        {/* Floor Shadow */}
        <div className="absolute -bottom-2 w-3/4 h-2 bg-black/50 blur-sm rounded-[100%] pointer-events-none" />
      </div>

      {/* Futuristic HUD Labels */}
      {(label || sublabel) && (
        <div className="text-center px-4 max-w-xs">
          {label && (
            <p
              className={`font-mono text-sm tracking-wider uppercase font-bold ${currentTheme.text} drop-shadow-md flex items-center justify-center gap-1.5`}
            >
              <span>{label}</span>
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
              </span>
            </p>
          )}
          {sublabel && (
            <p className={`text-xs mt-1 font-mono ${currentTheme.subtext}`}>
              {sublabel}
            </p>
          )}
        </div>
      )}

      {/* Injected Keyframes for authentic Pokeball rocking */}
      <style jsx global>{`
        @keyframes pokeball-rock {
          0%,
          100% {
            transform: rotate(0deg) translateY(0);
          }
          15% {
            transform: rotate(-18deg) translateX(-2px) translateY(-1px);
          }
          30% {
            transform: rotate(18deg) translateX(2px) translateY(-1px);
          }
          45% {
            transform: rotate(-10deg) translateX(-1px);
          }
          60% {
            transform: rotate(10deg) translateX(1px);
          }
          75% {
            transform: rotate(0deg) translateY(0);
          }
        }
      `}</style>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};
