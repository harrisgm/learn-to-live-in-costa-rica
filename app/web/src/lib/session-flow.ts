import type { ScenarioRecord } from "@/lib/data/contracts";
import type { PracticeSession } from "@/lib/types";

export type ScenarioOutcomeKind = "retry" | "continue" | "complete";

export function currentTurnIdForSession(session: PracticeSession) {
  return session.scenarioState?.currentTurnId ?? session.scenarioSnapshot.turnId;
}

export function attemptedTurnIdForSession(session: PracticeSession) {
  return session.scenarioSnapshot.turnId;
}

export function deriveScenarioOutcome(
  session: PracticeSession
): ScenarioOutcomeKind | null {
  const attemptedTurnId = attemptedTurnIdForSession(session);
  const currentTurnId = currentTurnIdForSession(session);

  if (!attemptedTurnId || !currentTurnId) {
    return null;
  }

  if (session.scenarioProgress?.isComplete) {
    return "complete";
  }

  return currentTurnId === attemptedTurnId ? "retry" : "continue";
}

export function findLatestIncompleteSession(sessions: PracticeSession[]) {
  return (
    sessions.find(
      (session) => session.scenarioProgress && !session.scenarioProgress.isComplete
    ) ?? null
  );
}

export function findScenarioTurnIndex(
  scenario: Pick<ScenarioRecord, "turns"> | null,
  turnId?: string
) {
  if (!scenario || !turnId) {
    return -1;
  }

  return scenario.turns.findIndex((turn) => turn.id === turnId);
}

export function nextScenarioVariantId(
  scenario: Pick<ScenarioRecord, "variants"> | null,
  currentVariantId?: string
) {
  if (!scenario || scenario.variants.length === 0) {
    return "";
  }

  if (!currentVariantId) {
    return scenario.variants[0]?.id ?? "";
  }

  const currentIndex = scenario.variants.findIndex(
    (variant) => variant.id === currentVariantId
  );

  if (currentIndex < 0) {
    return scenario.variants[0]?.id ?? "";
  }

  return (
    scenario.variants[(currentIndex + 1) % scenario.variants.length]?.id ??
    scenario.variants[0]?.id ??
    ""
  );
}

export function resumePromptForSession(session: PracticeSession) {
  const outcome = deriveScenarioOutcome(session);

  if (outcome === "continue") {
    return session.feedback.followUpPrompt;
  }

  if (outcome === "retry") {
    return session.feedback.retryPrompt;
  }

  return session.feedback.correctedText;
}
