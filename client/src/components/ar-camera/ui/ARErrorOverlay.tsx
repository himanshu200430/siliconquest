interface ARErrorOverlayProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ARErrorOverlay = ({ message, onClose, onRetry }: ARErrorOverlayProps) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md gap-4 p-6 text-center z-[70] pointer-events-auto">
    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-3xl mb-2">
      📷
    </div>
    <h3 className="text-lg font-bold text-white">Camera Access Issue</h3>
    <p className="text-red-300 text-sm max-w-sm leading-relaxed">{message}</p>
    <div className="flex gap-3 mt-4">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25"
        >
          Try Again
        </button>
      )}
      <button
        onClick={onClose}
        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700"
      >
        Go Back
      </button>
    </div>
  </div>
);
