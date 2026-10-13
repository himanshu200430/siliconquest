import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fileCache } from "@/lib/fileCache";

// Cache duration: 5 seconds in fileCache + CDN Cache-Control headers
const CACHE_TTL_MS = 5 * 1000;

export async function GET() {
  try {
    const cards = await fileCache("cards_list", CACHE_TTL_MS, async () => {
      // Fetch cards omitting question, options, and correctAnswer
      const rawCards = await prisma.card.findMany({
        select: {
          id: true,
          name: true,
          value: true,
          tier: true,
          image: true,
          mindFile: true,
          modelUrl: true,
          copies: true,
          caughtCount: true,
        },
        orderBy: { id: "asc" },
      });

      return rawCards.map((c) => ({
        id: c.id,
        name: c.name,
        value: c.value,
        tier: c.tier,
        image: c.image,
        mindFile: c.mindFile.startsWith("/") ? c.mindFile : `/ar-targets/${c.mindFile}`,
        modelUrl: c.modelUrl,
        copies: c.copies,
        caughtCount: c.caughtCount,
        copiesLeft: Math.max(0, c.copies - c.caughtCount),
        isCaught: c.caughtCount >= c.copies,
      }));
    });

    return NextResponse.json(cards, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
      },
    });
  } catch (error) {
    console.error("GET /api/cards error:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}
