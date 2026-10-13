/**
 * Comprehensive Automated Website Test Suite for SiliconQuest
 * Tests all static assets, pages, read routes, write routes, concurrency locks, and admin routes.
 */

const BASE_URL = "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ PASS: ${name}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, details: message });
    console.error(`❌ FAIL: ${name} -> ${message}`);
  }
}

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting Full Website Automated Test Suite");
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log("==================================================\n");

  // 1. Test Homepage
  await runTest("1. Frontend Home Page (GET /)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes("Animeverse")) throw new Error("Missing 'Animeverse' title in HTML");
    if (!html.includes("ACM USAR")) throw new Error("Missing 'ACM USAR' logo accessibility text in HTML");
  });

  // 2. Test Static Assets
  await runTest("2. Static Assets (/acm-logo.png, /pokeball.svg, .mind targets)", async () => {
    const logoRes = await fetch(`${BASE_URL}/acm-logo.png`);
    if (!logoRes.ok) throw new Error(`ACM logo status ${logoRes.status}`);

    const svgRes = await fetch(`${BASE_URL}/pokeball.svg`);
    if (!svgRes.ok) throw new Error(`Pokeball SVG status ${svgRes.status}`);

    const mindRes = await fetch(`${BASE_URL}/ar-targets/common.mind`);
    if (!mindRes.ok) throw new Error(`MindAR target common.mind status ${mindRes.status}`);
  });

  // 3. Test GET /api/cards
  let firstCardId = "";
  await runTest("3. GET /api/cards (Leak Check & Data Validity)", async () => {
    const res = await fetch(`${BASE_URL}/api/cards`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Cards list is empty");
    
    firstCardId = data[0].id;
    for (const card of data) {
      if (card.correctAnswer !== undefined) {
        throw new Error(`SECURITY VULNERABILITY: correctAnswer leaked in /api/cards for card ${card.id}`);
      }
      if (card.question !== undefined) {
        throw new Error(`Question leaked in /api/cards for card ${card.id}`);
      }
      if (card.options !== undefined) {
        throw new Error(`Options leaked in /api/cards for card ${card.id}`);
      }
      if (typeof card.copiesLeft !== "number") {
        throw new Error(`Missing copiesLeft calculation for card ${card.id}`);
      }
    }
  });

  // 4. Test GET /api/cards/[id]/quiz
  await runTest("4. GET /api/cards/[id]/quiz (Question delivery without correctAnswer leak)", async () => {
    if (!firstCardId) throw new Error("No card ID available");
    const res = await fetch(`${BASE_URL}/api/cards/${firstCardId}/quiz`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const quiz = await res.json();
    if (!quiz.question) throw new Error("Missing quiz question");
    if (!Array.isArray(quiz.options) || quiz.options.length < 2) throw new Error("Invalid quiz options");
    if (quiz.correctAnswer !== undefined) {
      throw new Error("SECURITY VULNERABILITY: correctAnswer leaked in /api/cards/[id]/quiz");
    }
  });

  // 5. Test GET /api/leaderboard
  let testTeamId = "";
  await runTest("5. GET /api/leaderboard (Sorted teams & Caching Headers)", async () => {
    const res = await fetch(`${BASE_URL}/api/leaderboard`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const teams = await res.json();
    if (!Array.isArray(teams) || teams.length === 0) throw new Error("Leaderboard is empty");
    
    testTeamId = teams[0].id;
    for (let i = 0; i < teams.length - 1; i++) {
      if (teams[i].score < teams[i + 1].score) {
        throw new Error(`Leaderboard not sorted descending: team ${teams[i].teamName} has less score than ${teams[i+1].teamName}`);
      }
    }
    const cacheHeader = res.headers.get("Cache-Control");
    if (!cacheHeader) throw new Error("Missing Cache-Control header");
  });

  // 6. Test GET /api/team/[id]
  await runTest("6. GET /api/team/[id] (Team caught cards status)", async () => {
    if (!testTeamId) throw new Error("No test team ID");
    const res = await fetch(`${BASE_URL}/api/team/${testTeamId}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.id || !Array.isArray(data.caughtCards)) {
      throw new Error("Malformed team cards response");
    }
  });

  // 7. Test GET /api/admin/data
  await runTest("7. GET /api/admin/data (Admin portal data sync)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/data`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.teams) || !Array.isArray(data.cards)) {
      throw new Error("Malformed admin data response");
    }
  });

  // 8. Test POST /api/admin/mutate (Auth Protection)
  await runTest("8. POST /api/admin/mutate (Auth Protection)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/mutate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_team",
        teamName: "HackerTeam",
        adminPassword: "wrong-password",
      }),
    });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // 9. Test POST /api/catch (Wrong Answer Penalty & Server Cooldown 429 Lock)
  await runTest("9. POST /api/catch (Wrong answer -> 60s cooldown -> 429 lock)", async () => {
    const tempTeamName = "CooldownTest_" + Date.now();
    
    // Create temporary team for cooldown test
    const createRes = await fetch(`${BASE_URL}/api/admin/mutate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_team",
        teamName: tempTeamName,
        adminPassword: "fest2026",
      }),
    });
    if (!createRes.ok) throw new Error("Failed to create temporary test team");

    // Fetch team ID from admin data
    const teamsRes = await fetch(`${BASE_URL}/api/admin/data`);
    const teamsData = await teamsRes.json();
    const tempTeam = teamsData.teams.find((t: { teamName: string; id: string }) => t.teamName === tempTeamName);
    if (!tempTeam) throw new Error("Could not find created temporary test team");
    const tempTeamId = tempTeam.id;

    try {
      // 1st attempt: wrong answerIndex (999)
      const res1 = await fetch(`${BASE_URL}/api/catch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: tempTeamId,
          cardId: firstCardId,
          answerIndex: 999, // intentional wrong answer
        }),
      });
      const data1 = await res1.json();
      if (data1.correct !== false) throw new Error("Wrong answer was incorrectly marked as correct");
      if (typeof data1.cooldownSeconds !== "number" || data1.cooldownSeconds < 60) {
        throw new Error(`Expected at least 60s cooldown penalty, got ${data1.cooldownSeconds}`);
      }

      // 2nd attempt: immediately retry -> MUST be rejected with 429 Too Many Requests
      const res2 = await fetch(`${BASE_URL}/api/catch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: tempTeamId,
          cardId: firstCardId,
          answerIndex: 0,
        }),
      });
      if (res2.status !== 429) {
        throw new Error(`Expected 429 Too Many Requests due to cooldown, got ${res2.status}`);
      }
      const data2 = await res2.json();
      if (!data2.lockedUntil) {
        throw new Error("Missing lockedUntil timestamp in 429 response");
      }
    } finally {
      // Clean up temporary team
      await fetch(`${BASE_URL}/api/admin/mutate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_team",
          id: tempTeamId,
          adminPassword: "fest2026",
        }),
      });
    }
  });

  console.log("\n==================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`📊 Test Summary: ${passedCount} / ${results.length} PASSED`);
  if (passedCount === results.length) {
    console.log("🎉 ALL TESTS PASSED! The website is functioning perfectly.");
  } else {
    console.error("⚠️ Some tests failed. Please review output above.");
  }
  console.log("==================================================");
}

main().catch(console.error);
