import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import type { PracticeSession } from "@/lib/types";

function buildSession(
  id: string,
  createdAt: string,
  retryPrompt: string,
  drillTitle: string,
  listeningPreviewLine: string
): PracticeSession {
  return {
    id,
    learnerId: "learner-review-test",
    createdAt,
    mode: "couple",
    difficulty: "beginner+",
    scenarioId: "grocery",
    scenarioSnapshot: {
      id: "grocery",
      title: "Grocery Store",
      setting: "Neighborhood market in Costa Rica",
      userGoal: "Ask for basic items, prices, and quantities.",
      variantId: "market-quick-checkout",
      variantLabel: "Quick checkout",
      turnId: id === "session-1" ? "grocery-turn-1" : "grocery-turn-2",
      turnLabel: id === "session-1" ? "Open the order" : "Confirm the amount",
      turnPrompt:
        id === "session-1"
          ? "Buenos dias. Que necesita hoy?"
          : "Claro. Son 1800 colones. Le parece bien?",
      partnerRole: "cashier",
      listeningPackId: "grocery-market-fast",
      listeningPackTitle: "Grocery Market Fast Speech"
    },
    source: "speech",
    userInput: "Yo necesito arroz, por favor.",
    feedback: {
      provider: "local-rules",
      inputMode: "speech",
      transcriptText: "Yo necesito arroz, por favor.",
      correctedText: "Necesito arroz, por favor.",
      naturalText: "Quisiera arroz, por favor.",
      explanationSummary: "Short correction for the review test.",
      errorTags: [
        {
          code: "REGISTER_MISMATCH",
          severity: "primary",
          message: "A slightly softer phrasing will sound more natural in this situation."
        }
      ],
      retryPrompt,
      followUpPrompt: "Ahora tu pareja pregunta por el precio.",
      vocabNotes: [
        {
          term: "arroz",
          gloss: "rice",
          note: "Useful for market basics."
        }
      ],
      pronunciationHints: [
        {
          term: "arroz",
          hint: "Roll the rr lightly and keep both vowels clean."
        }
      ],
      feedbackMode: "standard",
      learnerFocus: "survival",
      scenarioId: "grocery",
      sessionId: id,
      reviewRecommendation: {
        shouldReview: true,
        reason: "Review this turn before moving on.",
        nextStep: "Repeat the retry once, then do it again from memory."
      },
      recommendedDrills: [
        {
          id: `${id}-retry`,
          kind: "retry",
          title: drillTitle,
          reason: "Practice the correction once, then do it from memory.",
          prompt: "Quisiera arroz, por favor.",
          steps: [
            {
              label: "Model",
              prompt: "Quisiera arroz, por favor."
            },
            {
              label: "Retry",
              prompt: retryPrompt
            }
          ],
          focusTagCode: "REGISTER_MISMATCH",
          scenarioId: "grocery",
          scenarioTitle: "Grocery Store",
          sourceSessionId: id,
          listeningPackId: "grocery-market-fast"
        },
        {
          id: `${id}-dictation`,
          kind: "dictation",
          title: "Listening lab: Grocery Market Fast Speech",
          reason: "Use this pack to train your ear for quick market speech.",
          prompt: "Claro. Son 1800 colones. Le llevo bolsa?",
          steps: [
            {
              label: "Listen for",
              prompt: listeningPreviewLine
            }
          ],
          scenarioId: "grocery",
          scenarioTitle: "Grocery Store",
          sourceSessionId: id,
          listeningPackId: "grocery-market-fast"
        }
      ],
      coupleHandoff: {
        leadRole: "Partner A asks for the item and quantity",
        supportRole: "Partner B confirms the total or asks for a bag",
        handoffPrompt: "Ahora tu pareja pregunta por el precio.",
        coachingTip: "Keep each reply to one useful detail."
      },
      listeningRecommendation: {
        packId: "grocery-market-fast",
        packTitle: "Grocery Market Fast Speech",
        reason: "Use this pack to train your ear for checkout language.",
        previewLine: listeningPreviewLine
      },
      confidenceScore: 0.62
    }
  };
}

async function withSessionHistoryDir<T>(callback: (dir: string) => Promise<T>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "crc-session-store-"));
  const previous = process.env.SESSION_HISTORY_DIR;

  process.env.SESSION_HISTORY_DIR = dir;

  try {
    return await callback(dir);
  } finally {
    if (typeof previous === "string") {
      process.env.SESSION_HISTORY_DIR = previous;
    } else {
      delete process.env.SESSION_HISTORY_DIR;
    }

    await rm(dir, { recursive: true, force: true });
  }
}

describe("session store review summary", () => {
  it("preserves richer session metadata and aggregates drills/listening review", async () => {
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      const { getSessionStore } = await import("./session-store");
      const store = getSessionStore();

      await store.saveSession(
        buildSession(
          "session-1",
          "2026-03-22T00:00:00.000Z",
          "Try again with one short useful sentence.",
          "Retry Register Mismatch",
          "Me da medio kilo de tomates y un kilo de bananos?"
        )
      );
      await store.saveSession(
        buildSession(
          "session-2",
          "2026-03-22T01:00:00.000Z",
          "Try again with a softer request and keep it short.",
          "Retry Register Mismatch Again",
          "Claro. Son 1800 colones. Le llevo bolsa?"
        )
      );

      const sessions = await store.listSessions("learner-review-test");
      const review = await store.getLearnerReview("learner-review-test");

      expect(sessions[0]?.scenarioSnapshot.turnId).toBe("grocery-turn-2");
      expect(sessions[0]?.feedback.listeningRecommendation?.packId).toBe(
        "grocery-market-fast"
      );
      expect(review.recurringTags[0]?.code).toBe("REGISTER_MISMATCH");
      expect(review.recentMistakes[0]?.correctedText).toBe(
        "Necesito arroz, por favor."
      );
      expect(review.recommendedDrills.length).toBeGreaterThan(0);
      expect(review.nextRecommendedDrill?.steps.length).toBeGreaterThan(0);
      expect(review.listeningRecommendations[0]?.packId).toBe(
        "grocery-market-fast"
      );
    });
  });

  it("reloads saved sessions after a fresh module import", async () => {
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      const firstModule = await import("./session-store");
      const firstStore = firstModule.getSessionStore();

      await firstStore.saveSession(
        buildSession(
          "session-1",
          "2026-03-22T00:00:00.000Z",
          "Try again with one short useful sentence.",
          "Retry Register Mismatch",
          "Me da medio kilo de tomates y un kilo de bananos?"
        )
      );

      vi.resetModules();
      const secondModule = await import("./session-store");
      const secondStore = secondModule.getSessionStore();
      const sessions = await secondStore.listSessions("learner-review-test");

      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.id).toBe("session-1");
      expect(sessions[0]?.scenarioSnapshot.turnId).toBe("grocery-turn-1");
    });
  });
});
