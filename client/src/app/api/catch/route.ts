import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, cardId, answerIndex } = body;

    if (!teamId || !cardId || typeof answerIndex !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: teamId, cardId, answerIndex" },
        { status: 400 }
      );
    }

    // 1. Fetch card details (including correctAnswer, copies, caughtCount)
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // 2. Early check: are copies exhausted?
    if (card.caughtCount >= card.copies) {
      return NextResponse.json(
        { error: "No copies left", noCopiesLeft: true },
        { status: 409 }
      );
    }

    // 3. Early check: has this team already caught this card?
    const existingCatch = await prisma.catch.findUnique({
      where: {
        teamId_cardId: { teamId, cardId },
      },
    });
    if (existingCatch) {
      return NextResponse.json(
        { error: "Your team already has this character", alreadyCaught: true },
        { status: 409 }
      );
    }

    // 4. Cooldown enforcement
    const now = new Date();
    const cooldown = await prisma.cooldown.findUnique({
      where: {
        teamId_cardId: { teamId, cardId },
      },
    });

    if (cooldown && cooldown.lockedUntil > now) {
      return NextResponse.json(
        {
          error: "Team is on cooldown for this character",
          lockedUntil: cooldown.lockedUntil.toISOString(),
          remainingSeconds: Math.ceil((cooldown.lockedUntil.getTime() - now.getTime()) / 1000),
        },
        { status: 429 }
      );
    }

    // 5. Grade the answer
    if (answerIndex !== card.correctAnswer) {
      // Wrong answer -> progressive cooldown: 60s + (attempts * 30s)
      const attempts = (cooldown?.attempts || 0) + 1;
      const penaltySeconds = 60 + (attempts - 1) * 30; // 1st: 60s, 2nd: 90s, 3rd: 120s...
      const lockedUntil = new Date(Date.now() + penaltySeconds * 1000);

      await prisma.cooldown.upsert({
        where: { teamId_cardId: { teamId, cardId } },
        update: {
          attempts,
          lockedUntil,
        },
        create: {
          teamId,
          cardId,
          attempts,
          lockedUntil,
        },
      });

      return NextResponse.json(
        {
          correct: false,
          lockedUntil: lockedUntil.toISOString(),
          cooldownSeconds: penaltySeconds,
        },
        { status: 200 }
      );
    }

    // 6. Correct answer -> execute atomic transaction
    // Step (1): create Catch row (P2002 if duplicate)
    // Step (2): atomic UPDATE Card caughtCount WHERE caughtCount < copies
    // Step (3): increment team score
    // Step (4): delete team cooldown
    try {
      await prisma.$transaction(async (tx) => {
        // (1) Create catch record
        await tx.catch.create({
          data: {
            teamId,
            cardId,
          },
        });

        // (2) Take a copy atomically with raw SQL
        const updatedCount = await tx.$executeRaw(
          Prisma.sql`UPDATE "Card" SET "caughtCount" = "caughtCount" + 1 WHERE id = ${cardId} AND "caughtCount" < "copies"`
        );

        if (updatedCount === 0) {
          throw new Error("NO_COPIES_LEFT");
        }

        // (3) Increment team score
        await tx.team.update({
          where: { id: teamId },
          data: {
            score: { increment: card.value },
          },
        });

        // (4) Delete team's cooldown for this card if it exists
        await tx.cooldown.deleteMany({
          where: {
            teamId,
            cardId,
          },
        });
      });

      return NextResponse.json({
        success: true,
        correct: true,
        card: {
          id: card.id,
          name: card.name,
          value: card.value,
          tier: card.tier,
          image: card.image,
        },
      });
    } catch (txError: unknown) {
      const err = txError as { code?: string; message?: string };
      if (err?.code === "P2002") {
        return NextResponse.json(
          { error: "Your team already has this character", alreadyCaught: true },
          { status: 409 }
        );
      }
      if (err?.message === "NO_COPIES_LEFT") {
        return NextResponse.json(
          { error: "No copies left", noCopiesLeft: true },
          { status: 409 }
        );
      }
      throw txError;
    }
  } catch (error) {
    console.error("POST /api/catch error:", error);
    return NextResponse.json(
      { error: "Internal server error during catch" },
      { status: 500 }
    );
  }
}
