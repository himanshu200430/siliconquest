import * as fs from "fs";
import * as path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { PrismaClient } = require(path.resolve(__dirname, "../client/node_modules/@prisma/client"));

const prisma = new PrismaClient();
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "serviceAccountKey.json");

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Error: Service account file not found at: ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
  const app = getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });
  const db = getFirestore(app);

  console.log("=== Verifying Migration ===");

  // 1. Check Cards
  const fsCardsSnapshot = await db.collection("cards").get();
  const pgCardsCount = await prisma.card.count();
  console.log(`\nCards Count -> Firestore: ${fsCardsSnapshot.size} | Supabase: ${pgCardsCount}`);

  // Spot-check cards
  let cardMismatches = 0;
  const sampleCards = fsCardsSnapshot.docs.slice(0, 5);
  for (const doc of sampleCards) {
    const fsData = doc.data();
    const pgCard = await prisma.card.findUnique({ where: { id: doc.id } });

    if (!pgCard) {
      console.warn(`[FAIL] Card '${doc.id}' missing in Supabase!`);
      cardMismatches++;
      continue;
    }

    // Check critical fields
    if (pgCard.name !== fsData.name) {
      console.warn(`[DIFF] Card '${doc.id}' name mismatch: FS "${fsData.name}" vs PG "${pgCard.name}"`);
      cardMismatches++;
    }
    if (pgCard.correctAnswer !== fsData.correctAnswer) {
      console.warn(`[DIFF] Card '${doc.id}' correctAnswer mismatch: FS ${fsData.correctAnswer} vs PG ${pgCard.correctAnswer}`);
      cardMismatches++;
    }
  }

  // 2. Check Teams
  const fsTeamsSnapshot = await db.collection("teams").get();
  const pgTeamsCount = await prisma.team.count();
  console.log(`\nTeams Count -> Firestore: ${fsTeamsSnapshot.size} | Supabase: ${pgTeamsCount}`);

  let teamMismatches = 0;
  const sampleTeams = fsTeamsSnapshot.docs.slice(0, 5);
  for (const doc of sampleTeams) {
    const fsData = doc.data();
    const expectedName = fsData.teamName || fsData.name;
    const pgTeam = await prisma.team.findUnique({ where: { id: doc.id } });

    if (!pgTeam) {
      console.warn(`[FAIL] Team '${doc.id}' missing in Supabase!`);
      teamMismatches++;
      continue;
    }

    if (pgTeam.name !== expectedName) {
      console.warn(`[DIFF] Team '${doc.id}' name mismatch: FS "${expectedName}" vs PG "${pgTeam.name}"`);
      teamMismatches++;
    }
    if (pgTeam.score !== 0) {
      console.warn(`[DIFF] Team '${doc.id}' score expected 0 (fresh start), got ${pgTeam.score}`);
      teamMismatches++;
    }
  }

  console.log("\n================ Spot-Check Summary ================");
  console.log(`Card checks: ${sampleCards.length} tested, ${cardMismatches} mismatches`);
  console.log(`Team checks: ${sampleTeams.length} tested, ${teamMismatches} mismatches`);
  console.log("====================================================");
}

main()
  .catch((e) => {
    console.error("Verification error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
