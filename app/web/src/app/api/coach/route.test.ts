import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

async function withSessionHistoryDir<T>(callback: () => Promise<T>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "crc-coach-route-"));
  const previous = process.env.SESSION_HISTORY_DIR;

  process.env.SESSION_HISTORY_DIR = dir;

  try {
    return await callback();
  } finally {
    if (typeof previous === "string") {
      process.env.SESSION_HISTORY_DIR = previous;
    } else {
      delete process.env.SESSION_HISTORY_DIR;
    }

    await rm(dir, { recursive: true, force: true });
  }
}

describe("POST /api/coach", () => {
  it("rejects missing required fields", async () => {
    vi.resetModules();
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("learnerId")
    });
  });

  it("rejects an explicit missing listening pack id", async () => {
    vi.resetModules();
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          learnerId: "learner-guy-template",
          mode: "costa-rica",
          difficulty: "beginner",
          scenarioId: "grocery",
          source: "text",
          input: "Necesito arroz, por favor.",
          listeningPackId: "missing-pack"
        })
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "Listening pack not found."
    });
  });

  it("resolves a starting currentTurnId and keeps it on retry", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-guy-template",
            mode: "tutor",
            difficulty: "beginner",
            scenarioId: "grocery",
            selectedBranchOptionId: "grocery-turn-1-qty",
            source: "text",
            input: "Yo necesito arroz"
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioSnapshot: { turnId?: string };
          scenarioState?: { currentTurnId?: string };
          scenarioProgress?: {
            completedTurnIds?: string[];
            totalTurns?: number;
            isComplete?: boolean;
          };
          scenarioFamilyProgress?: unknown;
        };
      };

      expect(payload.session.scenarioSnapshot.turnId).toBe("grocery-turn-1");
      expect(payload.session.scenarioState?.currentTurnId).toBe("grocery-turn-1");
      expect(payload.session.scenarioProgress?.completedTurnIds).toEqual([]);
      expect(payload.session.scenarioProgress?.totalTurns).toBe(3);
      expect(payload.session.scenarioProgress?.isComplete).toBe(false);
      expect(payload.session.scenarioFamilyProgress).toBeUndefined();
    });
  });

  it("advances through branchOptions nextTurnId and serializes scenario state", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-wife-template",
            mode: "couple",
            difficulty: "beginner+",
            scenarioId: "grocery",
            scenarioVariantId: "market-quick-checkout",
            scenarioTurnId: "grocery-turn-3",
            scenarioState: {
              currentTurnId: "grocery-turn-1"
            },
            selectedBranchOptionId: "grocery-turn-1-price",
            listeningPackId: "grocery-market-fast",
            source: "text",
            input: "Buenos dias, necesito medio kilo de arroz, por favor."
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioSnapshot: {
            variantId?: string;
            turnId?: string;
            listeningPackId?: string;
          };
          scenarioState?: { currentTurnId?: string };
          scenarioProgress?: {
            completedTurnIds?: string[];
            totalTurns?: number;
            isComplete?: boolean;
          };
          feedback: {
            recommendedDrills: unknown[];
            coupleHandoff?: unknown;
            listeningRecommendation?: { packId?: string };
          };
        };
      };

      expect(payload.session.scenarioSnapshot.variantId).toBe(
        "market-quick-checkout"
      );
      expect(payload.session.scenarioSnapshot.turnId).toBe("grocery-turn-1");
      expect(payload.session.scenarioState?.currentTurnId).toBe("grocery-turn-2");
      expect(payload.session.scenarioProgress?.completedTurnIds).toEqual([
        "grocery-turn-1"
      ]);
      expect(payload.session.scenarioProgress?.totalTurns).toBe(3);
      expect(payload.session.scenarioProgress?.isComplete).toBe(false);
      expect(payload.session.scenarioSnapshot.listeningPackId).toBe(
        "grocery-market-fast"
      );
      expect(payload.session.feedback.recommendedDrills.length).toBeGreaterThan(0);
      expect(payload.session.feedback.coupleHandoff).toBeTruthy();
      expect(payload.session.feedback.listeningRecommendation?.packId).toBe(
        "grocery-market-fast"
      );
    });
  });

  it("marks the scenario complete at the end of a path", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-guy-template",
            mode: "costa-rica",
            difficulty: "beginner+",
            scenarioId: "grocery",
            scenarioState: {
              currentTurnId: "grocery-turn-3"
            },
            scenarioProgress: {
              completedTurnIds: ["grocery-turn-1", "grocery-turn-2"],
              totalTurns: 3,
              isComplete: false
            },
            selectedBranchOptionId: "grocery-turn-3-bag",
            source: "text",
            input: "No, gracias. Eso es todo."
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioSnapshot: { turnId?: string };
          scenarioState?: { currentTurnId?: string };
          scenarioProgress?: {
            completedTurnIds?: string[];
            totalTurns?: number;
            isComplete?: boolean;
          };
        };
      };

      expect(payload.session.scenarioSnapshot.turnId).toBe("grocery-turn-3");
      expect(payload.session.scenarioState?.currentTurnId).toBe("grocery-turn-3");
      expect(payload.session.scenarioProgress?.completedTurnIds).toEqual([
        "grocery-turn-1",
        "grocery-turn-2",
        "grocery-turn-3"
      ]);
      expect(payload.session.scenarioProgress?.totalTurns).toBe(3);
      expect(payload.session.scenarioProgress?.isComplete).toBe(true);
    });
  });

  it("defaults landlord family progress to replay on incomplete base runs", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-guy-template",
            mode: "costa-rica",
            difficulty: "beginner+",
            scenarioId: "landlord",
            selectedBranchOptionId: "landlord-turn-1-rent",
            source: "text",
            input: "Yo necesito ayuda"
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioSnapshot: { variantId?: string };
          scenarioProgress?: { isComplete?: boolean };
          scenarioFamilyProgress?: {
            attemptMode?: string;
            recommendedNextMode?: string;
            completedVariationIds?: string[];
          };
        };
      };

      expect(payload.session.scenarioSnapshot.variantId).toBe("apartment-tour");
      expect(payload.session.scenarioProgress?.isComplete).toBe(false);
      expect(payload.session.scenarioFamilyProgress).toEqual({
        attemptMode: "replay",
        recommendedNextMode: "replay",
        completedVariationIds: []
      });
    });
  });

  it("defaults healthcare family progress to replay on incomplete base runs", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-guy-template",
            mode: "costa-rica",
            difficulty: "beginner+",
            scenarioId: "healthcare",
            selectedBranchOptionId: "healthcare-turn-1-headache",
            source: "text",
            input: "Tengo dolor de cabeza desde ayer."
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioSnapshot: { variantId?: string };
          scenarioState?: { currentTurnId?: string };
          scenarioProgress?: { isComplete?: boolean };
          scenarioFamilyProgress?: {
            attemptMode?: string;
            recommendedNextMode?: string;
            completedVariationIds?: string[];
          };
        };
      };

      expect(payload.session.scenarioSnapshot.variantId).toBe("pharmacy-counter");
      expect(payload.session.scenarioState?.currentTurnId).toBe(
        "healthcare-turn-2"
      );
      expect(payload.session.scenarioProgress?.isComplete).toBe(false);
      expect(payload.session.scenarioFamilyProgress).toEqual({
        attemptMode: "replay",
        recommendedNextMode: "replay",
        completedVariationIds: []
      });
    });
  });

  it("records completed bank variations and recommends another unused variation", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-guy-template",
            mode: "costa-rica",
            difficulty: "intermediate",
            scenarioId: "bank",
            scenarioVariantId: "transfer-issue",
            scenarioState: {
              currentTurnId: "bank-turn-3"
            },
            scenarioProgress: {
              completedTurnIds: ["bank-turn-1", "bank-turn-2"],
              totalTurns: 3,
              isComplete: false
            },
            selectedBranchOptionId: "bank-turn-3-next-step",
            source: "text",
            input: "Perfecto, espero la llamada para finalizar."
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioProgress?: { isComplete?: boolean };
          scenarioFamilyProgress?: {
            attemptMode?: string;
            recommendedNextMode?: string;
            completedVariationIds?: string[];
          };
        };
      };

      expect(payload.session.scenarioProgress?.isComplete).toBe(true);
      expect(payload.session.scenarioFamilyProgress).toEqual({
        attemptMode: "variation",
        recommendedNextMode: "variation",
        completedVariationIds: ["transfer-issue"]
      });
    });
  });

  it("records completed healthcare variations and recommends another unused variation", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-wife-template",
            mode: "costa-rica",
            difficulty: "beginner+",
            scenarioId: "healthcare",
            scenarioVariantId: "clinic-reception",
            scenarioState: {
              currentTurnId: "healthcare-turn-3"
            },
            scenarioProgress: {
              completedTurnIds: ["healthcare-turn-1", "healthcare-turn-2"],
              totalTurns: 3,
              isComplete: false
            },
            scenarioFamilyProgress: {
              completedVariationIds: []
            },
            selectedBranchOptionId: "healthcare-turn-3-appointment",
            source: "text",
            input: "Perfecto, espero la cita para manana."
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioProgress?: { isComplete?: boolean };
          scenarioFamilyProgress?: {
            attemptMode?: string;
            recommendedNextMode?: string;
            completedVariationIds?: string[];
          };
        };
      };

      expect(payload.session.scenarioProgress?.isComplete).toBe(true);
      expect(payload.session.scenarioFamilyProgress?.attemptMode).toBe(
        "variation"
      );
      expect(payload.session.scenarioFamilyProgress?.recommendedNextMode).toBe(
        "variation"
      );
      expect(payload.session.scenarioFamilyProgress?.completedVariationIds).toEqual([
        "clinic-reception"
      ]);
    });
  });

  it("falls back to replay after the last unused bank variation is completed", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-guy-template",
            mode: "costa-rica",
            difficulty: "intermediate",
            scenarioId: "bank",
            scenarioVariantId: "card-or-statement",
            scenarioState: {
              currentTurnId: "bank-turn-3"
            },
            scenarioProgress: {
              completedTurnIds: ["bank-turn-1", "bank-turn-2"],
              totalTurns: 3,
              isComplete: false
            },
            scenarioFamilyProgress: {
              completedVariationIds: ["transfer-issue", "missing-variation"]
            },
            selectedBranchOptionId: "bank-turn-3-next-step",
            source: "text",
            input: "Perfecto, espero la llamada para finalizar."
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioFamilyProgress?: {
            attemptMode?: string;
            recommendedNextMode?: string;
            completedVariationIds?: string[];
          };
        };
      };

      expect(payload.session.scenarioFamilyProgress).toEqual({
        attemptMode: "variation",
        recommendedNextMode: "replay",
        completedVariationIds: ["transfer-issue", "card-or-statement"]
      });
    });
  });

  it("falls back to replay after the last unused healthcare variation is completed", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    await withSessionHistoryDir(async () => {
      vi.resetModules();
      const { POST } = await import("./route");

      const response = await POST(
        new Request("http://localhost/api/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            learnerId: "learner-wife-template",
            mode: "costa-rica",
            difficulty: "beginner+",
            scenarioId: "healthcare",
            scenarioVariantId: "night-symptoms",
            scenarioState: {
              currentTurnId: "healthcare-turn-3"
            },
            scenarioProgress: {
              completedTurnIds: ["healthcare-turn-1", "healthcare-turn-2"],
              totalTurns: 3,
              isComplete: false
            },
            scenarioFamilyProgress: {
              completedVariationIds: ["clinic-reception", "missing-variation"]
            },
            selectedBranchOptionId: "healthcare-turn-3-thanks",
            source: "text",
            input: "Gracias. Entonces tomo una cada ocho horas."
          })
        })
      );

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        session: {
          scenarioProgress?: { isComplete?: boolean };
          scenarioFamilyProgress?: {
            attemptMode?: string;
            recommendedNextMode?: string;
            completedVariationIds?: string[];
          };
        };
      };

      expect(payload.session.scenarioProgress?.isComplete).toBe(true);
      expect(payload.session.scenarioFamilyProgress).toEqual({
        attemptMode: "variation",
        recommendedNextMode: "replay",
        completedVariationIds: ["clinic-reception", "night-symptoms"]
      });
    });
  });
});
