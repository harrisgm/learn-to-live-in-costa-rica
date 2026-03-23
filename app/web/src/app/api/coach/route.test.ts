import { describe, expect, it } from "vitest";

describe("POST /api/coach", () => {
  it("rejects missing required fields", async () => {
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

  it("returns enriched scenario snapshot fields on success", async () => {
    delete process.env.OPENAI_API_KEY;

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
          scenarioTurnId: "grocery-turn-1",
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
