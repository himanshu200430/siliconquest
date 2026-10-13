"use client";

import { useState, useEffect } from "react";

interface TeamFormProps {
  isOpen: boolean;
  onClose: () => void;
  teamToEdit?: {
    id: string;
    teamName: string;
  };
}

export default function TeamForm({ isOpen, onClose, teamToEdit }: TeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (teamToEdit) {
      setTeamName(teamToEdit.teamName);
    } else {
      setTeamName("");
    }
    setError("");
  }, [teamToEdit, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_team",
          id: teamToEdit?.id,
          teamName: teamName.trim(),
          adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASS,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save team");
      }

      onClose();
    } catch (err) {
      console.error("Error saving team:", err);
      setError("Failed to save team. Please verify credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-purple-950/85 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/20 backdrop-blur-2xl animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Neon Energy Blooms */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Holographic Pokeball Crest */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-purple-800/40 border border-purple-400/40 flex items-center justify-center shadow-lg shadow-purple-500/30 overflow-hidden group">
              <div className="w-7 h-7 rounded-full border-2 border-purple-300 relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center shadow-inner">
                {/* Pokeball top half */}
                <div className="w-full h-1/2 bg-gradient-to-b from-red-500 to-pink-600 border-b border-purple-950" />
                {/* Pokeball bottom half */}
                <div className="w-full h-1/2 bg-white/90" />
                {/* Pokeball center core */}
                <div className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-purple-950 flex items-center justify-center shadow-sm">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300">
                  {teamToEdit ? "SQUAD RECONFIG" : "NEW RECRUIT"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 tracking-wide font-sans mt-0.5">
                {teamToEdit ? "Edit Team" : "Add New Team"}
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 hover:bg-red-500/40 hover:border-red-300 hover:text-white active:scale-90 transition-all cursor-pointer pointer-events-auto touch-manipulation shadow-lg shadow-red-950/50"
            aria-label="Close dialog"
          >
            <span className="text-lg font-bold leading-none select-none">✕</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label
              htmlFor="teamName"
              className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400 animate-pulse" />
              Team Identifier
            </label>

            <div className="relative group">
              {/* Prefix Icon */}
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/70 group-focus-within:text-purple-300 transition-colors">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-purple-500/30 rounded-2xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40 transition-all shadow-inner"
                placeholder="e.g. Cyber Ninjas, Team Rocket..."
                disabled={isSubmitting}
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="text-purple-400">⚡</span>
              Appears on live leaderboard rankings and AR hunt scans.
            </p>

            {error && (
              <div className="mt-3 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 animate-shake">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 font-semibold transition-all active:scale-95 cursor-pointer shadow-md text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400 shadow-xl shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Syncing Squad...</span>
                </>
              ) : (
                <>
                  <span>{teamToEdit ? "Update Team" : "Add Team"}</span>
                  <span className="text-amber-300">✦</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}