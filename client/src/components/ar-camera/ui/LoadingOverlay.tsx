export const LoadingOverlay = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-4">
    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-purple-300 text-sm">Loading AR engine...</p>
  </div>
);
