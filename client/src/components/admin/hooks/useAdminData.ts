import { useState, useCallback } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  createDatabaseSnapshot,
  resetDatabase,
  restoreDatabaseFromSnapshot,
} from "@/services/firestore";

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
      const teamsSnapshot = await getDocs(collection(db, "teams"));
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
  }, []);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const cardsSnapshot = await getDocs(collection(db, "cards"));
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
  }, []);

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
      const snapshot = await createDatabaseSnapshot();
      setLastSnapshot({
        teams: snapshot.teams as unknown as Team[],
        cards: snapshot.cards as unknown as Card[],
        timestamp: Date.now(),
      });

      await resetDatabase();
      await fetchTeams();
      await fetchCards();

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

    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - lastSnapshot.timestamp > fiveMinutes) {
      alert("Undo window expired (5 minutes). Cannot undo this action.");
      setLastSnapshot(null);
      return;
    }

    if (!confirm("Are you sure you want to undo the last database reset?")) {
      return;
    }

    try {
      await restoreDatabaseFromSnapshot({
        teams: lastSnapshot.teams as unknown as Array<{ id: string; [key: string]: unknown }>,
        cards: lastSnapshot.cards as unknown as Array<{ id: string; [key: string]: unknown }>,
      });

      await fetchTeams();
      await fetchCards();

      setLastSnapshot(null);
      alert("Last action undone successfully!");
    } catch (err) {
      console.error("Error undoing last action:", err);
      alert("Failed to undo last action. Please try again.");
    }
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
