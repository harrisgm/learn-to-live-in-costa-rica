import type {
  Difficulty,
  PracticeMode,
  PracticeSession,
  SessionSource
} from "@/lib/types";

export interface LearnerProfile {
  id: string;
  displayName: string;
  learnerLevel: Difficulty | "natural";
  goals: string[];
  strengths: string[];
  challenges: string[];
  confidenceNotes?: string;
  privacyLevel: "public-template" | "private-local";
}

export interface ScenarioRecord {
  id: string;
  title: string;
  setting: string;
  difficulty: Difficulty;
  userGoal: string;
  mustKnowVocabulary: string[];
  starterPrompts: string[];
  culturalNotes: string[];
}

export interface PromptBundle {
  correctionPrompt: string;
  systemPrompt: string;
}

export interface SpeechCapabilities {
  provider: string;
  enabled: boolean;
  acceptedMimeTypes: string[];
  warning?: string;
}

export interface BootstrapPayload {
  learners: LearnerProfile[];
  scenarios: ScenarioRecord[];
  speech: SpeechCapabilities;
}

export interface CoachRequest {
  learnerId: string;
  mode: PracticeMode;
  difficulty: Difficulty;
  scenarioId: string;
  input: string;
  source: SessionSource;
}

export interface CoachContext {
  learner: LearnerProfile;
  scenario: ScenarioRecord;
  prompts: PromptBundle;
  request: CoachRequest;
}

export interface SessionStore {
  listSessions(learnerId: string): Promise<PracticeSession[]>;
  saveSession(session: PracticeSession): Promise<PracticeSession>;
}
