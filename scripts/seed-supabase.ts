import * as path from "path";

const { PrismaClient } = require(path.resolve(__dirname, "../client/node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function main() {
  console.log("=== Seeding Initial Characters & Teams into Supabase ===");

  // Initial teams
  const teams = [
    { id: "team_001", name: "Papaya Chasers", score: 0 },
    { id: "team_002", name: "Silicon Knights", score: 0 },
    { id: "team_003", name: "Byte Hunters", score: 0 },
    { id: "team_004", name: "Cyber Wolves", score: 0 },
    { id: "team_005", name: "Pixel Raiders", score: 0 },
  ];

  for (const t of teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: { name: t.name, score: t.score },
      create: t,
    });
  }
  console.log(`Seeded ${teams.length} teams.`);

  // Characters corresponding to common.mind (c3xx), rare.mind (c2xx), legendary.mind (c1xx)
  // Each target in the tier corresponds to index 0, 1, 2...
  const cards = [
    // Legendary (c101+) - value: 50
    {
      id: "c101",
      name: "MewTwo",
      value: 50,
      tier: "Legendary",
      image: "🦊",
      mindFile: "legendary.mind",
      modelUrl: "",
      question: "Which data structure uses LIFO (Last In First Out) ordering?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: 1, // Stack
      copies: 1,
      caughtCount: 0,
    },
    {
      id: "c102",
      name: "Cyber Dragon",
      value: 50,
      tier: "Legendary",
      image: "🐉",
      mindFile: "legendary.mind",
      modelUrl: "",
      question: "What is the worst-case time complexity of QuickSort?",
      options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
      correctAnswer: 2, // O(n²)
      copies: 1,
      caughtCount: 0,
    },

    // Rare (c201+) - value: 20
    {
      id: "c201",
      name: "Eren Yeager",
      value: 20,
      tier: "Rare",
      image: "⚔️",
      mindFile: "rare.mind",
      modelUrl: "",
      question: "Which HTTP status code signifies a Conflict or duplicate resource?",
      options: ["200", "404", "409", "500"],
      correctAnswer: 2, // 409
      copies: 2,
      caughtCount: 0,
    },
    {
      id: "c202",
      name: "Shadow Phoenix",
      value: 20,
      tier: "Rare",
      image: "🔥",
      mindFile: "rare.mind",
      modelUrl: "",
      question: "In relational databases, what does ACID stand for?",
      options: [
        "Atomicity, Consistency, Isolation, Durability",
        "Accuracy, Control, Indexing, Delivery",
        "Array, Column, Index, Database",
        "Async, Callback, Interval, Defer",
      ],
      correctAnswer: 0,
      copies: 2,
      caughtCount: 0,
    },

    // Common (c301+) - value: 8
    {
      id: "c301",
      name: "Pikachu",
      value: 8,
      tier: "Common",
      image: "⚡",
      mindFile: "common.mind",
      modelUrl: "",
      question: "What does HTML stand for?",
      options: [
        "HyperText Markup Language",
        "High Tech Machine Learning",
        "Hyper Transfer Model Layer",
        "Home Tool Markup Logic",
      ],
      correctAnswer: 0,
      copies: 3,
      caughtCount: 0,
    },
    {
      id: "c302",
      name: "Neon Golem",
      value: 8,
      tier: "Common",
      image: "🤖",
      mindFile: "common.mind",
      modelUrl: "",
      question: "Which protocol is typically used for secure web traffic?",
      options: ["FTP", "HTTP", "HTTPS", "SMTP"],
      correctAnswer: 2, // HTTPS
      copies: 3,
      caughtCount: 0,
    },
  ];

  for (const c of cards) {
    await prisma.card.upsert({
      where: { id: c.id },
      update: {
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
        caughtCount: 0,
      },
      create: c,
    });
  }
  console.log(`Seeded ${cards.length} cards across Common, Rare, and Legendary tiers.`);
  console.log("=== Seed Completed Successfully! ===");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
