"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Pokeball from "@/components/Pokeball";
import ARCamera from "@/components/ARCamera";
import Leaderboard from "@/components/Leaderboard";
import UncaughtCharacters from "@/components/UncaughtCharacters";
import {
  getTeams,
  getUncaughtCards,
  getCardsCaughtByTeam,
} from "@/services/firestore";
import { getImageSrc, shouldDisplayAsText } from "@/utils/imageUtils";
import type { Team, Card } from "@/types";

export default function Home() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [charactersCaught, setCharactersCaught] = useState<Card[]>([]);
  const [isLoadingCaught, setIsLoadingCaught] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [isPokeballExploding, setIsPokeballExploding] = useState(false);
  const [showUncaughtModal, setShowUncaughtModal] = useState(false);
  const [uncaughtCount, setUncaughtCount] = useState<number | null>(null);
  const [isLoadingUncaughtCount, setIsLoadingUncaughtCount] = useState(true);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  // Load teams from Firestore
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoadingTeams(true);
        const teamsData = await getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error loading teams:", error);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  // Load selected team from localStorage on mount
  useEffect(() => {
    const storedTeamId = localStorage.getItem("selectedTeamId");
    if (storedTeamId) {
      setSelectedTeamId(storedTeamId);
    }
  }, []);

  const fetchCaughtCharacters = useCallback(async (teamId: string) => {
    try {
      setIsLoadingCaught(true);
      const caughtCards = await getCardsCaughtByTeam(teamId);
      setCharactersCaught(caughtCards);
    } catch (error) {
      console.error("Error loading caught characters:", error);
      setCharactersCaught([]);
    } finally {
      setIsLoadingCaught(false);
    }
  }, []);

  const loadUncaughtCount = useCallback(async () => {
    try {
      setIsLoadingUncaughtCount(true);
      const cards = await getUncaughtCards();
      setUncaughtCount(cards.length);
    } catch (error) {
      console.error("Error loading uncaught characters count:", error);
    } finally {
      setIsLoadingUncaughtCount(false);
    }
  }, []);

  // Load uncaught count only once on mount
  useEffect(() => {
    loadUncaughtCount();
  }, []); // Remove loadUncaughtCount from dependencies to prevent infinite loop

  useEffect(() => {
    if (selectedTeamId) {
      fetchCaughtCharacters(selectedTeamId);
    } else {
      setCharactersCaught([]);
    }
  }, [selectedTeamId, fetchCaughtCharacters]);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    localStorage.setItem("selectedTeamId", teamId);
  };

  const handlePokeballClick = () => {
    if (!selectedTeam) return;

    setIsPokeballExploding(true);

    // Wait for explosion animation to complete, then show AR camera
    setTimeout(() => {
      setIsARActive(true);
      setIsPokeballExploding(false);
    }, 600);
  };

  const handleARClose = () => {
    setIsARActive(false);
  };

  const handleCharacterCollected = () => {
    if (selectedTeamId) {
      fetchCaughtCharacters(selectedTeamId);
    }

    setUncaughtCount((prev) =>
      typeof prev === "number" ? Math.max(prev - 1, 0) : prev
    );
  };

  // Memoized callback to prevent infinite loop in UncaughtCharacters component
  const handleUncaughtCountChange = useCallback((count: number) => {
    setUncaughtCount(count);
  }, []);

  const handleChangeTeam = () => {
    setSelectedTeamId(null);
    localStorage.removeItem("selectedTeamId");
    setCharactersCaught([]);
    setIsARActive(false);
    setTeamSearchQuery(""); // Clear search when changing team
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Filter teams based on search query
  const filteredTeams = teams.filter((team) =>
    team.teamName.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  if (isLoadingTeams) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(30, 30, 46, 0.3);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col gap-6 animate-fadeIn">
          {/* Header */}
          <Header />

          {/* Main Game Card */}
          <main className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6 shadow-2xl shadow-purple-500/20">
            {/* Title & Change Team */}
            <div className="flex items-center justify-between mb-6">
              <h1
                className={`flex-1 ${
                  selectedTeam ? "text-left" : "text-center"
                } text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight`}
              >
                {selectedTeam ? "Hunt is On!!" : "Let's start hunting"}
              </h1>
              {selectedTeam && (
                <button
                  type="button"
                  onClick={handleChangeTeam}
                  className="ml-4 whitespace-nowrap rounded-lg bg-slate-800/70 border border-purple-500/40 px-4 py-2 text-sm font-medium text-purple-200 hover:border-purple-400 hover:text-purple-100 transition-colors"
                >
                  Change Team
                </button>
              )}
            </div>

            {/* Pokeball Icon */}
            <Pokeball
              onClick={handlePokeballClick}
              isExploding={isPokeballExploding}
            />

            {/* Characters Left */}
            <div
              onClick={() => setShowUncaughtModal(true)}
              className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-purple-500/30 rounded-xl p-3 mb-6 text-center cursor-pointer hover:border-purple-500/50 hover:scale-[1.02] transition-all duration-300 group"
            >
              <p className="text-purple-300 text-sm font-medium group-hover:text-purple-200 transition-colors">
                Show character left to hunt
              </p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mt-1 group-hover:scale-105 transition-transform">
                {isLoadingUncaughtCount
                  ? "..."
                  : typeof uncaughtCount === "number"
                  ? uncaughtCount
                  : "--"}
              </p>
            </div>

            {/* Select Your Team - Only shown when no team is selected */}
            {!selectedTeam && (
              <div className="mb-6">
                <h2 className="text-purple-300 text-center font-semibold mb-4 tracking-wide">
                  Select Your Team
                </h2>
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-purple-500/30 rounded-2xl p-4">
                  {/* Search Input */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        placeholder="Search teams..."
                        className="w-full px-4 py-2.5 pl-10 bg-slate-800/70 border border-purple-500/40 rounded-xl text-purple-100 placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      {teamSearchQuery && (
                        <button
                          onClick={() => setTeamSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-purple-300 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
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
                      )}
                    </div>
                  </div>

                  {/* Teams List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                    {filteredTeams.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-purple-300 text-sm">
                          No teams found matching &quot;{teamSearchQuery}&quot;
                        </p>
                      </div>
                    ) : (
                      filteredTeams.map((team) => (
                        <div
                          key={team.id}
                          onClick={() => handleTeamSelect(team.id)}
                          className="h-12 rounded-xl border-2 border-slate-700 bg-slate-800/30 hover:border-purple-500/50 hover:bg-slate-700/30 transition-all duration-300 cursor-pointer flex items-center px-4 group"
                        >
                          <span className="text-slate-300 text-sm font-medium group-hover:text-purple-300 transition-colors">
                            {team.teamName}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Characters Caught by Selected Team - Only shown when team is selected */}
            {selectedTeam && (
              <div className="mb-6">
                <h2 className="text-purple-300 text-center font-semibold mb-3 tracking-wide text-sm">
                  Characters Caught by {selectedTeam.teamName}
                </h2>
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-purple-500/30 rounded-2xl p-4">
                  {isLoadingCaught ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-purple-300 text-sm">
                          Loading caught characters...
                        </p>
                      </div>
                    </div>
                  ) : charactersCaught.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-purple-300 text-sm font-medium">
                        No characters caught yet.
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Start hunting to collect your first character!
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      <button
                        className="flex-shrink-0 w-8 h-16 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors"
                        onClick={() => {
                          const container = document.getElementById(
                            "characters-container"
                          );
                          if (container) container.scrollLeft -= 120;
                        }}
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
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      <div
                        id="characters-container"
                        className="flex gap-3 overflow-x-auto flex-1 scrollbar-hide scroll-smooth"
                      >
                        {charactersCaught.map((character) => {
                          const imageSrc = getImageSrc(character.image);
                          const displayAsText = shouldDisplayAsText(
                            character.image
                          );

                          return (
                            <div
                              key={character.id}
                              className="flex-shrink-0 w-24 bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-purple-500/40 rounded-xl flex flex-col hover:border-purple-400 transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                              {/* Image/Emoji Container - Fixed height */}
                              <div className="h-20 w-full overflow-hidden rounded-t-xl">
                                {imageSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={imageSrc}
                                    alt={character.name}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    {displayAsText ? (
                                      <div className="text-3xl">
                                        {character.image?.trim()}
                                      </div>
                                    ) : (
                                      <div className="text-3xl">❓</div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Name Container - Fixed height */}
                              <div className="h-8 flex items-center justify-center px-2 py-1 bg-slate-900/50 rounded-b-xl border-t border-purple-500/20">
                                <div className="text-xs text-purple-200 font-medium text-center line-clamp-2 w-full">
                                  {character.name}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        className="flex-shrink-0 w-8 h-16 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors"
                        onClick={() => {
                          const container = document.getElementById(
                            "characters-container"
                          );
                          if (container) container.scrollLeft += 120;
                        }}
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <Leaderboard teams={teams} selectedTeamId={selectedTeamId} />
          </main>
        </div>
      </div>

      {/* AR Camera Overlay */}
      {isARActive && selectedTeam && (
        <ARCamera
          teamName={selectedTeam.teamName}
          teamId={selectedTeam.id}
          onClose={handleARClose}
          onCharacterCollected={handleCharacterCollected}
        />
      )}

      {/* Uncaught Characters Modal */}
      <UncaughtCharacters
        isOpen={showUncaughtModal}
        onClose={() => setShowUncaughtModal(false)}
        onCountChange={handleUncaughtCountChange}
      />
    </>
  );
}
