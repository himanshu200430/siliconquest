import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { action, id, teamName, cardData, adminPassword } = await request.json();

    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "delete_team") {
      await prisma.catch.deleteMany({ where: { teamId: id } });
      await prisma.cooldown.deleteMany({ where: { teamId: id } });
      await prisma.team.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === "delete_card") {
      await prisma.catch.deleteMany({ where: { cardId: id } });
      await prisma.cooldown.deleteMany({ where: { cardId: id } });
      await prisma.card.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === "save_team") {
      if (id) {
        await prisma.team.update({
          where: { id },
          data: { name: teamName.trim() },
        });
      } else {
        const existingTeams = await prisma.team.findMany({ select: { id: true } });
        let maxNum = 0;
        for (const t of existingTeams) {
          const match = t.id.match(/^team_(\d+)$/);
          if (match) {
            maxNum = Math.max(maxNum, parseInt(match[1], 10));
          }
        }
        const nextId = `team_${String(maxNum + 1).padStart(3, "0")}`;
        await prisma.team.create({
          data: {
            id: nextId,
            name: teamName.trim(),
            score: 0,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "save_card") {
      const { name, question, options, correctAnswer, image, mindFile, modelUrl, value } = cardData;
      let cardId = id;
      if (!cardId) {
        let prefix = "c3";
        if (value >= 50) prefix = "c1";
        else if (value >= 20) prefix = "c2";
        const existingCards = await prisma.card.findMany({
          where: { id: { startsWith: prefix } },
          select: { id: true },
        });
        let maxNum = 0;
        for (const c of existingCards) {
          const numPart = parseInt(c.id.slice(prefix.length), 10);
          if (!isNaN(numPart)) {
            maxNum = Math.max(maxNum, numPart);
          }
        }
        cardId = `${prefix}${String(maxNum + 1).padStart(2, "0")}`;
      }

      let tier = "Common";
      if (value >= 50) tier = "Legendary";
      else if (value >= 20) tier = "Rare";

      let cleanMindFile = mindFile || "";
      if (cleanMindFile.startsWith("/ar-targets/")) {
        cleanMindFile = cleanMindFile.replace("/ar-targets/", "");
      }

      await prisma.card.upsert({
        where: { id: cardId },
        update: {
          name,
          question,
          options,
          correctAnswer,
          image: image || "",
          mindFile: cleanMindFile,
          modelUrl: modelUrl || "",
          value,
          tier,
        },
        create: {
          id: cardId,
          name,
          question,
          options,
          correctAnswer,
          image: image || "",
          mindFile: cleanMindFile,
          modelUrl: modelUrl || "",
          value,
          tier,
          copies: 1,
          caughtCount: 0,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "reset_database") {
      await prisma.catch.deleteMany({});
      await prisma.cooldown.deleteMany({});
      await prisma.team.updateMany({ data: { score: 0 } });
      await prisma.card.updateMany({ data: { caughtCount: 0 } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/mutate error:", error);
    return NextResponse.json({ error: "Admin operation failed" }, { status: 500 });
  }
}
