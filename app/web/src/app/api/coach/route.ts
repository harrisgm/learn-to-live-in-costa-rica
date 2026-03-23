import { NextResponse } from "next/server";

import type { CoachRequest } from "@/lib/data/contracts";
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
  const selectedTurn = scenario.turns.find(
    (turn) => turn.id === payload.scenarioTurnId
  ) ?? scenario.turns[0];
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
