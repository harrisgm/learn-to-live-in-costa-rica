import { describe, expect, it, vi } from "vitest";

describe("generateFeedback", () => {
  it("emits couple handoff, listening recommendation, and richer drills in fallback mode", async () => {
    delete process.env.OPENAI_API_KEY;

    const { generateFeedback } = await import("./coach-engine");
    const {
      findLearner,
      findListeningPack,
      findScenario,
      loadPromptBundle
    } = await import("../data/loaders");

    const learner = await findLearner("learner-wife-template");
    const scenario = await findScenario("grocery");
    const listeningPack = await findListeningPack("grocery-market-fast");
    const prompts = await loadPromptBundle("couple", "beginner+", "grocery");

    expect(learner).not.toBeNull();
    expect(scenario).not.toBeNull();
    expect(listeningPack).not.toBeNull();

    const feedback = await generateFeedback({
      learner: learner!,
      scenario: scenario!,
      prompts,
      listeningPack,
      request: {
        learnerId: learner!.id,
        mode: "couple",
        difficulty: "beginner+",
        scenarioId: scenario!.id,
        scenarioVariantId: "market-quick-checkout",
        scenarioTurnId: "grocery-turn-1",
        listeningPackId: listeningPack!.id,
        input: "Buenos dias, necesito medio kilo de arroz, por favor.",
        source: "text"
      }
    });

    expect(feedback.provider).toBe("local-rules");
    expect(feedback.coupleHandoff?.handoffPrompt).toContain("tu pareja");
    expect(feedback.listeningRecommendation?.packId).toBe("grocery-market-fast");
    expect(feedback.followUpPrompt).toContain("tu pareja");
    expect(
      feedback.recommendedDrills.some((drill) => drill.kind === "partner-handoff")
    ).toBe(true);
    expect(
      feedback.recommendedDrills.some((drill) => drill.kind === "dictation")
    ).toBe(true);
  });

  it("keeps softer phrasing heuristics from over-triggering register mismatch", async () => {
    delete process.env.OPENAI_API_KEY;

    const { generateFeedback } = await import("./coach-engine");
    const {
      findLearner,
      findScenario,
      loadPromptBundle
    } = await import("../data/loaders");

    const learner = await findLearner("learner-guy-template");
    const scenario = await findScenario("grocery");
    const prompts = await loadPromptBundle("tutor", "beginner", "grocery");

    const feedback = await generateFeedback({
      learner: learner!,
      scenario: scenario!,
      prompts,
      listeningPack: null,
      request: {
        learnerId: learner!.id,
        mode: "tutor",
        difficulty: "beginner",
        scenarioId: scenario!.id,
        input: "Necesito arroz y frijoles, por favor.",
        source: "text"
      }
    });

    expect(feedback.errorTags.map((tag) => tag.code)).not.toContain(
      "REGISTER_MISMATCH"
    );
  });

  it("preserves mandatory couple and listening drills when AI feedback returns its own drills", async () => {
    process.env.OPENAI_API_KEY = "test-key";

    vi.doMock("@/lib/server/openai", () => ({
      getOpenAIClient: () => ({
        responses: {
          create: async () => ({
            output_text: JSON.stringify({
              correctedText: "Necesito medio kilo de arroz, por favor.",
              naturalText: "Me da medio kilo de arroz, por favor.",
              explanationSummary: "Good start. Tighten the request a little.",
              errorTags: [
                {
                  code: "VOCAB_CHOICE",
                  severity: "primary",
                  message: "Use the most natural request pattern for checkout."
                }
              ],
              retryPrompt: "Me da medio kilo de arroz, por favor.",
              followUpPrompt: "Ahora pregunta si aceptan tarjeta.",
              recommendedDrills: [
                {
                  id: "ai-retry",
                  kind: "retry",
                  title: "Retry the checkout request",
                  reason: "Use the shorter checkout phrasing once more.",
                  prompt: "Me da medio kilo de arroz, por favor.",
                  steps: [
                    {
                      label: "Retry",
                      prompt: "Me da medio kilo de arroz, por favor."
                    }
                  ]
                },
                {
                  id: "ai-contrast",
                  kind: "contrast",
                  title: "Contrast the request",
                  reason: "Hear the shorter request and say it back.",
                  prompt: "Me da medio kilo de arroz, por favor.",
                  steps: [
                    {
                      label: "Model",
                      prompt: "Me da medio kilo de arroz, por favor."
                    }
                  ]
                }
              ],
              confidenceScore: 0.82
            })
          })
        }
      })
    }));

    const { generateFeedback } = await import("./coach-engine");
    const {
      findLearner,
      findListeningPack,
      findScenario,
      loadPromptBundle
    } = await import("../data/loaders");

    const learner = await findLearner("learner-wife-template");
    const scenario = await findScenario("grocery");
    const listeningPack = await findListeningPack("grocery-market-fast");
    const prompts = await loadPromptBundle("couple", "beginner+", "grocery");

    const feedback = await generateFeedback({
      learner: learner!,
      scenario: scenario!,
      prompts,
      listeningPack,
      request: {
        learnerId: learner!.id,
        mode: "couple",
        difficulty: "beginner+",
        scenarioId: scenario!.id,
        scenarioVariantId: "market-quick-checkout",
        scenarioTurnId: "grocery-turn-1",
        listeningPackId: listeningPack!.id,
        input: "Buenos dias, necesito medio kilo de arroz, por favor.",
        source: "text"
      }
    });

    expect(feedback.provider).toBe("local-rules");
    expect(
      feedback.recommendedDrills.some((drill) => drill.kind === "partner-handoff")
    ).toBe(true);
    expect(
      feedback.recommendedDrills.some(
        (drill) =>
          drill.kind === "dictation" &&
          drill.listeningPackId === "grocery-market-fast"
      )
    ).toBe(true);
  });
});
