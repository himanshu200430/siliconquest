"use client";

import { useState } from "react";

interface PokeballProps {
  onClick: () => void;
  isExploding: boolean;
  teamName?: string;
}

export default function Pokeball({ onClick, isExploding, teamName }: PokeballProps) {
  const [isWobbling, setIsWobbling] = useState(false);

  const handleMouseEnter = () => {
    if (!isExploding) {
      setIsWobbling(true);
      setTimeout(() => setIsWobbling(false), 700);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-6 select-none">
      {/* Interactive Pokeball Button */}
      <button
        type="button"
        className="relative group cursor-pointer flex flex-col items-center justify-center focus:outline-none"
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        aria-label={teamName ? `Launch AR Pokeball Hunt for ${teamName}` : "Launch AR Pokeball Hunt"}
      >
        {/* Ambient Movie Energy Aura Glow */}
        <div
          className={`absolute -inset-4 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
            isExploding
              ? "bg-cyan-400 opacity-100 scale-150"
              : "bg-gradient-to-r from-red-500/40 via-purple-500/40 to-cyan-500/40 opacity-50 group-hover:opacity-90 group-hover:scale-125"
          }`}
        />

        {/* Floating Pod/Ball Rig */}
        <div
          className={`relative w-28 h-28 flex items-center justify-center transition-transform duration-300 ${
            !isExploding ? "animate-pokeball-float" : ""
          } ${isWobbling && !isExploding ? "animate-pokeball-wobble" : ""}`}
        >
          {/* Movie Laser Beam / Plasma Flash (Fires when opening) */}
          {isExploding && (
            <>
              {/* Central pure white/cyan laser beam burst */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 via-white to-cyan-200 z-50 animate-pokeball-beam pointer-events-none" />

              {/* Expanding plasma shockwave rings */}
              <div className="absolute inset-0 rounded-full border-4 border-cyan-300 z-40 animate-pokeball-shockwave pointer-events-none" />
              <div className="absolute inset-0 rounded-full border-2 border-white z-40 animate-pokeball-shockwave delay-100 pointer-events-none" />
            </>
          )}

          {/* Upper Dome (Top Shell - Glossy Crimson Red) */}
          <div
            className={`absolute top-0 left-0 right-0 h-14 rounded-t-full bg-gradient-to-b from-red-500 via-red-600 to-rose-900 border-t-2 border-x-2 border-red-400/60 shadow-[inset_0_4px_8px_rgba(255,255,255,0.4)] overflow-hidden transition-all z-20 ${
              isExploding ? "animate-pokeball-open-top" : "group-hover:brightness-110"
            }`}
          >
            {/* 3D Specular Curved Gloss Highlight (Movie Reflection) */}
            <div className="absolute top-1 left-4 right-4 h-5 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[1px] transform -rotate-3" />
            {/* Side rim metallic sheen */}
            <div className="absolute top-2 left-2 w-3 h-8 rounded-full bg-white/40 blur-[2px]" />
          </div>

          {/* Lower Dome (Bottom Shell - Pearlescent White) */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-14 rounded-b-full bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 border-b-2 border-x-2 border-slate-300 shadow-[inset_0_-6px_10px_rgba(0,0,0,0.35)] overflow-hidden transition-all z-20 ${
              isExploding ? "animate-pokeball-open-bottom" : "group-hover:brightness-105"
            }`}
          >
            {/* Bottom specular reflection */}
            <div className="absolute bottom-2 left-6 right-6 h-3 rounded-full bg-white/40 blur-[1px]" />
          </div>

          {/* Center Seam Band (Black Belt Ring) */}
          <div
            className={`absolute w-full h-4 bg-neutral-950 border-y-2 border-black/80 z-20 transition-opacity ${
              isExploding ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Center Release Mechanism (The Iconic Movie Trigger Button) */}
          <div
            className={`absolute w-10 h-10 rounded-full bg-neutral-900 border-4 border-neutral-950 flex items-center justify-center shadow-2xl z-30 transition-transform duration-300 ${
              isExploding ? "scale-150 opacity-0" : "group-hover:scale-115"
            }`}
          >
            {/* Outer Metal Ring */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 p-0.5 flex items-center justify-center shadow-inner">
              {/* Inner Luminous LED Core */}
              <div
                className={`w-5 h-5 rounded-full bg-white border border-slate-300 transition-all duration-300 flex items-center justify-center ${
                  isExploding
                    ? "bg-cyan-200 shadow-[0_0_25px_#38bdf8]"
                    : "group-hover:bg-cyan-100 group-hover:shadow-[0_0_15px_#38bdf8] shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                }`}
              >
                {/* Core energy dot */}
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Ground Shadow (Breathing with Float) */}
        <div
          className={`w-20 h-3 rounded-full bg-black/60 blur-sm mt-3 transition-opacity duration-300 ${
            isExploding ? "opacity-0" : "animate-pokeball-shadow"
          }`}
        />

        {/* Interactive Prompt Label */}
        <div className="mt-2 text-center">
          <span className="text-[11px] font-bold tracking-widest uppercase text-cyan-400/90 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] flex items-center gap-1.5">
            <span className="inline-block text-rose-400 animate-anime-spark text-[9px]">✦</span>
            {teamName ? `HUNT AS ${teamName}` : "SELECT A TEAM TO HUNT"}
            <span className="inline-block text-amber-300 animate-anime-spark text-[9px]">⚡</span>
          </span>
        </div>
      </button>
    </div>
  );
}
