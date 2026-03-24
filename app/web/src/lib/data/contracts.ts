import type {
  Difficulty,
  DrillKind,
  ErrorTagCode,
  FeedbackMode,
  LearnerReviewSummary,
  PracticeMode,
  PracticeSession,
  ScenarioFamilyProgress,
  ScenarioProgress,
  ScenarioState,
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

export interface ScenarioVariantRecord {
  id: string;
  title: string;
  setup: string;
  localReplyStyle: string;
  pressureNote: string;
  starterPrompt?: string;
}

export interface ScenarioBranchOptionRecord {
  id: string;
  label: string;
  prompt: string;
  nextTurnId: string;
}

export interface ScenarioTurnRecord {
  id: string;
  title: string;
  learnerGoal: string;
  localRole: string;
  prompt: string;
  listenFor: string[];
  repairCue: string;
  branchOptions: ScenarioBranchOptionRecord[];
  coupleHandoffPrompt?: string;
  recommendedDrillIds?: string[];
  listeningPackId?: string;
}

export interface ScenarioDrillRecord {
  id: string;
  kind: DrillKind;
  title: string;
  goal: string;
  prompt: string;
  steps: string[];
  focusTagCodes?: ErrorTagCode[];
  listeningPackId?: string;
}

export interface CoupleSupportRecord {
  sharedGoal: string;
  partnerRoles: string[];
  handoffPrompts: string[];
  keepBothInvolvedTip: string;
}

export interface ListeningCueRecord {
  packId: string;
  focus: string;
  previewLine: string;
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
  partnerRoles: string[];
  likelyMisunderstandings: string[];
  variants: ScenarioVariantRecord[];
  turns: ScenarioTurnRecord[];
  followUpDrills: ScenarioDrillRecord[];
  coupleSupport?: CoupleSupportRecord;
  listeningCues?: ListeningCueRecord[];
}

export interface ListeningTranscriptLineRecord {
  speaker: string;
  text: string;
  speed: "slow" | "natural" | "fast";
  note?: string;
}

export interface ListeningPackRecord {
  id: string;
  title: string;
  scenarioId: string;
  difficulty: Difficulty;
  focus: string;
  challenge: string;
  previewLine: string;
  transcript: ListeningTranscriptLineRecord[];
  comprehensionChecks: string[];
  dictationLine: string;
  shadowingLines: string[];
  cueNotes: string[];
}

export interface PromptBundle {
  correctionPrompt: string;
  systemPrompt: string;
  scenarioPrompt?: string;
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
  listeningPacks: ListeningPackRecord[];
  speech: SpeechCapabilities;
}

export interface CoachRequest {
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
}

export interface CoachContext {
  learner: LearnerProfile;
  scenario: ScenarioRecord;
  prompts: PromptBundle;
  request: CoachRequest;
  listeningPack?: ListeningPackRecord | null;
}

export interface SessionStore {
  listSessions(learnerId: string): Promise<PracticeSession[]>;
  getLearnerReview(learnerId: string): Promise<LearnerReviewSummary>;
  saveSession(session: PracticeSession): Promise<PracticeSession>;
}
