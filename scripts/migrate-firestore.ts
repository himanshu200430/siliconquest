import * as fs from "fs";
import * as path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { PrismaClient } = require(path.resolve(__dirname, "../client/node_modules/@prisma/client"));
const prisma = new PrismaClient();

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "serviceAccountKey.json");
const COPIES_PATH = path.resolve(__dirname, "copies.json");

// Helper to calculate tier from value if missing
function getTierFromValue(value: number): "Common" | "Rare" | "Legendary" {
  if (value >= 50) return "Legendary";
  if (value >= 20) return "Rare";
  return "Common";
}

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Error: Service account file not found at: ${SERVICE_ACCOUNT_PATH}`);
    console.error("Please place your Firebase serviceAccountKey.json in the scripts/ folder.");
    process.exit(1);
  }

  // Load copies override map if present
  let copiesMap: Record<string, number> = {};
  if (fs.existsSync(COPIES_PATH)) {
    try {
      const copiesData = fs.readFileSync(COPIES_PATH, "utf-8");
      copiesMap = JSON.parse(copiesData);
      console.log(`Loaded copies overrides for ${Object.keys(copiesMap).length} cards.`);
    } catch (e) {
      console.warn("Warning: Could not parse scripts/copies.json, defaulting all copies to 1.");
    }
  }

  // Initialize Firebase Admin
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
  const app = getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });
  const db = getFirestore(app);

  console.log("=== Starting Firestore to Supabase Migration ===");

  // 1. Migrate Cards
  console.log("\n--- Migrating Cards ---");
  const cardsSnapshot = await db.collection("cards").get();
  let migratedCards = 0;
  let skippedCards = 0;

  for (const doc of cardsSnapshot.docs) {
    const data = doc.data();
    const id = doc.id;

    // Validation: exactly 4 options and correctAnswer is integer 0-3
    const options = data.options;
    const correctAnswer = data.correctAnswer;
    const isValidOptions = Array.isArray(options) && options.length === 4 && options.every((opt) => typeof opt === "string");
    const isValidAnswer = typeof correctAnswer === "number" && Number.isInteger(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3;

    if (!isValidOptions || !isValidAnswer) {
      console.warn(`[SKIP] Invalid card document '${id}': invalid options or correctAnswer.`, {
        optionsLength: Array.isArray(options) ? options.length : typeof options,
        correctAnswer,
      });
      skippedCards++;
      continue;
    }

    const value = typeof data.value === "number" ? data.value : 0;
    const tier = data.tier || getTierFromValue(value);
    const copies = typeof copiesMap[id] === "number" ? copiesMap[id] : 1;

    // Clean mindFile - store filename only
    let mindFile = typeof data.mindFile === "string" ? data.mindFile : "";
    if (mindFile.startsWith("/ar-targets/")) {
      mindFile = mindFile.replace("/ar-targets/", "");
    }

    try {
      await prisma.card.upsert({
        where: { id },
        update: {
          name: data.name || "Unnamed",
          value,
          tier,
          image: data.image || "",
          mindFile,
          modelUrl: data.modelUrl || "",
          question: data.question || "",
          options,
          correctAnswer,
          copies,
          // Start fresh: reset caughtCount to 0
          caughtCount: 0,
        },
        create: {
          id,
          name: data.name || "Unnamed",
          value,
          tier,
          image: data.image || "",
          mindFile,
          modelUrl: data.modelUrl || "",
          question: data.question || "",
          options,
          correctAnswer,
          copies,
          caughtCount: 0,
        },
      });
      migratedCards++;
    } catch (err) {
      console.error(`[ERROR] Failed to upsert card '${id}':`, err);
      skippedCards++;
    }
  }

  // 2. Migrate Teams
  console.log("\n--- Migrating Teams ---");
  const teamsSnapshot = await db.collection("teams").get();
  let migratedTeams = 0;
  let skippedTeams = 0;

  for (const doc of teamsSnapshot.docs) {
    const data = doc.data();
    const id = doc.id;
    const name = data.teamName || data.name;

    if (!name || typeof name !== "string") {
      console.warn(`[SKIP] Invalid team document '${id}': missing teamName or name.`);
      skippedTeams++;
      continue;
    }

    try {
      await prisma.team.upsert({
        where: { id },
        update: {
          name,
          score: 0, // start fresh at score 0
        },
        create: {
          id,
          name,
          score: 0,
        },
      });
      migratedTeams++;
    } catch (err) {
      console.error(`[ERROR] Failed to upsert team '${id}':`, err);
      skippedTeams++;
    }
  }

  console.log("\n================ Summary ================");
  console.log(`Cards : ${migratedCards} migrated, ${skippedCards} skipped (Total Firestore: ${cardsSnapshot.size})`);
  console.log(`Teams : ${migratedTeams} migrated, ${skippedTeams} skipped (Total Firestore: ${teamsSnapshot.size})`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Migration fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
