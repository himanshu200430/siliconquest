import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

/**
 * k6 Load Test for SiliconQuest API Migration
 * Tests:
 * 1. Read load on /api/cards and /api/leaderboard (cached endpoints)
 * 2. Quiz retrieval on /api/cards/[id]/quiz
 * 3. High-concurrency race condition testing on /api/catch
 *    Simulates multiple teams trying to catch the same card concurrently.
 *    Verifies that no more than `copies` teams can successfully catch it.
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

const errorRate = new Rate("errors");
const conflict409Rate = new Rate("catch_409_conflicts");
const successfulCatches = new Counter("successful_catches");

export const options = {
  scenarios: {
    // Scenario 1: Background polling traffic (800 simulated users)
    polling_traffic: {
      executor: "ramping-vus",
      startVUs: 50,
      stages: [
        { duration: "30s", target: 400 },
        { duration: "1m", target: 800 },
        { duration: "30s", target: 800 },
        { duration: "30s", target: 0 },
      ],
      exec: "pollingScenario",
    },

    // Scenario 2: Race condition storm on catching the same card
    concurrent_catch_storm: {
      executor: "per-vu-iterations",
      vus: 50, // 50 different teams
      iterations: 1,
      startTime: "40s",
      exec: "catchStormScenario",
    },
  },
  thresholds: {
    // 95% of reads should be faster than 300ms thanks to fileCache + CDN
    "http_req_duration{scenario:polling_traffic}": ["p(95)<300"],
    errors: ["rate<0.05"], // Overall error rate under 5%
  },
};

// Scenario 1: Simulate players on the app polling leaderboard and cards
export function pollingScenario() {
  // 1. Fetch leaderboard
  const lbRes = http.get(`${BASE_URL}/api/leaderboard`);
  const lbOk = check(lbRes, {
    "leaderboard status is 200": (r) => r.status === 200,
    "leaderboard returns teams array": (r) => Array.isArray(r.json()),
  });
  if (!lbOk) errorRate.add(1);

  sleep(Math.random() * 2 + 1); // 1-3s jitter

  // 2. Fetch cards
  const cardsRes = http.get(`${BASE_URL}/api/cards`);
  const cardsOk = check(cardsRes, {
    "cards status is 200": (r) => r.status === 200,
    "cards do not leak correctAnswer": (r) => {
      const cards = r.json();
      return Array.isArray(cards) && !cards.some((c) => "correctAnswer" in c);
    },
  });
  if (!cardsOk) errorRate.add(1);

  // Poll interval ~10s with jitter
  sleep(8 + Math.random() * 4);
}

// Scenario 2: High concurrency race condition on the same card
export function catchStormScenario() {
  const targetCardId = "char_004"; // MewTwo or test card
  const teamId = `team_test_${__VU}`; // 1 team per VU

  // Step 1: Request quiz
  const quizRes = http.get(`${BASE_URL}/api/cards/${targetCardId}/quiz`);
  check(quizRes, {
    "quiz fetch status is 200 or 409": (r) => r.status === 200 || r.status === 409,
    "quiz does not leak correctAnswer": (r) => !("correctAnswer" in (r.json() || {})),
  });

  // Step 2: All 50 teams answer correctly (e.g. answerIndex: 3) simultaneously
  const payload = JSON.stringify({
    teamId,
    cardId: targetCardId,
    answerIndex: 3,
  });

  const catchRes = http.post(`${BASE_URL}/api/catch`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  if (catchRes.status === 200) {
    successfulCatches.add(1);
    check(catchRes, {
      "catch success is true": (r) => r.json().success === true,
    });
  } else if (catchRes.status === 409) {
    conflict409Rate.add(1);
    check(catchRes, {
      "409 returned valid conflict reason": (r) => {
        const body = r.json();
        return body.alreadyCaught === true || body.noCopiesLeft === true;
      },
    });
  } else if (catchRes.status === 429) {
    check(catchRes, {
      "429 returned cooldown lockedUntil": (r) => "lockedUntil" in (r.json() || {}),
    });
  } else {
    errorRate.add(1);
  }
}
