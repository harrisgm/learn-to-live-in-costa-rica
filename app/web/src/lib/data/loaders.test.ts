import { describe, expect, it } from "vitest";

describe("data loaders", () => {
  it("loads enriched scenarios and listening packs into bootstrap payload", async () => {
    const {
      findListeningPack,
      loadBootstrapPayload
    } = await import("./loaders");

    const payload = await loadBootstrapPayload();
    const grocery = payload.scenarios.find((scenario) => scenario.id === "grocery");

    expect(payload.learners.length).toBeGreaterThan(0);
    expect(payload.listeningPacks.length).toBeGreaterThanOrEqual(5);
    expect(grocery?.variants.length).toBeGreaterThan(0);
    expect(grocery?.turns[0]?.id).toBe("grocery-turn-1");
    expect(grocery?.turns[0]?.branchOptions.length).toBeGreaterThan(0);
    expect(
      grocery?.turns.some(
        (turn) => turn.id === grocery.turns[0]?.branchOptions[0]?.nextTurnId
      )
    ).toBe(true);
    expect(grocery?.coupleSupport?.handoffPrompts.length).toBeGreaterThan(0);
    expect(grocery?.listeningCues?.[0]?.packId).toBe("grocery-market-fast");

    const listeningPack = await findListeningPack("grocery-market-fast");

    expect(listeningPack?.scenarioId).toBe("grocery");
    expect(listeningPack?.dictationLine).toContain("1800");
  });

  it("loads scenario-specific roleplay prompts when present", async () => {
    const { loadPromptBundle } = await import("./loaders");

    const bankPromptBundle = await loadPromptBundle(
      "roleplay",
      "beginner+",
      "bank"
    );
    const neighborPromptBundle = await loadPromptBundle(
      "costa-rica",
      "beginner",
      "neighbor-smalltalk"
    );

    expect(bankPromptBundle.scenarioPrompt).toContain("Bank Roleplay");
    expect(neighborPromptBundle.scenarioPrompt).toContain(
      "Neighbor Small Talk Roleplay"
    );
  });
});
