import * as path from "path";
import * as fs from "fs";

// Load environment variables from client/.env
const envPath = path.resolve(__dirname, "../client/.env");
if (fs.existsSync(envPath)) {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  } else {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

import { prisma } from "../client/src/lib/prisma";

const cardsPath = path.resolve(__dirname, "cards.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

async function main() {
  console.log(`Starting seed for ${cards.length} cards...`);

  for (const c of cards) {
    const { id, tier, ...rest } = c;
    const data = {
      ...rest,
      tier: tier as string,
    };
    // caughtCount is never touched, so re-running the seed keeps catch progress
    await prisma.card.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }

  console.log(`Successfully seeded ${cards.length} cards.`);

  // Verify and display final row counts per tier
  const tierCounts = await prisma.card.groupBy({
    by: ["tier"],
    _count: { id: true },
  });

  console.log("\n--- FINAL ROW COUNTS PER TIER ---");
  for (const t of tierCounts) {
    console.log(`Tier ${t.tier}: ${t._count.id} cards`);
  }

  const total = await prisma.card.count();
  console.log(`Total cards in database: ${total}\n`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
