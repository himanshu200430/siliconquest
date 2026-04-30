import { useState, useEffect } from "react";
import { formatCooldownTime } from "@/utils/quizCooldown";
import { getImageSrc, shouldDisplayAsText } from "@/utils/imageUtils";
import { Character, getTierFromValue } from "../types";
import {
  getTierColor,
  getTierThemeColor,
  getTierButtonGradient,
} from "../utils/tierStyles";

interface DetectedCharacterOverlayProps {
  character: Character;
  onCollect: () => void;
  isCaught: boolean;
  cooldownSeconds?: number | null;
}

export const DetectedCharacterOverlay = ({
  character,
  onCollect,
  isCaught,
  cooldownSeconds = null,
}: DetectedCharacterOverlayProps) => {
  const tier = character.tier || getTierFromValue(character.value);
  const themeColor = getTierThemeColor(tier);
  const isLegendary = tier === "Legendary";

  const [isExpanded, setIsExpanded] = useState(!isLegendary);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-expand legendary cards after 5 seconds
  useEffect(() => {
    if (isLegendary) {
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isLegendary]);

  const imageSrc = getImageSrc(character.image);
  const displayAsText = shouldDisplayAsText(character.image);
  const hasContent = imageSrc || displayAsText;

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Compact view for legendary characters (first 5 seconds) OR when manually minimized
  if ((isLegendary && !isExpanded) || isMinimized) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 z-40">
        <div
          className={`relative bg-slate-900/60 backdrop-blur-md border-2 border-${themeColor.primary}/70 rounded-2xl px-8 py-4 shadow-2xl shadow-${themeColor.glow} animate-scaleIn transition-all duration-500`}
        >
          {/* Expand button - only show if manually minimized */}
          {isMinimized && (
            <button
              onClick={toggleMinimize}
              className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center border-2 border-slate-600 transition-all duration-200 z-10"
              aria-label="Expand"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          <button
            onClick={onCollect}
            disabled={
              isCaught || (cooldownSeconds !== null && cooldownSeconds > 0)
            }
            className={`py-3 px-8 font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
              isCaught || (cooldownSeconds !== null && cooldownSeconds > 0)
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : `${getTierButtonGradient(tier)} text-white`
            }`}
          >
            {isCaught
              ? "Already Caught"
              : cooldownSeconds && cooldownSeconds > 0
              ? `Cooldown: ${formatCooldownTime(cooldownSeconds)}`
              : "Collect Character"}
          </button>
        </div>
      </div>
    );
  }

  // Full view (for Common/Rare always, and Legendary after 5 seconds)
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-40">
      <div
        className={`relative bg-slate-900/30 backdrop-blur-md border-2 border-${
          themeColor.primary
        }/70 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-${
          themeColor.glow
        } ${isLegendary ? "animate-expandIn" : "animate-scaleIn"}`}
      >
        {/* Minimize button */}
        <button
          onClick={toggleMinimize}
          className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center border-2 border-slate-600 transition-all duration-200 z-10"
          aria-label="Minimize"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <span
          className={`absolute top-2.5 z-[100] left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r ${getTierColor(
            tier
          )} text-white text-xs font-bold shadow-lg`}
        >
          {tier}
        </span>
        <div className="flex flex-col items-center gap-4">
          {hasContent ? (
            <div
              className={`relative w-48 h-64 rounded-2xl overflow-hidden border-2 border-${themeColor.primary}/40 shadow-lg shadow-${themeColor.glow} bg-slate-800/80 flex items-center justify-center`}
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={character.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = "none";
                    const textSpan = e.currentTarget.nextElementSibling;
                    if (
                      textSpan &&
                      textSpan.classList.contains("fallback-text")
                    ) {
                      textSpan.classList.remove("hidden");
                    }
                  }}
                />
              ) : null}
              {displayAsText && (
                <span
                  className={`text-6xl ${
                    imageSrc ? "hidden fallback-text" : ""
                  }`}
                  aria-hidden="true"
                >
                  {character.image?.trim()}
                </span>
              )}
            </div>
          ) : (
            <div
              className={`relative w-48 h-64 rounded-2xl border-2 border-dashed border-${themeColor.primary}/40 bg-slate-800/60 flex items-center justify-center text-${themeColor.primary} text-sm text-center px-6`}
            >
              Card art coming soon
              <span
                className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r ${getTierColor(
                  tier
                )} text-white text-xs font-bold shadow-lg`}
              >
                {tier}
              </span>
            </div>
          )}

          <div className="text-center">
            <h3
              className={`text-2xl font-extrabold text-${themeColor.primary} drop-shadow mb-2`}
            >
              {character.name}
            </h3>
            <p className={`text-${themeColor.primary} text-sm`}>
              {isCaught
                ? "Already caught!"
                : cooldownSeconds && cooldownSeconds > 0
                ? "On cooldown"
                : "Character detected!"}
            </p>
            {isCaught && character.caughtByTeam && (
              <p className="text-slate-400 text-xs mt-1">
                Caught by: {character.caughtByTeam}
              </p>
            )}
            {!isCaught && cooldownSeconds && cooldownSeconds > 0 && (
              <p className="text-amber-400 text-sm font-bold mt-2 animate-pulse">
                Wait {formatCooldownTime(cooldownSeconds)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onCollect}
          disabled={
            isCaught || (cooldownSeconds !== null && cooldownSeconds > 0)
          }
          className={`mt-6 w-full py-3 font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
            isCaught || (cooldownSeconds !== null && cooldownSeconds > 0)
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : `${getTierButtonGradient(tier)} text-white`
          }`}
        >
          {isCaught
            ? "Already Caught"
            : cooldownSeconds && cooldownSeconds > 0
            ? `Cooldown: ${formatCooldownTime(cooldownSeconds)}`
            : "Collect Character"}
        </button>
      </div>
    </div>
  );
};
