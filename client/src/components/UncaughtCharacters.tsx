"use client";

import { useEffect, useState, useCallback } from "react";
import { getUncaughtCards } from "@/services/firestore";
import { getImageSrc, shouldDisplayAsText } from "@/utils/imageUtils";
import type { Card } from "@/types";

interface UncaughtCharactersProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export default function UncaughtCharacters({
  isOpen,
  onClose,
  onCountChange,
}: UncaughtCharactersProps) {
  const [uncaughtCards, setUncaughtCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUncaughtCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cards = await getUncaughtCards();
      setUncaughtCards(cards);
      onCountChange?.(cards.length);
    } catch (err) {
      console.error("Error fetching uncaught cards:", err);
      setError("Failed to load uncaught characters");
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchUncaughtCards();
    }
  }, [isOpen, fetchUncaughtCards]);

  const getTierColor = (tier?: string) => {
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

  const getTierBorder = (tier?: string) => {
    switch (tier) {
      case "Legendary":
        return "border-amber-400 shadow-amber-500/30";
      case "Rare":
        return "border-purple-400 shadow-purple-500/30";
      case "Common":
        return "border-slate-400 shadow-slate-500/30";
      default:
        return "border-slate-400 shadow-slate-500/30";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-8 md:py-12 animate-fadeIn z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md border-2 border-purple-500/50 rounded-3xl w-full max-w-2xl sm:p-6 p-4 shadow-2xl shadow-purple-500/30 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Characters Left to Hunt
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-purple-300">Loading characters...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchUncaughtCards}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : uncaughtCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-purple-300 text-lg font-semibold">
                All characters have been caught!
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Amazing work, hunters!
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {uncaughtCards.map((card) => {
                const imageSrc = getImageSrc(card.image);
                const displayAsText = shouldDisplayAsText(card.image);

                return (
                  <div
                    key={card.id}
                    className={`flex-shrink-0 w-40 sm:w-48 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-2 ${getTierBorder(
                      card.tier
                    )} rounded-2xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg`}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Character Image/Emoji */}
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mb-3 border border-purple-500/30 overflow-hidden">
                        {imageSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageSrc}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            draggable={false}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = displayAsText
                                  ? `<span class="text-4xl">${card.image?.trim()}</span>`
                                  : '<span class="text-4xl">❓</span>';
                              }
                            }}
                          />
                        ) : displayAsText ? (
                          <span className="text-4xl">{card.image?.trim()}</span>
                        ) : (
                          <span className="text-4xl">❓</span>
                        )}
                      </div>

                      {/* Character Name */}
                      <h3 className="text-sm font-semibold text-purple-300 mb-2 truncate w-full">
                        {card.name}
                      </h3>

                      {/* Tier Badge */}
                      {card.tier && (
                        <div
                          className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(
                            card.tier
                          )} text-white text-xs font-bold mb-2`}
                        >
                          {card.tier}
                        </div>
                      )}

                      {/* Value */}
                      <div className="text-amber-400 font-bold text-sm">
                        {card.value} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && uncaughtCards.length > 0 && (
          <div className="mt-6 pt-4 border-t border-purple-500/30">
            <p className="text-center text-purple-300 text-sm">
              <span className="font-bold text-amber-400">
                {uncaughtCards.length}
              </span>{" "}
              character{uncaughtCards.length !== 1 ? "s" : ""} waiting to be
              discovered
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
