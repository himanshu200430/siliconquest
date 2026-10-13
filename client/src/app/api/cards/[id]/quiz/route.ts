import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing card ID" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        value: true,
        tier: true,
        image: true,
        question: true,
        options: true,
        copies: true,
        caughtCount: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if card has copies left
    if (card.caughtCount >= card.copies) {
      return NextResponse.json(
        { error: "No copies left for this character", noCopiesLeft: true },
        { status: 409 }
      );
    }

    // Returns ONLY question and options (NEVER correctAnswer)
    return NextResponse.json({
      id: card.id,
      name: card.name,
      value: card.value,
      tier: card.tier,
      image: card.image,
      question: card.question,
      options: card.options,
    });
  } catch (error) {
    console.error("GET /api/cards/[id]/quiz error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
