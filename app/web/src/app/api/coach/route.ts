import { NextResponse } from "next/server";

import type { CoachRequest } from "@/lib/data/contracts";
import { findLearner, findScenario, loadPromptBundle } from "@/lib/data/loaders";
import { generateFeedback } from "@/lib/server/coach-engine";
import { createSession, getSessionStore } from "@/lib/server/session-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<CoachRequest>;

  if (
    !payload.learnerId ||
    !payload.mode ||
    !payload.difficulty ||
    !payload.scenarioId ||
    !payload.input ||
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
    loadPromptBundle(payload.mode, payload.difficulty)
  ]);

  if (!learner) {
    return NextResponse.json({ error: "Learner not found." }, { status: 404 });
  }

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }

  const feedback = await generateFeedback({
    learner,
    scenario,
    prompts,
    request: payload as CoachRequest
  });

  const session = createSession({
    learnerId: payload.learnerId,
    mode: payload.mode,
    difficulty: payload.difficulty,
    scenarioId: payload.scenarioId,
    source: payload.source,
    userInput: payload.input.trim(),
    feedback
  });

  await getSessionStore().saveSession(session);

  return NextResponse.json({ session });
}
