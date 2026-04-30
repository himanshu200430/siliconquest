export const getTierColor = (tier: string) => {
  switch (tier) {
    case "Legendary":
      return "from-amber-400 to-orange-500";
    case "Rare":
      return "from-purple-400 to-pink-500";
    case "Common":
      return "from-slate-400 to-slate-500";
    default:
      return "from-slate-400 to-slate-500";
  }
};

export const getTierBorder = (tier: string) => {
  switch (tier) {
    case "Legendary":
      return "border-amber-400 shadow-amber-500/50";
    case "Rare":
      return "border-purple-400 shadow-purple-500/50";
    case "Common":
      return "border-slate-400 shadow-slate-500/50";
    default:
      return "border-slate-400 shadow-slate-500/50";
  }
};

export const getTierFrameColor = (tier: string): string => {
  switch (tier) {
    case "Legendary":
      return "#FFD700"; // Golden
    case "Rare":
      return "#C0C0C0"; // Silver
    case "Common":
      return "#8b5cf6"; // Purple
    default:
      return "#8b5cf6";
  }
};

export const getTierThemeColor = (tier: string) => {
  switch (tier) {
    case "Legendary":
      return {
        primary: "amber-400",
        secondary: "orange-500",
        glow: "amber-500/50",
        hex: "#FFD700",
      };
    case "Rare":
      return {
        primary: "gray-300",
        secondary: "gray-400",
        glow: "gray-400/50",
        hex: "#C0C0C0",
      };
    case "Common":
      return {
        primary: "purple-400",
        secondary: "purple-500",
        glow: "purple-500/50",
        hex: "#8b5cf6",
      };
    default:
      return {
        primary: "purple-400",
        secondary: "purple-500",
        glow: "purple-500/50",
        hex: "#8b5cf6",
      };
  }
};

export const getTierButtonGradient = (tier: string): string => {
  switch (tier) {
    case "Legendary":
      return "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600";
    case "Rare":
      return "bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500";
    case "Common":
      return "bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600";
    default:
      return "bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600";
  }
};
