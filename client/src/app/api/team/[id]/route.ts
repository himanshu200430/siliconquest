import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing team ID" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        catches: {
          include: {
            card: {
              select: {
                id: true,
                name: true,
                value: true,
                tier: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const caughtCards = team.catches.map((c) => ({
      id: c.card.id,
      name: c.card.name,
      value: c.card.value,
      tier: c.card.tier,
      image: c.card.image,
      isCaught: true,
      caughtByTeam: team.id,
    }));

    return NextResponse.json({
      id: team.id,
      name: team.name,
      score: team.score,
      caughtCards,
    });
  } catch (error) {
    console.error("GET /api/team/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 });
  }
}
