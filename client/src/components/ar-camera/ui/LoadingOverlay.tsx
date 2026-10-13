import { PokeballLoader } from "@/components/ui/PokeballLoader";

interface LoadingOverlayProps {
  label?: string;
  sublabel?: string;
  tier?: "Common" | "Rare" | "Legendary" | "default";
  isCameraLive?: boolean;
}

export const LoadingOverlay = ({
  label = "INITIALIZING POKÉBALL SCANNER",
  sublabel = "Calibrating AR Camera & Neural Target Sensors...",
  tier = "default",
  isCameraLive = false,
}: LoadingOverlayProps) => (
  <div
    className={`absolute inset-0 z-[60] flex flex-col items-center justify-center transition-all duration-300 ${
      isCameraLive
        ? "bg-slate-950/40 backdrop-blur-[2px]"
        : "bg-slate-950/95 backdrop-blur-md"
    }`}
  >
    <PokeballLoader
      size="lg"
      label={isCameraLive ? "SYNCHRONIZING TARGET DESCRIPTORS..." : label}
      sublabel={isCameraLive ? "Camera feed active • Lock onto card to scan" : sublabel}
      tier={tier}
    />
  </div>
);
