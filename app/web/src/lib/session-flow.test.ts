import { describe, expect, it } from "vitest";

import type { ScenarioRecord } from "@/lib/data/contracts";
import type { PracticeSession } from "@/lib/types";

import {
  currentTurnIdForSession,
  deriveScenarioOutcome,
  findLatestIncompleteSession,
  findScenarioTurnIndex,
  nextScenarioVariantId,
  resumePromptForSession
} from "./session-flow";

function buildScenario(): ScenarioRecord {
  return {
    id: "grocery",
    title: "Grocery Store",
    setting: "Neighborhood market in Costa Rica",
    difficulty: "beginner",
    userGoal: "Ask for basic items.",
    mustKnowVocabulary: ["arroz"],
    starterPrompts: ["Buenos dias, necesito arroz, por favor."],
    culturalNotes: ["Start with a greeting."],
    partnerRoles: ["shopper", "cashier"],
    likelyMisunderstandings: ["The learner may miss the quantity."],
    variants: [
      {
        id: "market-quick-checkout",
        title: "Quick checkout",
        setup: "Fast market line",
        localReplyStyle: "Short and quick",
        pressureNote: "Expect a fast follow-up."
      },
      {
        id: "produce-stand",
        title: "Produce stand",
        setup: "Open-air stand",
        localReplyStyle: "Natural but quick",
        pressureNote: "Listen for weights and prices."
      }
    ],
    turns: [
      {
        id: "grocery-turn-1",
        title: "Open the order",
        learnerGoal: "Ask for the item.",
        localRole: "cashier",
        prompt: "Buenos dias. Que necesita hoy?",
        listenFor: ["greeting"],
        repairCue: "Add the quantity.",
        branchOptions: [
          {
            id: "grocery-turn-1-qty",
            label: "Add quantity",
            prompt: "Necesito medio kilo de arroz, por favor.",
            nextTurnId: "grocery-turn-2"
          }
        ]
      },
      {
        id: "grocery-turn-2",
        title: "Confirm the amount",
        learnerGoal: "Confirm the total.",
        localRole: "cashier",
        prompt: "Claro. Son 1800 colones. Le parece bien?",
        listenFor: ["price"],
        repairCue: "Repeat the price more slowly.",
        branchOptions: [
          {
            id: "grocery-turn-2-confirm",
            label: "Confirm",
            prompt: "Si, esta bien.",
            nextTurnId: "grocery-turn-3"
          }
        ]
      },
      {
        id: "grocery-turn-3",
        title: "Close the purchase",
        learnerGoal: "Close politely.",
        localRole: "cashier",
        prompt: "Perfecto. Le llevo una bolsa mas?",
        listenFor: ["closing"],
        repairCue: "Add one closing detail.",
        branchOptions: [
          {
            id: "grocery-turn-3-thanks",
            label: "Close politely",
            prompt: "No, gracias. Eso es todo.",
            nextTurnId: "grocery-turn-end"
          }
        ]
      }
    ],
    followUpDrills: []
  };
}

function buildSession(
  overrides: Partial<PracticeSession> = {}
): PracticeSession {
  return {
    id: "session-1",
    learnerId: "learner-guy-template",
    createdAt: "2026-03-23T12:00:00.000Z",
    mode: "costa-rica",
    difficulty: "beginner",
    scenarioId: "grocery",
    scenarioSnapshot: {
      id: "grocery",
      title: "Grocery Store",
      setting: "Neighborhood market in Costa Rica",
      userGoal: "Ask for basic items.",
      variantId: "market-quick-checkout",
      variantLabel: "Quick checkout",
      turnId: "grocery-turn-1",
      turnLabel: "Open the order",
      turnPrompt: "Buenos dias. Que necesita hoy?",
      listeningPackId: "grocery-market-fast",
      listeningPackTitle: "Grocery Market Fast Speech"
    },
    scenarioState: {
      currentTurnId: "grocery-turn-1"
    },
    scenarioProgress: {
      completedTurnIds: [],
      totalTurns: 3,
      isComplete: false
    },
    source: "text",
    userInput: "Yo necesito arroz",
    feedback: {
      provider: "local-rules",
      inputMode: "text",
      transcriptText: "Yo necesito arroz",
      correctedText: "Necesito arroz, por favor.",
      naturalText: "Quisiera arroz, por favor.",
      explanationSummary: "Short correction.",
      errorTags: [
        {
          code: "REGISTER_MISMATCH",
          severity: "primary",
          message: "A softer request will sound more natural."
        }
      ],
      retryPrompt: "Try again with one short useful sentence.",
      followUpPrompt: "Ahora confirma el precio.",
      vocabNotes: [],
      pronunciationHints: [],
      feedbackMode: "gentle",
      learnerFocus: "beginner",
      scenarioId: "grocery",
      sessionId: "session-1",
      reviewRecommendation: {
        shouldReview: true,
        reason: "Review this turn before moving on.",
        nextStep: "Repeat the retry once, then try again."
      },
      recommendedDrills: [],
      confidenceScore: 0.6
    },
    ...overrides
  };
}

describe("session flow helpers", () => {
  it("derives retry, continue, and complete outcomes from saved session state", () => {
    const retrySession = buildSession();
    const continueSession = buildSession({
      scenarioState: {
        currentTurnId: "grocery-turn-2"
      },
      scenarioProgress: {
        completedTurnIds: ["grocery-turn-1"],
        totalTurns: 3,
        isComplete: false
      },
      feedback: {
        ...buildSession().feedback,
        errorTags: []
      }
    });
    const completeSession = buildSession({
      scenarioSnapshot: {
        ...buildSession().scenarioSnapshot,
        turnId: "grocery-turn-3"
      },
      scenarioState: {
        currentTurnId: "grocery-turn-3"
      },
      scenarioProgress: {
        completedTurnIds: [
          "grocery-turn-1",
          "grocery-turn-2",
          "grocery-turn-3"
        ],
        totalTurns: 3,
        isComplete: true
      },
      feedback: {
        ...buildSession().feedback,
        errorTags: []
      }
    });

    expect(deriveScenarioOutcome(retrySession)).toBe("retry");
    expect(deriveScenarioOutcome(continueSession)).toBe("continue");
    expect(deriveScenarioOutcome(completeSession)).toBe("complete");
    expect(currentTurnIdForSession(continueSession)).toBe("grocery-turn-2");
  });

  it("finds the latest incomplete session in a stored session list", () => {
    const completeSession = buildSession({
      id: "session-complete",
      createdAt: "2026-03-23T13:00:00.000Z",
      scenarioProgress: {
        completedTurnIds: [
          "grocery-turn-1",
          "grocery-turn-2",
          "grocery-turn-3"
        ],
        totalTurns: 3,
        isComplete: true
      }
    });
    const incompleteSession = buildSession({
      id: "session-incomplete",
      createdAt: "2026-03-23T12:00:00.000Z",
      scenarioState: {
        currentTurnId: "grocery-turn-2"
      },
      scenarioProgress: {
        completedTurnIds: ["grocery-turn-1"],
        totalTurns: 3,
        isComplete: false
      }
    });

    expect(
      findLatestIncompleteSession([completeSession, incompleteSession])?.id
    ).toBe("session-incomplete");
  });

  it("cycles to the next variant and wraps around when trying a variation", () => {
    const scenario = buildScenario();

    expect(
      nextScenarioVariantId(scenario, "market-quick-checkout")
    ).toBe("produce-stand");
    expect(nextScenarioVariantId(scenario, "produce-stand")).toBe(
      "market-quick-checkout"
    );
    expect(nextScenarioVariantId(scenario, "missing")).toBe(
      "market-quick-checkout"
    );
  });

  it("maps turn ids to visible turn numbers and chooses the right resume prompt", () => {
    const scenario = buildScenario();
    const retrySession = buildSession();
    const continueSession = buildSession({
      scenarioState: {
        currentTurnId: "grocery-turn-2"
      },
      scenarioProgress: {
        completedTurnIds: ["grocery-turn-1"],
        totalTurns: 3,
        isComplete: false
      },
      feedback: {
        ...buildSession().feedback,
        errorTags: []
      }
    });

    expect(findScenarioTurnIndex(scenario, "grocery-turn-2")).toBe(1);
    expect(resumePromptForSession(retrySession)).toBe(
      "Try again with one short useful sentence."
    );
    expect(resumePromptForSession(continueSession)).toBe(
      "Ahora confirma el precio."
    );
  });
});
