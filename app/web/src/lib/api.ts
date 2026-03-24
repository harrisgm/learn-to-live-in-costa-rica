import type { BootstrapPayload } from "@/lib/data/contracts";
import type {
  Difficulty,
  FeedbackMode,
  LearnerReviewSummary,
  PracticeMode,
  PracticeSession,
  ScenarioFamilyProgress,
  ScenarioProgress,
  ScenarioState,
  SessionSource
} from "@/lib/types";

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload as T;
}

export async function fetchBootstrap() {
  const response = await fetch("/api/bootstrap", {
    cache: "no-store"
  });

  return readJson<BootstrapPayload>(response);
}

export async function fetchSessions(learnerId: string) {
  const response = await fetch(
    `/api/sessions?learnerId=${encodeURIComponent(learnerId)}`,
    {
      cache: "no-store"
    }
  );

  return readJson<{ sessions: PracticeSession[]; review: LearnerReviewSummary }>(
    response
  );
}

export async function runCoach(payload: {
  learnerId: string;
  mode: PracticeMode;
  difficulty: Difficulty;
  scenarioId: string;
  input: string;
  source: SessionSource;
  feedbackMode?: FeedbackMode;
  scenarioVariantId?: string;
  scenarioTurnId?: string;
  scenarioState?: ScenarioState;
  scenarioProgress?: ScenarioProgress;
  scenarioFamilyProgress?: ScenarioFamilyProgress;
  selectedBranchOptionId?: string;
  listeningPackId?: string;
}) {
  const response = await fetch("/api/coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJson<{ session: PracticeSession }>(response);
}

export async function transcribeAudio(file: Blob) {
  const formData = new FormData();
  formData.append("audio", file, "practice.webm");

  const response = await fetch("/api/speech/transcribe", {
    method: "POST",
    body: formData
  });

  return readJson<{ transcript: string; provider: string; warning?: string }>(response);
}
