export type PracticeMode = "tutor" | "roleplay" | "costa-rica" | "couple";

export type Difficulty =
  | "beginner"
  | "beginner+"
  | "intermediate"
  | "natural"
  | "costa-rica-fast";

export interface CoachFeedback {
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
  createdAt: string;
  mode: PracticeMode;
  difficulty: Difficulty;
  scenario: string;
  userInput: string;
  feedback: CoachFeedback;
}
