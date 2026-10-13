import { Team, Card, Character } from "@/types";

/**
 * API-based service functions replacing direct Firebase client SDK calls.
 */

export async function getTeams(): Promise<Team[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) {
    throw new Error(`Failed to fetch teams: ${res.statusText}`);
  }
  return res.json();
}

export async function getCards(): Promise<Card[]> {
  const res = await fetch("/api/cards");
  if (!res.ok) {
    throw new Error(`Failed to fetch cards: ${res.statusText}`);
  }
  return res.json();
}

export async function getARCharacters(): Promise<Character[]> {
  const res = await fetch("/api/cards");
  if (!res.ok) {
    throw new Error(`Failed to fetch AR characters: ${res.statusText}`);
  }
  return res.json();
}

export async function getCardQuiz(cardId: string): Promise<{
  id: string;
  name: string;
  value: number;
  tier: string;
  image: string;
  question: string;
  options: string[];
}> {
  const res = await fetch(`/api/cards/${cardId}/quiz`);
  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: string; noCopiesLeft?: boolean };
    const err = new Error(errorData.error || "Failed to load quiz") as Error & {
      status?: number;
      data?: { error?: string; noCopiesLeft?: boolean };
    };
    err.status = res.status;
    err.data = errorData;
    throw err;
  }
  return res.json();
}

export async function getCardsCaughtByTeam(teamId: string): Promise<Card[]> {
  const res = await fetch(`/api/team/${teamId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch team cards: ${res.statusText}`);
  }
  const data = await res.json();
  return data.caughtCards || [];
}

export async function getUncaughtCards(): Promise<Card[]> {
  const cards = await getCards();
  return cards.filter((c) => !c.isCaught);
}

export async function submitCatch(
  teamId: string,
  cardId: string,
  answerIndex: number
): Promise<{
  success?: boolean;
  correct?: boolean;
  alreadyCaught?: boolean;
  noCopiesLeft?: boolean;
  cooldownSeconds?: number;
  lockedUntil?: string;
  remainingSeconds?: number;
  error?: string;
  card?: Partial<Card>;
}> {
  const res = await fetch("/api/catch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId, cardId, answerIndex }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    correct?: boolean;
    alreadyCaught?: boolean;
    noCopiesLeft?: boolean;
    cooldownSeconds?: number;
    lockedUntil?: string;
    remainingSeconds?: number;
    error?: string;
    card?: Partial<Card>;
  };

  if (!res.ok) {
    return {
      success: false,
      alreadyCaught: data.alreadyCaught || res.status === 409 && data.error?.includes("already"),
      noCopiesLeft: data.noCopiesLeft || res.status === 409 && data.error?.includes("copies"),
      cooldownSeconds: data.remainingSeconds,
      lockedUntil: data.lockedUntil,
      remainingSeconds: data.remainingSeconds,
      error: data.error,
    };
  }

  return data;
}
