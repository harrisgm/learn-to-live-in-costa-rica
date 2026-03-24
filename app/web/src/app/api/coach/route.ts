import { NextResponse } from "next/server";

import type {
  CoachRequest,
  ScenarioBranchOptionRecord,
  ScenarioRecord,
  ScenarioTurnRecord
} from "@/lib/data/contracts";
import type { ScenarioAttemptMode, ScenarioFamilyProgress } from "@/lib/types";
import {
  findLearner,
  findListeningPack,
  findScenario,
  loadPromptBundle
} from "@/lib/data/loaders";
import { generateFeedback } from "@/lib/server/coach-engine";
import {
  createSession,
  createSessionId,
  getSessionStore
} from "@/lib/server/session-store";

export const runtime = "nodejs";

const SCENARIO_FAMILY_PROGRESS_IDS = new Set([
  "landlord",
  "bank",
  "healthcare"
]);

function supportsScenarioFamilyProgress(scenarioId: string) {
  return SCENARIO_FAMILY_PROGRESS_IDS.has(scenarioId);
}

function resolveCurrentTurnId(
  payload: Partial<CoachRequest>,
  scenario: ScenarioRecord
) {
  return (
    payload.scenarioState?.currentTurnId ??
    payload.scenarioTurnId ??
    scenario.turns[0]?.id
  );
}

function resolveCurrentTurn(
  payload: Partial<CoachRequest>,
  scenario: ScenarioRecord
): ScenarioTurnRecord | undefined {
  const currentTurnId = resolveCurrentTurnId(payload, scenario);

  return (
    scenario.turns.find((turn) => turn.id === currentTurnId) ??
    scenario.turns[0]
  );
}

function resolveSelectedBranch(
  turn: ScenarioTurnRecord | undefined,
  selectedBranchOptionId?: string
): ScenarioBranchOptionRecord | undefined {
  if (!turn) {
    return undefined;
  }

  return (
    turn.branchOptions.find((branch) => branch.id === selectedBranchOptionId) ??
    turn.branchOptions[0]
  );
}

function normalizeCompletedTurnIds(
  payload: Partial<CoachRequest>,
  scenario: ScenarioRecord
) {
  const validTurnIds = new Set(scenario.turns.map((turn) => turn.id));

  return Array.from(
    new Set(
      (payload.scenarioProgress?.completedTurnIds ?? []).filter((turnId) =>
        validTurnIds.has(turnId)
      )
    )
  );
}

function resolveScenarioAttemptMode(
  scenario: ScenarioRecord,
  scenarioVariantId?: string
): ScenarioAttemptMode {
  const defaultVariantId = scenario.variants[0]?.id;

  if (!scenarioVariantId || scenarioVariantId === defaultVariantId) {
    return "replay";
  }

  return "variation";
}

function normalizeCompletedVariationIds(
  payload: Partial<CoachRequest>,
  scenario: ScenarioRecord
) {
  const defaultVariantId = scenario.variants[0]?.id;
  const validVariationIds = new Set(
    scenario.variants.flatMap((variant) =>
      variant.id && variant.id !== defaultVariantId ? [variant.id] : []
    )
  );

  return Array.from(
    new Set(
      (payload.scenarioFamilyProgress?.completedVariationIds ?? []).filter(
        (variationId) => validVariationIds.has(variationId)
      )
    )
  );
}

function buildScenarioFamilyProgress(input: {
  payload: Partial<CoachRequest>;
  scenario: ScenarioRecord;
  selectedVariantId?: string;
  isComplete: boolean;
}): ScenarioFamilyProgress | undefined {
  const { payload, scenario, selectedVariantId, isComplete } = input;

  if (!supportsScenarioFamilyProgress(scenario.id)) {
    return undefined;
  }

  const attemptMode = resolveScenarioAttemptMode(scenario, selectedVariantId);
  const completedVariationIds = normalizeCompletedVariationIds(payload, scenario);
  const updatedCompletedVariationIds =
    isComplete && attemptMode === "variation" && selectedVariantId
      ? Array.from(new Set([...completedVariationIds, selectedVariantId]))
      : completedVariationIds;
  const remainingVariationIds = scenario.variants
    .slice(1)
    .flatMap((variant) =>
      variant.id && !updatedCompletedVariationIds.includes(variant.id)
        ? [variant.id]
        : []
    );

  return {
    attemptMode,
    recommendedNextMode:
      !isComplete || remainingVariationIds.length === 0 ? "replay" : "variation",
    completedVariationIds: updatedCompletedVariationIds
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<CoachRequest>;
  const trimmedInput = payload.input?.trim();

  if (
    !payload.learnerId ||
    !payload.mode ||
    !payload.difficulty ||
    !payload.scenarioId ||
    !trimmedInput ||
    !payload.source
  ) {
    return NextResponse.json(
      { error: "learnerId, mode, difficulty, scenarioId, input, and source are required." },
      { status: 400 }
    );
  }

  const [learner, scenario, prompts] = await Promise.all([
    findLearner(payload.learnerId),
    findScenario(payload.scenarioId),
    loadPromptBundle(payload.mode, payload.difficulty, payload.scenarioId)
  ]);

  if (!learner) {
    return NextResponse.json({ error: "Learner not found." }, { status: 404 });
  }

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }

  const selectedVariant = scenario.variants.find(
    (variant) => variant.id === payload.scenarioVariantId
  ) ?? scenario.variants[0];
  const selectedTurn = resolveCurrentTurn(payload, scenario);
  const selectedBranch = resolveSelectedBranch(
    selectedTurn,
    payload.selectedBranchOptionId
  );
  const resolvedListeningPackId =
    payload.listeningPackId ??
    selectedTurn?.listeningPackId ??
    scenario.listeningCues?.[0]?.packId;
  const listeningPack = resolvedListeningPackId
    ? await findListeningPack(resolvedListeningPackId)
    : null;

  if (payload.listeningPackId && !listeningPack) {
    return NextResponse.json(
      { error: "Listening pack not found." },
      { status: 404 }
    );
  }

  const sessionId = createSessionId();
  const feedback = await generateFeedback({
    learner,
    scenario,
    prompts,
    request: {
      ...(payload as CoachRequest),
      input: trimmedInput
    },
    listeningPack
  });
  const didAdvanceScenario = feedback.errorTags.length === 0;
  const nextTurn = selectedBranch
    ? scenario.turns.find((turn) => turn.id === selectedBranch.nextTurnId)
    : undefined;
  const completedTurnIds = didAdvanceScenario
    ? Array.from(
        new Set([
          ...normalizeCompletedTurnIds(payload, scenario),
          selectedTurn?.id
        ].filter((turnId): turnId is string => Boolean(turnId)))
      )
    : normalizeCompletedTurnIds(payload, scenario);
  const scenarioProgress = {
    completedTurnIds,
    totalTurns: scenario.turns.length,
    isComplete: didAdvanceScenario && (!selectedBranch || !nextTurn)
  };
  const scenarioFamilyProgress = buildScenarioFamilyProgress({
    payload,
    scenario,
    selectedVariantId: selectedVariant?.id,
    isComplete: scenarioProgress.isComplete
  });
  const scenarioState = selectedTurn
    ? {
        currentTurnId:
          didAdvanceScenario && nextTurn ? nextTurn.id : selectedTurn.id
      }
    : undefined;

  const session = createSession({
    id: sessionId,
    learnerId: payload.learnerId,
    mode: payload.mode,
    difficulty: payload.difficulty,
    scenarioId: payload.scenarioId,
    scenarioSnapshot: {
      id: scenario.id,
      title: scenario.title,
      setting: scenario.setting,
      userGoal: scenario.userGoal,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.title,
      turnId: selectedTurn?.id,
      turnLabel: selectedTurn?.title,
      turnPrompt: selectedTurn?.prompt,
      partnerRole: selectedTurn?.localRole ?? scenario.partnerRoles[0],
      listeningPackId: listeningPack?.id,
      listeningPackTitle: listeningPack?.title
    },
    scenarioState,
    scenarioProgress,
    scenarioFamilyProgress,
    source: payload.source,
    userInput: trimmedInput,
    feedback: {
      ...feedback,
      sessionId
    }
  });

  await getSessionStore().saveSession(session);

  return NextResponse.json({ session });
}
