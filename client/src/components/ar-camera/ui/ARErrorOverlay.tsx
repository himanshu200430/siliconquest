interface ARErrorOverlayProps {
  message: string;
  onClose: () => void;
}

export const ARErrorOverlay = ({ message, onClose }: ARErrorOverlayProps) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-4 p-6 text-center">
    <p className="text-red-400 text-base font-semibold">{message}</p>
    <button
      onClick={onClose}
      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
    >
      Go Back
    </button>
  </div>
);
