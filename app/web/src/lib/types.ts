export type PracticeMode = "tutor" | "roleplay" | "costa-rica" | "couple";

export type Difficulty =
  | "beginner"
  | "beginner+"
  | "intermediate"
  | "natural"
  | "costa-rica-fast";

export type SessionSource = "text" | "paste" | "speech";

export const ERROR_TAG_CODES = [
  "SER_ESTAR",
  "VERB_CONJUGATION",
  "TENSE_SELECTION",
  "ARTICLE_MISSING",
  "GENDER_AGREEMENT",
  "NUMBER_AGREEMENT",
  "PREPOSITION",
  "WORD_ORDER",
  "INFINITIVE_MISUSE",
  "LITERAL_TRANSLATION",
  "VOCAB_CHOICE",
  "REGISTER_MISMATCH",
  "LISTENING_MISHEAR",
  "PRONUNCIATION_LIKELY",
  "CLARITY_REPAIR_NEEDED"
] as const;

export type ErrorTagCode = (typeof ERROR_TAG_CODES)[number];
export type ErrorSeverity = "primary" | "secondary";
export type FeedbackMode = "gentle" | "standard" | "detailed" | "strict";
export type LearnerFocus = "beginner" | "survival" | "naturalization";
export type DrillKind =
  | "retry"
  | "contrast"
  | "roleplay-reset"
  | "shadowing"
  | "dictation"
  | "partner-handoff";

export interface ErrorTag {
  code: ErrorTagCode;
  severity: ErrorSeverity;
  message: string;
}

export interface VocabNote {
  term: string;
  gloss: string;
  note: string;
}

export interface PronunciationHint {
  term: string;
  hint: string;
}

export interface ReviewRecommendation {
  shouldReview: boolean;
  reason: string;
  nextStep: string;
}

export interface DrillStep {
  label: string;
  prompt: string;
}

export interface CoupleHandoff {
  leadRole: string;
  supportRole: string;
  handoffPrompt: string;
  coachingTip: string;
}

export interface ListeningRecommendation {
  packId: string;
  packTitle: string;
  reason: string;
  previewLine: string;
}

export interface ScenarioSnapshot {
  id: string;
  title: string;
  setting: string;
  userGoal: string;
  variantId?: string;
  variantLabel?: string;
  turnId?: string;
  turnLabel?: string;
  turnPrompt?: string;
  partnerRole?: string;
  listeningPackId?: string;
  listeningPackTitle?: string;
}

export interface ScenarioState {
  currentTurnId: string;
}

export interface ScenarioProgress {
  completedTurnIds: string[];
  totalTurns: number;
  isComplete: boolean;
}

export type ScenarioAttemptMode = "replay" | "variation";

export interface ScenarioFamilyProgress {
  attemptMode?: ScenarioAttemptMode;
  recommendedNextMode?: ScenarioAttemptMode;
  completedVariationIds?: string[];
}

export interface RecommendedDrill {
  id: string;
  kind: DrillKind;
  title: string;
  reason: string;
  prompt: string;
  steps: DrillStep[];
  focusTagCode?: ErrorTagCode;
  scenarioId?: string;
  scenarioTitle?: string;
  sourceSessionId?: string;
  listeningPackId?: string;
}

export interface Feedback {
  provider: string;
  inputMode: SessionSource;
  transcriptText: string;
  correctedText: string;
  naturalText: string;
  explanationSummary: string;
  errorTags: ErrorTag[];
  retryPrompt: string;
  followUpPrompt: string;
  vocabNotes: VocabNote[];
  pronunciationHints: PronunciationHint[];
  feedbackMode: FeedbackMode;
  learnerFocus: LearnerFocus;
  scenarioId: string;
  sessionId: string;
  reviewRecommendation: ReviewRecommendation;
  recommendedDrills: RecommendedDrill[];
  coupleHandoff?: CoupleHandoff;
  listeningRecommendation?: ListeningRecommendation;
  confidenceScore: number;
}

export type FeedbackDraft = Omit<Feedback, "sessionId">;

export interface PracticeSession {
  id: string;
  learnerId: string;
  createdAt: string;
  mode: PracticeMode;
  difficulty: Difficulty;
  scenarioId: string;
  scenarioSnapshot: ScenarioSnapshot;
  scenarioState?: ScenarioState;
  scenarioProgress?: ScenarioProgress;
  scenarioFamilyProgress?: ScenarioFamilyProgress;
  source: SessionSource;
  userInput: string;
  feedback: Feedback;
}

export interface RecentMistake {
  sessionId: string;
  createdAt: string;
  inputMode: SessionSource;
  scenarioId: string;
  scenarioTitle: string;
  transcriptText: string;
  correctedText: string;
  primaryTag: ErrorTag;
  retryPrompt: string;
}

export interface RecurringTagSummary {
  code: ErrorTagCode;
  count: number;
  lastSeenAt: string;
  lastMessage: string;
  lastScenarioId: string;
  lastScenarioTitle: string;
  sampleCorrection: string;
}

export interface LearnerReviewSummary {
  learnerId: string;
  generatedAt: string;
  totalSessions: number;
  averageConfidence: number;
  recentMistakes: RecentMistake[];
  recurringTags: RecurringTagSummary[];
  recommendedDrills: RecommendedDrill[];
  nextRecommendedDrill: RecommendedDrill | null;
  listeningRecommendations: ListeningRecommendation[];
}
