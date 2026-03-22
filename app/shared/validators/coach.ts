import type { PracticeSession } from "../types/coach";

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<PracticeSession>;
  return (
    typeof session.id === "string" &&
    typeof session.createdAt === "string" &&
    typeof session.mode === "string" &&
    typeof session.difficulty === "string" &&
    typeof session.scenario === "string" &&
    typeof session.userInput === "string" &&
    typeof session.feedback === "object" &&
    session.feedback !== null
  );
}
