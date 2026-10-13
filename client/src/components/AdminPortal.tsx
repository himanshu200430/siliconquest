"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAdminData, useResetDatabase } from "./admin/hooks/useAdminData";
import { LoginForm } from "./admin/LoginForm";
import { ActionButtons } from "./admin/ActionButtons";
import { TeamsManagement } from "./admin/TeamsManagement";
import { CardsManagement } from "./admin/CardsManagement";
import { ResetDatabaseModal } from "./admin/ResetDatabaseModal";
import TeamForm from "./TeamForm";
import CardForm from "./CardForm";

interface AdminPortalProps {
  onClose: () => void;
}

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

export default function AdminPortal({ onClose }: AdminPortalProps) {
  // Authentication state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // View state
  const [currentView, setCurrentView] = useState<"teams" | "cards">("teams");

  // Form state
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);

  // Custom hooks for data management
  const {
    teams,
    cards,
    isLoading,
    deleteConfirm,
    fetchTeams,
    fetchCards,
    handleDeleteTeam,
    handleDeleteCard,
    setDeleteConfirm,
  } = useAdminData();

  const {
    showResetModal,
    setShowResetModal,
    resetPassword,
    setResetPassword,
    resetError,
    setResetError,
    isResetting,
    lastSnapshot,
    handleResetDatabase,
    handleUndoLastAction,
  } = useResetDatabase(fetchTeams, fetchCards);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTeams();
      fetchCards();
    }
  }, [isLoggedIn, fetchTeams, fetchCards]);

  const handleLogin = (e: FormEvent) => {
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

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
    setResetPassword("");
    setResetError("");
  };

  const handleResetConfirm = async () => {
    await handleResetDatabase(process.env.NEXT_PUBLIC_ADMIN_PASS || "");
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Content */}
        <div className="p-6">
          {!isLoggedIn ? (
            <LoginForm
              username={username}
              password={password}
              error={error}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
              onSubmit={handleLogin}
            />
          ) : (
            <div className="text-gray-200">
              <ActionButtons
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    onResetClick={handleResetClick}
                    onUndoClick={handleUndoLastAction}
                    lastSnapshot={lastSnapshot}
                    isLoading={isLoading}
                  />

                  {currentView === "teams" && (
                    <TeamsManagement
                      teams={teams}
                      isLoading={isLoading}
                      deleteConfirm={deleteConfirm}
                      onAddTeam={() => {
                        setTeamToEdit(null);
                        setIsTeamFormOpen(true);
                      }}
                      onEditTeam={(team) => {
                        setTeamToEdit(team);
                        setIsTeamFormOpen(true);
                      }}
                      onDeleteTeam={handleDeleteTeam}
                      onCancelDelete={() => setDeleteConfirm(null)}
                    />
                  )}

                  {currentView === "cards" && (
                    <CardsManagement
                      cards={cards}
                      isLoading={isLoading}
                      deleteConfirm={deleteConfirm}
                      onAddCard={() => {
                        setCardToEdit(null);
                        setIsCardFormOpen(true);
                      }}
                      onEditCard={(card) => {
                        setCardToEdit(card);
                        setIsCardFormOpen(true);
                      }}
                      onDeleteCard={handleDeleteCard}
                      onCancelDelete={() => setDeleteConfirm(null)}
                    />
                  )}

                  {/* Team Form Modal */}
                  {isTeamFormOpen && (
                    <TeamForm
                      isOpen={isTeamFormOpen}
                      onClose={() => {
                        setIsTeamFormOpen(false);
                        setTeamToEdit(null);
                        fetchTeams();
                      }}
                      teamToEdit={teamToEdit || undefined}
                    />
                  )}

                  {/* Card Form Modal */}
                  {isCardFormOpen && (
                    <CardForm
                      isOpen={isCardFormOpen}
                      onClose={() => {
                        setIsCardFormOpen(false);
                        setCardToEdit(null);
                        fetchCards();
                      }}
                      cardToEdit={cardToEdit || undefined}
                    />
                  )}
            </div>
          )}
        </div>
      </div>

      {/* Reset Database Modal */}
      <ResetDatabaseModal
        isOpen={showResetModal}
        password={resetPassword}
        error={resetError}
        isResetting={isResetting}
        onPasswordChange={(value) => {
          setResetPassword(value);
          setResetError("");
        }}
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
      />
    </div>
  );
}
