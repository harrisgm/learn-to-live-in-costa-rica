export type PracticeMode = "tutor" | "roleplay" | "costa-rica" | "couple";

export type Difficulty =
  | "beginner"
  | "beginner+"
  | "intermediate"
  | "natural"
  | "costa-rica-fast";

export type SessionSource = "text" | "paste" | "speech";

export interface Feedback {
  provider: string;
  correctedSpanish: string;
  naturalSpanish: string;
  explanation: string;
  vocabularyNotes: string[];
  pronunciationNotes: string[];
  followUpReply: string;
  errorTags: string[];
  confidenceScore: number;
}

export interface PracticeSession {
  id: string;
  learnerId: string;
  createdAt: string;
  mode: PracticeMode;
  difficulty: Difficulty;
  scenarioId: string;
  source: SessionSource;
  userInput: string;
  feedback: Feedback;
}
