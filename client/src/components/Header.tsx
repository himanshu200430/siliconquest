"use client";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "Animeverse",
  subtitle = "ACM USAR",
}: HeaderProps) {
  const handleSubtitleClick = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("open-admin-portal"));
  };

  return (
    <header className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 shadow-2xl shadow-purple-500/10">
      <div className="flex justify-between items-center text-sm">
        <span className="text-purple-300 font-semibold tracking-wide">
          {title}
        </span>
        <button
          type="button"
          onClick={handleSubtitleClick}
          className="text-blue-700 font-bold hover:text-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
        >
          {subtitle}
        </button>
      </div>
    </header>
  );
}
