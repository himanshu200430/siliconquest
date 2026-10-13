import { useState, useCallback } from "react";

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

interface Snapshot {
  teams: Team[];
  cards: Card[];
  timestamp: number;
}

export const useAdminData = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteTeam = async (teamId: string) => {
    if (deleteConfirm !== teamId) {
      setDeleteConfirm(teamId);
      return;
    }

    try {
      const res = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_team",
          id: teamId,
          adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASS,
        }),
      });
      if (res.ok) {
        setTeams((prev) => prev.filter((team) => team.id !== teamId));
      }
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
      const res = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_card",
          id: cardId,
          adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASS,
        }),
      });
      if (res.ok) {
        setCards((prev) => prev.filter((card) => card.id !== cardId));
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting card:", err);
    }
  };

  return {
    teams,
    cards,
    isLoading,
    deleteConfirm,
    fetchTeams,
    fetchCards,
    handleDeleteTeam,
    handleDeleteCard,
    setDeleteConfirm,
  };
};

export const useResetDatabase = (fetchTeams: () => Promise<void>, fetchCards: () => Promise<void>) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState<Snapshot | null>(null);

  const handleResetDatabase = async (adminPassword: string) => {
    if (resetPassword !== adminPassword) {
      setResetError("Invalid password");
      return;
    }

    setIsResetting(true);
    setResetError("");

    try {
      await fetch("/api/admin/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_database",
          adminPassword: adminPassword,
        }),
      });
      await fetchTeams();
      await fetchCards();

      setShowResetModal(false);
      setResetPassword("");
      alert("Database reset successfully!");
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

    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - lastSnapshot.timestamp > fiveMinutes) {
      alert("Undo window expired (5 minutes). Cannot undo this action.");
      setLastSnapshot(null);
      return;
    }

    if (!confirm("Are you sure you want to undo the last database reset?")) {
      return;
    }

    alert("Undo is not available for database reset.");
    setLastSnapshot(null);
  };

  return {
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
  };
};
