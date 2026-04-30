"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  checkCounters,
  initializeFirestoreCounters,
} from "@/lib/firestoreSetup";
import {
  resetDatabase,
  createDatabaseSnapshot,
  restoreDatabaseFromSnapshot,
} from "@/services/firestore";
import TeamForm from "./TeamForm";
import CardForm from "./CardForm";

interface Team {
  id: string;
  teamName: string;
  score: number;
}

interface Card {
  id: string;
  name: string;
  question: string;
  options: string[];
  correctAnswer: number;
  image: string;
  mindFile: string;
  modelUrl: string;
  isCaught: boolean;
  caughtByTeam: string;
}

interface AdminPortalProps {
  onClose: () => void;
}

export default function AdminPortal({ onClose }: AdminPortalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<"teams" | "cards">("teams");
  const [initializingCounters, setInitializingCounters] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  // Team management state
  const [teams, setTeams] = useState<Team[]>([]);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Card management state
  const [cards, setCards] = useState<Card[]>([]);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);

  // Database reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Undo system state
  const [lastSnapshot, setLastSnapshot] = useState<{
    teams: Team[];
    cards: Card[];
    timestamp: number;
  } | null>(null);

  // Check counters when logged in
  useEffect(() => {
    if (isLoggedIn) {
      checkFirestoreSetup();
    }
  }, [isLoggedIn]);

  // Fetch data when view changes
  useEffect(() => {
    if (!isLoggedIn || setupRequired) return;

    if (currentView === "teams") {
      fetchTeams();
    } else if (currentView === "cards") {
      fetchCards();
    }
  }, [isLoggedIn, currentView, setupRequired]);

  const checkFirestoreSetup = async () => {
    const counterStatus = await checkCounters();
    const needsSetup = !counterStatus.teams || !counterStatus.cards;
    setSetupRequired(needsSetup);
  };

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const teamsCollection = collection(db, "teams");
      const teamsSnapshot = await getDocs(teamsCollection);
      const teamsData = teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsData);
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const cardsCollection = collection(db, "cards");
      const cardsSnapshot = await getDocs(cardsCollection);
      const cardsData = cardsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Card[];
      setCards(cardsData);
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      username === process.env.NEXT_PUBLIC_ADMIN_USER &&
      password === process.env.NEXT_PUBLIC_ADMIN_PASS
    ) {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (deleteConfirm !== teamId) {
      setDeleteConfirm(teamId);
      return;
    }

    try {
      await deleteDoc(doc(db, "teams", teamId));
      setTeams(teams.filter((team) => team.id !== teamId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting team:", err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (deleteConfirm !== cardId) {
      setDeleteConfirm(cardId);
      return;
    }

    try {
      await deleteDoc(doc(db, "cards", cardId));
      setCards(cards.filter((card) => card.id !== cardId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting card:", err);
    }
  };

  const handleResetDatabase = async () => {
    // Verify password
    if (resetPassword !== process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setResetError("Invalid password");
      return;
    }

    setIsResetting(true);
    setResetError("");

    try {
      // Create snapshot before reset for undo capability
      const snapshot = await createDatabaseSnapshot();
      setLastSnapshot({
        teams: snapshot.teams as unknown as Team[],
        cards: snapshot.cards as unknown as Card[],
        timestamp: Date.now(),
      });

      // Perform the reset
      await resetDatabase();

      // Refresh the data
      await fetchTeams();
      await fetchCards();

      // Close modal and reset form
      setShowResetModal(false);
      setResetPassword("");
      alert("Database reset successfully! You can undo this action if needed.");
    } catch (err) {
      console.error("Error resetting database:", err);
      setResetError("Failed to reset database. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleUndoLastAction = async () => {
    if (!lastSnapshot) {
      alert("No action to undo");
      return;
    }

    // Check if snapshot is less than 5 minutes old
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - lastSnapshot.timestamp > fiveMinutes) {
      alert("Undo window expired (5 minutes). Cannot undo this action.");
      setLastSnapshot(null);
      return;
    }

    if (!confirm("Are you sure you want to undo the last database reset?")) {
      return;
    }

    setIsLoading(true);

    try {
      await restoreDatabaseFromSnapshot({
        teams: lastSnapshot.teams as unknown as Array<{ id: string; [key: string]: unknown }>,
        cards: lastSnapshot.cards as unknown as Array<{ id: string; [key: string]: unknown }>,
      });

      // Refresh the data
      await fetchTeams();
      await fetchCards();

      // Clear the snapshot after successful undo
      setLastSnapshot(null);
      alert("Last action undone successfully!");
    } catch (err) {
      console.error("Error undoing last action:", err);
      alert("Failed to undo last action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-white">Admin Portal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close"
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

        <div className="p-6">
          {!isLoggedIn ? (
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           text-white placeholder-gray-400"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           text-white placeholder-gray-400"
                  placeholder="Enter password"
                  required
                />
              </div>

              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                         rounded-md transition-colors focus:outline-none focus:ring-2
                         focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900
                         shadow-lg shadow-indigo-500/20"
              >
                Login
              </button>
            </form>
          ) : (
            <div className="text-gray-200">
              {setupRequired ? (
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    First-Time Setup Required
                  </h3>
                  <p className="text-gray-400 mb-6">
                    The admin portal needs to initialize some required documents
                    in Firestore.
                  </p>
                  <button
                    onClick={async () => {
                      setInitializingCounters(true);
                      try {
                        await initializeFirestoreCounters();
                        setSetupRequired(false);
                      } catch (err) {
                        console.error("Error initializing counters:", err);
                        setError(
                          "Failed to initialize counters. Please try again."
                        );
                      } finally {
                        setInitializingCounters(false);
                      }
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 
                             transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 
                             focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                    disabled={initializingCounters}
                  >
                    {initializingCounters
                      ? "Initializing..."
                      : "Initialize Admin Portal"}
                  </button>
                  {error && (
                    <p className="mt-4 text-red-400 text-sm">{error}</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Action buttons row */}
                  <div className="flex gap-4 mb-6 flex-wrap">
                    <button
                      onClick={() => setCurrentView("teams")}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        currentView === "teams"
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      Manage Teams
                    </button>
                    <button
                      onClick={() => setCurrentView("cards")}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        currentView === "cards"
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      Manage Cards
                    </button>
                    
                    {/* Spacer to push reset/undo to the right */}
                    <div className="flex-grow"></div>
                    
                    {/* Undo button */}
                    {lastSnapshot && (
                      <button
                        onClick={handleUndoLastAction}
                        disabled={isLoading}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md 
                                 transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-50
                                 flex items-center gap-2"
                        title={`Undo last reset (expires in ${Math.max(0, Math.ceil((5 * 60 * 1000 - (Date.now() - lastSnapshot.timestamp)) / 60000))} min)`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Undo Last Reset
                      </button>
                    )}
                    
                    {/* Reset Database button */}
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md 
                               transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Reset Database
                    </button>
                  </div>

                  {currentView === "teams" && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          Teams
                        </h3>
                        <button
                          onClick={() => {
                            setTeamToEdit(null);
                            setIsTeamFormOpen(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md 
                                   transition-colors shadow-lg shadow-indigo-500/20"
                        >
                          Add New Team
                        </button>
                      </div>

                      {isLoading ? (
                        <p className="text-center py-4 text-gray-400">
                          Loading teams...
                        </p>
                      ) : teams.length === 0 ? (
                        <p className="text-center py-4 text-gray-400">
                          No teams found
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Team Name
                                </th>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Score
                                </th>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {teams.map((team) => (
                                <tr
                                  key={team.id}
                                  className="bg-gray-800 hover:bg-gray-700"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    {team.teamName}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    {team.score}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap space-x-4">
                                    <button
                                      onClick={() => {
                                        setTeamToEdit(team);
                                        setIsTeamFormOpen(true);
                                      }}
                                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTeam(team.id)}
                                      className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      {deleteConfirm === team.id
                                        ? "Confirm Delete?"
                                        : "Delete"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <TeamForm
                        isOpen={isTeamFormOpen}
                        onClose={() => {
                          setIsTeamFormOpen(false);
                          setTeamToEdit(null);
                          fetchTeams();
                        }}
                        teamToEdit={teamToEdit || undefined}
                      />
                    </div>
                  )}

                  {currentView === "cards" && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          Cards
                        </h3>
                        <button
                          onClick={() => {
                            setCardToEdit(null);
                            setIsCardFormOpen(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md 
                                   transition-colors shadow-lg shadow-indigo-500/20"
                        >
                          Add New Card
                        </button>
                      </div>

                      {isLoading ? (
                        <p className="text-center py-4 text-gray-400">
                          Loading cards...
                        </p>
                      ) : cards.length === 0 ? (
                        <p className="text-center py-4 text-gray-400">
                          No cards found
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  ID
                                </th>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Value
                                </th>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Question
                                </th>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {cards.map((card) => (
                                <tr
                                  key={card.id}
                                  className="bg-gray-800 hover:bg-gray-700"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm font-mono">
                                    {card.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    {card.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        ("value" in card &&
                                          (card as { value?: number })
                                            .value) === 50
                                          ? "bg-purple-900/50 text-purple-300"
                                          : ("value" in card &&
                                              (card as { value?: number })
                                                .value) === 20
                                          ? "bg-blue-900/50 text-blue-300"
                                          : "bg-gray-700/50 text-gray-300"
                                      }`}
                                    >
                                      {("value" in card &&
                                        (card as { value?: number }).value) ||
                                        "N/A"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-300">
                                    <div className="line-clamp-2">
                                      {card.question}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        card.isCaught
                                          ? "bg-green-900/50 text-green-400"
                                          : "bg-yellow-900/50 text-yellow-400"
                                      }`}
                                    >
                                      {card.isCaught ? "Caught" : "Available"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap space-x-4">
                                    <button
                                      onClick={() => {
                                        setCardToEdit(card);
                                        setIsCardFormOpen(true);
                                      }}
                                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCard(card.id)}
                                      className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      {deleteConfirm === card.id
                                        ? "Confirm Delete?"
                                        : "Delete"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <CardForm
                        isOpen={isCardFormOpen}
                        onClose={() => {
                          setIsCardFormOpen(false);
                          setCardToEdit(null);
                          fetchCards();
                        }}
                        cardToEdit={cardToEdit || undefined}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reset Database Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border-2 border-red-500">
            <div className="bg-red-600 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Critical Action: Reset Database
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200 text-sm font-semibold mb-2">
                  ⚠️ Warning: This action will:
                </p>
                <ul className="text-red-300 text-sm space-y-1 ml-4 list-disc">
                  <li>Mark all cards as <strong>uncaught</strong></li>
                  <li>Clear all team&apos;s <strong>caught cards</strong></li>
                  <li>Reset all team <strong>scores to 0</strong></li>
                  <li>This action can be undone within 5 minutes</li>
                </ul>
              </div>

              <div>
                <label
                  htmlFor="reset-password"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Enter Admin Password to Confirm
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => {
                    setResetPassword(e.target.value);
                    setResetError("");
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
                           text-white placeholder-gray-400"
                  placeholder="Enter admin password"
                  disabled={isResetting}
                />
                {resetError && (
                  <p className="mt-2 text-red-400 text-sm">{resetError}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPassword("");
                    setResetError("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md 
                           transition-colors"
                  disabled={isResetting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetDatabase}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md 
                           transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isResetting || !resetPassword}
                >
                  {isResetting ? "Resetting..." : "Reset Database"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
