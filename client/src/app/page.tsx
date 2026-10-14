"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Pokeball from "@/components/Pokeball";
const ARCamera = dynamic(() => import("@/components/ARCamera"), { ssr: false });
import Leaderboard from "@/components/Leaderboard";
import UncaughtCharacters from "@/components/UncaughtCharacters";
import AdminPortal from "@/components/AdminPortal";
import { PokeballLoader } from "@/components/ui/PokeballLoader";
import SplashScreen from "@/components/SplashScreen";
import ScrollNav from "@/components/ScrollNav";
import Reveal from "@/components/Reveal";
import AmbientBackground from "@/components/AmbientBackground";
import {
  getTeams,
  getUncaughtCards,
  getCardsCaughtByTeam,
} from "@/services/api";
import { usePolling } from "@/hooks/usePolling";
import { getImageSrc, shouldDisplayAsText } from "@/utils/imageUtils";
import { initCameraStreamNormalizer } from "@/components/ar-camera/utils/cameraStreamHelper";
import type { Team, Card } from "@/types";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [charactersCaught, setCharactersCaught] = useState<Card[]>([]);
  const [isLoadingCaught, setIsLoadingCaught] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [isPokeballExploding, setIsPokeballExploding] = useState(false);
  const [showUncaughtModal, setShowUncaughtModal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [uncaughtCount, setUncaughtCount] = useState<number | null>(null);
  const [isLoadingUncaughtCount, setIsLoadingUncaughtCount] = useState(true);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const fetchTeams = useCallback(async () => {
    try {
      const teamsData = await getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error("Error loading teams:", error);
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Poll leaderboard every ~10s with jitter when AR camera is NOT open
  usePolling(fetchTeams, {
    intervalMs: 10000,
    jitterMs: 3000,
    enabled: !isARActive,
  });

  // Load selected team from localStorage or default to first available team
  useEffect(() => {
    const storedTeamId = localStorage.getItem("selectedTeamId");
    if (storedTeamId) {
      setSelectedTeamId(storedTeamId);
    } else if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
      localStorage.setItem("selectedTeamId", teams[0].id);
    }

    const handleOpenAdmin = () => setShowAdminPortal(true);
    window.addEventListener("open-admin-portal", handleOpenAdmin);

    // Pre-warm AR target files & camera normalizer in background so clicking Pokeball is instantaneous
    if (typeof window !== "undefined") {
      initCameraStreamNormalizer();
      const preloadTargets = () => {
        ["/ar-targets/common.mind", "/ar-targets/rare.mind", "/ar-targets/legendary.mind"].forEach((target) => {
          fetch(target, { cache: "force-cache" }).catch(() => {});
        });
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(preloadTargets);
      } else {
        setTimeout(preloadTargets, 500);
      }
    }

    return () => window.removeEventListener("open-admin-portal", handleOpenAdmin);
  }, [teams, selectedTeamId]);

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
  }, [loadUncaughtCount]);

  // Poll caught characters for the selected team every ~10s
  usePolling(
    useCallback(async () => {
      if (selectedTeamId) {
        await fetchCaughtCharacters(selectedTeamId);
      }
    }, [selectedTeamId, fetchCaughtCharacters]),
    {
      intervalMs: 10000,
      jitterMs: 3000,
      enabled: !isARActive && !!selectedTeamId,
    }
  );

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
    if (isPokeballExploding) return;

    let targetTeam = selectedTeam;
    // Auto-select first team if player hasn't picked one yet so AR launches without friction
    if (!targetTeam && teams.length > 0) {
      targetTeam = teams[0];
      setSelectedTeamId(teams[0].id);
      localStorage.setItem("selectedTeamId", teams[0].id);
    }

    if (!targetTeam) {
      console.warn("No teams available to launch AR camera");
      return;
    }

    setIsPokeballExploding(true);

    // Wait for explosion animation to complete, then show AR camera
    setTimeout(() => {
      setIsARActive(true);
      setIsPokeballExploding(false);
    }, 700);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col gap-6">
          <Header />
          <div className="text-center py-12">
            <PokeballLoader
              size="lg"
              label="INITIALIZING ANIMEVERSE REGISTRY"
              sublabel="Syncing teams & active Pokémon hunters..."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. Splash Screen Overlay (gated with useState, shows once on first load) */}
      {showSplash && (
        <SplashScreen
          isReady={!isLoadingTeams}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {/* 2. Scroll-Reveal Sticky Nav */}
      <ScrollNav />

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

      <div id="top" className="relative min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-start p-4 pt-6 sm:pt-10 overflow-x-hidden">
        {/* Ambient decorative effect (torii gate + falling sakura petals) */}
        <AmbientBackground />

        {/* Hero Banner Section */}
        <div className="relative z-10 w-full max-w-md flex flex-col gap-6 animate-fadeIn">
          {/* Header */}
          <Reveal>
            <Header />
          </Reveal>

          {/* Event Intro Card (Animeverse Branding) */}
          <Reveal delayMs={100}>
            <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-slate-900/60 border border-red-500/30 rounded-2xl p-4 text-center backdrop-blur-sm shadow-lg shadow-red-950/20">
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#e8b84b]">
                Silicon Quest Presents
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Animeverse
              </h2>
              <p className="text-xs italic text-neutral-300 mt-1">
                &ldquo;more than an anime event, it&apos;s a universe.&rdquo;
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 font-semibold border border-red-500/30">
                  Prize Pool 6K+
                </span>
                <span>•</span>
                <span>21-22 Oct</span>
                <span>•</span>
                <span>Elysian, USAR</span>
              </div>
            </div>
          </Reveal>

          {/* Main Game Card */}
          <main id="hunt" className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6 shadow-2xl shadow-purple-500/20">
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
              teamName={selectedTeam?.teamName}
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
                      <PokeballLoader
                        size="md"
                        label="SYNCING POKÉDEX"
                        sublabel="Loading caught characters..."
                      />
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

          {/* Section: Rounds (Otaku Hunt & The Anime Innovation Forge) */}
          <section id="rounds" className="w-full mt-4 flex flex-col gap-4">
            <Reveal threshold={0.15}>
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Event Rounds
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Round 1: Otaku Hunt */}
                  <div className="bg-gradient-to-r from-red-950/30 to-slate-800/60 border border-red-500/30 rounded-2xl p-4 transition-all hover:border-red-500/60 group">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-red-400">
                          Round 1
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                          Otaku Hunt
                        </h3>
                      </div>
                      <span className="text-2xl" aria-hidden="true">⛩️</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                      Physical card scavenger hunt across the venue. Scan hidden cards with your phone camera, unlock the character quiz, and battle for the highest team score on the live leaderboard.
                    </p>
                  </div>

                  {/* Round 2: The Anime Innovation Forge */}
                  <div className="bg-gradient-to-r from-orange-950/30 to-slate-800/60 border border-orange-500/30 rounded-2xl p-4 transition-all hover:border-orange-500/60 group">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400">
                          Round 2
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-orange-300 transition-colors">
                          The Anime Innovation Forge
                        </h3>
                      </div>
                      <span className="text-2xl" aria-hidden="true">💡</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                      Unleash your creativity in the innovation arena. Build, solve, and forge futuristic tech and creative ideas themed around iconic anime universes.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* Section: Prizes */}
          <section id="prizes" className="w-full mt-2">
            <Reveal threshold={0.15}>
              <div className="bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-amber-500/30 rounded-3xl p-6 text-center shadow-xl">
                <span className="text-3xl" aria-hidden="true">👑</span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-[#e8b84b] mt-2">
                  Prize Pool
                </span>
                <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 mt-1">
                  ₹6,000+
                </p>
                <p className="text-xs text-neutral-300 mt-2 max-w-xs mx-auto">
                  Cash prizes, exclusive merchandise, certificates, and recognition for top-performing teams.
                </p>
              </div>
            </Reveal>
          </section>

          {/* Section: Registration & Venue CTA */}
          <section id="register" className="w-full mt-2 mb-8">
            <Reveal threshold={0.15}>
              <div className="bg-gradient-to-br from-red-950/40 via-purple-950/40 to-slate-900/90 backdrop-blur-sm border border-red-500/40 rounded-3xl p-6 text-center shadow-2xl shadow-red-950/30">
                <h3 className="text-xl font-black tracking-tight text-white">
                  Join the Universe
                </h3>
                <p className="text-xs text-neutral-300 mt-1.5">
                  21-22 Oct • Elysian, USAR (Guru Gobind Singh Indraprastha University)
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="#top"
                    className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-600/30 transition-all hover:scale-105 text-center"
                  >
                    Start Hunting Now
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("open-admin-portal"));
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-full font-semibold text-xs text-neutral-300 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 transition-colors"
                  >
                    Team Portal
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex flex-col items-center gap-1 text-[10px] text-neutral-400">
                  <p>Organized by ACM • GGSIPU EDC Student Chapter</p>
                  <p className="text-neutral-400">In Partnership with Elysian</p>
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </div>

      {/* AR Camera Overlay */}
      {isARActive && (selectedTeam || teams[0]) && (
        <ARCamera
          teamName={(selectedTeam || teams[0]).teamName}
          teamId={(selectedTeam || teams[0]).id}
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

      {/* Admin Portal Modal */}
      {showAdminPortal && (
        <AdminPortal onClose={() => setShowAdminPortal(false)} />
      )}
    </>
  );
}
