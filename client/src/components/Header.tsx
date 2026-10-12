"use client";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "Animeverse",
  subtitle = "ACM USAR",
}: HeaderProps) {
  const handleLogoClick = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("open-admin-portal"));
  };

  return (
    <header className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 shadow-2xl shadow-purple-500/10">
      <div className="flex justify-between items-center">
        {/* Real Anime Animated Title */}
        <div className="relative group cursor-default select-none flex flex-col justify-center">
          {/* Katakana badge with anime spark & ki energy */}
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-cyan-400/90 group-hover:text-cyan-300 transition-colors">
            <span className="inline-block text-rose-400 animate-anime-spark text-[9px]">✦</span>
            <span className="font-mono tracking-[0.22em] drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">
              アニメバース
            </span>
            <span className="inline-block text-amber-300 animate-anime-spark text-[9px]">⚡</span>
          </div>

          {/* Main ANIMEVERSE title with aura, katana light blade slice, and hover ki burst */}
          <div className="relative overflow-hidden inline-block pr-1">
            <h1 className="text-xl sm:text-2xl font-black italic tracking-wider sm:tracking-widest uppercase bg-gradient-to-r from-rose-500 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent animate-anime-gradient animate-anime-glow transition-all duration-300 group-hover:from-amber-300 group-hover:via-rose-400 group-hover:to-cyan-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_20px_rgba(244,63,94,1)]">
              {title}
            </h1>

            {/* Katana light slash sheen sweeping across */}
            <span className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none animate-katana-slash" />
          </div>
        </div>
        {/* Admin Portal Button */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 rounded px-2.5 py-1 text-sm tracking-wide"
          aria-label="ACM USAR Admin Portal"
        >
          {subtitle}
        </button>
      </div>
    </header>
  );
}
