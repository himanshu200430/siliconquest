"use client";

import { useEffect, useRef } from "react";
import type { Team } from "@/types";

interface LeaderboardProps {
  teams: Team[];
  selectedTeamId: string | null;
  onTeamSelect?: (teamId: string) => void;
  isSelectable?: boolean;
}

export default function Leaderboard({
  teams,
  selectedTeamId,
  onTeamSelect,
  isSelectable = false,
}: LeaderboardProps) {
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const selectedTeamRef = useRef<HTMLDivElement>(null);

  // Scroll to selected team when it changes
  useEffect(() => {
    if (selectedTeamId && selectedTeamRef.current && leaderboardRef.current) {
      setTimeout(() => {
        selectedTeamRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [selectedTeamId]);

  const handleTeamClick = (teamId: string) => {
    if (isSelectable && onTeamSelect) {
      onTeamSelect(teamId);
    }
  };

  return (
    <div>
      <h2 className="text-purple-300 text-center font-semibold mb-4 tracking-wide">
        Leaderboard
      </h2>
      <div
        ref={leaderboardRef}
        className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin"
      >
        {teams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No teams registered yet</p>
          </div>
        ) : (
          teams.map((team, index) => (
            <div
              key={team.id}
              ref={team.id === selectedTeamId ? selectedTeamRef : null}
              onClick={() => handleTeamClick(team.id)}
              className={`bg-gradient-to-r from-slate-800/50 to-slate-700/50 border rounded-xl p-4 transition-all duration-300 ${
                isSelectable
                  ? "cursor-pointer hover:border-purple-500/50 hover:scale-[1.01]"
                  : ""
              } ${
                team.id === selectedTeamId
                  ? "border-purple-500 shadow-lg shadow-purple-500/30 scale-[1.02]"
                  : "border-purple-500/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    index === 0
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900"
                      : index === 1
                      ? "bg-gradient-to-br from-slate-400 to-slate-500 text-slate-900"
                      : index === 2
                      ? "bg-gradient-to-br from-amber-600 to-amber-700 text-slate-900"
                      : "bg-gradient-to-br from-purple-600 to-purple-700 text-white"
                  }`}
                >
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3
                      className={`font-semibold text-sm truncate ${
                        team.id === selectedTeamId
                          ? "text-purple-300"
                          : "text-slate-300"
                      }`}
                    >
                      {team.teamName}
                    </h3>
                    <span className="text-amber-400 font-bold text-sm ml-2 flex-shrink-0">
                      {team.score}
                    </span>
                  </div>
                  {team.id === selectedTeamId && (
                    <div className="text-xs text-purple-400 font-medium">
                      Your Team
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
