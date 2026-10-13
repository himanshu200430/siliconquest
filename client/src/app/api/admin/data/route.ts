import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [teams, cards] = await Promise.all([
      prisma.team.findMany({
        select: { id: true, name: true, score: true },
        orderBy: { name: "asc" },
      }),
      prisma.card.findMany({
        orderBy: { id: "asc" },
      }),
    ]);

    const formattedTeams = teams.map((t) => ({
      id: t.id,
      teamName: t.name,
      score: t.score,
    }));

    const formattedCards = cards.map((c) => ({
      id: c.id,
      name: c.name,
      value: c.value,
      tier: c.tier,
      image: c.image,
      mindFile: c.mindFile,
      modelUrl: c.modelUrl,
      question: c.question,
      options: c.options,
      correctAnswer: c.correctAnswer,
      copies: c.copies,
      caughtCount: c.caughtCount,
      isCaught: c.caughtCount >= c.copies,
      caughtByTeam: "",
    }));

    return NextResponse.json({
      teams: formattedTeams,
      cards: formattedCards,
    });
  } catch (error) {
    console.error("GET /api/admin/data error:", error);
    return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}
