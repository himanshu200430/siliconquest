interface ScanHintProps {
  visible: boolean;
}

export const ScanHint = ({ visible }: ScanHintProps) => {
  if (!visible) return null;

  return (
    <div className="absolute bottom-24 left-0 right-0 text-center animate-pulse z-30">
      <p className="text-purple-300 text-sm font-medium">
        Point your camera at a character poster
      </p>
      <p className="text-slate-400 text-xs mt-1">Scanning for characters...</p>
    </div>
  );
};
