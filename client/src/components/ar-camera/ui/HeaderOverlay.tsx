interface HeaderOverlayProps {
  teamName: string;
  onClose: () => void;
  mindFiles?: Array<{ value: string; label: string }>;
  activeMindFile?: string | null;
  onMindFileChange?: (value: string) => void;
}

export const HeaderOverlay = ({
  teamName,
  onClose,
  mindFiles,
  activeMindFile,
  onMindFileChange,
}: HeaderOverlayProps) => (
  <>
    {/* Close button with highest z-index to stay above all modals */}
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all z-[60] shadow-lg"
      aria-label="Close AR camera"
    >
      ✕
    </button>

    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="pointer-events-auto">
            <h2 className="text-white font-bold text-lg">Hunt is On!!</h2>
            <p className="text-purple-300 text-sm">Team: {teamName}</p>
          </div>
          {/* Space for close button */}
          <div className="w-10 h-10"></div>
        </div>

        {mindFiles && mindFiles.length > 1 && onMindFileChange && (
          <div className="flex flex-col gap-1 pointer-events-auto">
            <span className="text-xs uppercase tracking-wider text-slate-300/80">
              Target file
            </span>
            <div className="flex flex-wrap gap-2">
              {mindFiles.map((option) => {
                const isActive = option.value === activeMindFile;
                return (
                  <button
                    key={option.value}
                    onClick={() => onMindFileChange(option.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      isActive
                        ? "bg-purple-600/80 border-purple-400 text-white shadow-lg shadow-purple-500/30"
                        : "bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700/80"
                    }`}
                  >
                    {option.label ?? option.value}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  </>
);
