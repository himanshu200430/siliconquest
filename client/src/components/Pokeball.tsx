"use client";

interface PokeballProps {
  onClick: () => void;
  isExploding: boolean;
}

export default function Pokeball({ onClick, isExploding }: PokeballProps) {
  return (
    <div className="flex justify-center mb-6">
      <div
        className={`relative w-24 h-24 group cursor-pointer ${
          isExploding ? "animate-explode" : ""
        }`}
        onClick={onClick}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl transition-opacity duration-300 ${
            isExploding
              ? "opacity-100 animate-pulse-fast"
              : "opacity-50 group-hover:opacity-75"
          }`}
        ></div>
        <div
          className={`relative w-24 h-24 border-4 border-purple-400 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 transition-transform duration-300 ${
            isExploding ? "scale-150 opacity-0" : "group-hover:scale-110"
          }`}
        >
          <div className="absolute w-full h-0.5 bg-purple-400"></div>
          <div
            className={`w-8 h-8 border-4 border-purple-400 rounded-full bg-gradient-to-br from-slate-900 to-purple-900 z-10 transition-transform duration-500 ${
              isExploding ? "rotate-360" : "group-hover:rotate-180"
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}
