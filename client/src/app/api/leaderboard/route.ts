import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fileCache } from "@/lib/fileCache";

// Cached for 10s via fileCache + CDN
const CACHE_TTL_MS = 10 * 1000;

export async function GET() {
  try {
    const teams = await fileCache("leaderboard", CACHE_TTL_MS, async () => {
      const dbTeams = await prisma.team.findMany({
        select: {
          id: true,
          name: true,
          score: true,
        },
        orderBy: [{ score: "desc" }, { name: "asc" }],
      });

      return dbTeams.map((t) => ({
        id: t.id,
        teamName: t.name,
        score: t.score,
      }));
    });

    return NextResponse.json(teams, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
