import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import type { SessionStore } from "@/lib/data/contracts";
import type {
  CoupleHandoff,
  DrillKind,
  DrillStep,
  ErrorSeverity,
  ErrorTag,
  ErrorTagCode,
  Feedback,
  FeedbackMode,
  LearnerFocus,
  LearnerReviewSummary,
  ListeningRecommendation,
  PracticeSession,
  PronunciationHint,
  RecurringTagSummary,
  RecommendedDrill,
  ReviewRecommendation,
  ScenarioSnapshot,
  SessionSource,
  VocabNote
} from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __crcMemorySessions: Map<string, PracticeSession[]> | undefined;
  // eslint-disable-next-line no-var
  var __crcPgPool: Pool | undefined;
}

function deriveFeedbackMode(difficulty: PracticeSession["difficulty"]): FeedbackMode {
  if (difficulty === "natural" || difficulty === "costa-rica-fast") {
    return "strict";
  }

  if (difficulty === "intermediate") {
    return "detailed";
  }

  if (difficulty === "beginner") {
    return "gentle";
  }

  return "standard";
}

function deriveLearnerFocus(difficulty: PracticeSession["difficulty"]): LearnerFocus {
  if (difficulty === "natural" || difficulty === "costa-rica-fast") {
    return "naturalization";
  }

  if (difficulty === "beginner") {
    return "beginner";
  }

  return "survival";
}

function normalizeErrorCode(value: unknown): ErrorTagCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const allowed: ErrorTagCode[] = [
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
  ];

  if (allowed.includes(normalized as ErrorTagCode)) {
    return normalized as ErrorTagCode;
  }

  const legacyMap: Record<string, ErrorTagCode> = {
    PUNCTUATION: "CLARITY_REPAIR_NEEDED",
    SHORT_RESPONSE: "CLARITY_REPAIR_NEEDED",
    SUBJECT_PRONOUN_OVERUSE: "REGISTER_MISMATCH",
    REGISTER: "REGISTER_MISMATCH",
    LITERAL_TRANSLATION: "LITERAL_TRANSLATION"
  };

  return legacyMap[normalized] ?? null;
}

function fallbackReviewRecommendation(
  errorTags: ErrorTag[],
  retryPrompt: string,
  confidenceScore: number
): ReviewRecommendation {
  const primaryTag = errorTags.find((tag) => tag.severity === "primary") ?? errorTags[0];

  if (!primaryTag && confidenceScore >= 0.8) {
    return {
      shouldReview: false,
      reason: "This turn is solid enough to keep the conversation moving.",
      nextStep: "Use the follow-up prompt to keep practicing."
    };
  }

  return {
    shouldReview: true,
    reason: primaryTag
      ? `Review this because ${primaryTag.message.toLowerCase()}`
      : "Review this turn before moving on.",
    nextStep: retryPrompt
      ? `Repeat the retry once, then try it again from memory. ${retryPrompt}`
      : "Repeat the corrected version once, then try again from memory."
  };
}

function asDrillKind(value: unknown): DrillKind | null {
  if (
    value === "retry" ||
    value === "contrast" ||
    value === "roleplay-reset" ||
    value === "shadowing" ||
    value === "dictation" ||
    value === "partner-handoff"
  ) {
    return value;
  }

  return null;
}

function normalizeDrillSteps(value: unknown, fallbackPrompt: string): DrillStep[] {
  if (!Array.isArray(value)) {
    return [
      {
        label: "Repeat once",
        prompt: fallbackPrompt
      }
    ];
  }

  const parsed = value.flatMap((item): DrillStep[] => {
    if (typeof item === "string" && item.trim()) {
      return [
        {
          label: "Practice",
          prompt: item.trim()
        }
      ];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Partial<DrillStep>;

    if (typeof candidate.prompt !== "string" || !candidate.prompt.trim()) {
      return [];
    }

    return [
      {
        label:
          typeof candidate.label === "string" && candidate.label.trim()
            ? candidate.label.trim()
            : "Practice",
        prompt: candidate.prompt.trim()
      }
    ];
  });

  return parsed.length > 0
    ? parsed.slice(0, 4)
    : [
        {
          label: "Repeat once",
          prompt: fallbackPrompt
        }
      ];
}

function normalizeScenarioSnapshot(
  value: unknown,
  scenarioId: string
): ScenarioSnapshot {
  if (value && typeof value === "object") {
    const candidate = value as Partial<ScenarioSnapshot>;

    if (
      typeof candidate.id === "string" &&
      typeof candidate.title === "string" &&
      typeof candidate.setting === "string" &&
      typeof candidate.userGoal === "string"
    ) {
      return {
        id: candidate.id,
        title: candidate.title,
        setting: candidate.setting,
        userGoal: candidate.userGoal,
        variantId:
          typeof candidate.variantId === "string" ? candidate.variantId : undefined,
        variantLabel:
          typeof candidate.variantLabel === "string"
            ? candidate.variantLabel
            : undefined,
        turnId: typeof candidate.turnId === "string" ? candidate.turnId : undefined,
        turnLabel:
          typeof candidate.turnLabel === "string"
            ? candidate.turnLabel
            : undefined,
        turnPrompt:
          typeof candidate.turnPrompt === "string"
            ? candidate.turnPrompt
            : undefined,
        partnerRole:
          typeof candidate.partnerRole === "string"
            ? candidate.partnerRole
            : undefined,
        listeningPackId:
          typeof candidate.listeningPackId === "string"
            ? candidate.listeningPackId
            : undefined,
        listeningPackTitle:
          typeof candidate.listeningPackTitle === "string"
            ? candidate.listeningPackTitle
            : undefined
      };
    }
  }

  return {
    id: scenarioId,
    title: scenarioId,
    setting: "",
    userGoal: ""
  };
}

function normalizeErrorTags(value: unknown): ErrorTag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ErrorTag[] => {
    if (typeof item === "string") {
      const code = normalizeErrorCode(item);

      return code
        ? [
            {
              code,
              severity: "secondary",
              message: item
            }
          ]
        : [];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Partial<ErrorTag>;
    const code = normalizeErrorCode(candidate.code);

    if (!code) {
      return [];
    }

    return [
      {
        code,
        severity:
          candidate.severity === "primary" ? "primary" : "secondary",
        message:
          typeof candidate.message === "string" && candidate.message.trim()
            ? candidate.message.trim()
            : code
      }
    ];
  });
}

function normalizeVocabNotes(value: unknown): VocabNote[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): VocabNote[] => {
    if (typeof item === "string") {
      return [
        {
          term: item,
          gloss: "useful phrase",
          note: "Useful phrase to keep handy in this scenario."
        }
      ];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Partial<VocabNote>;

    if (typeof candidate.term !== "string" || !candidate.term.trim()) {
      return [];
    }

    return [
      {
        term: candidate.term.trim(),
        gloss:
          typeof candidate.gloss === "string" && candidate.gloss.trim()
            ? candidate.gloss.trim()
            : "useful phrase",
        note:
          typeof candidate.note === "string" && candidate.note.trim()
            ? candidate.note.trim()
            : "Useful phrase to keep handy in this scenario."
      }
    ];
  });
}

function normalizePronunciationHints(value: unknown): PronunciationHint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): PronunciationHint[] => {
    if (typeof item === "string") {
      return [{ term: "focus", hint: item }];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Partial<PronunciationHint>;

    if (typeof candidate.hint !== "string" || !candidate.hint.trim()) {
      return [];
    }

    return [
      {
        term:
          typeof candidate.term === "string" && candidate.term.trim()
            ? candidate.term.trim()
            : "focus",
        hint: candidate.hint.trim()
      }
    ];
  });
}

function normalizeCoupleHandoff(value: unknown): CoupleHandoff | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<CoupleHandoff>;

  if (
    typeof candidate.leadRole !== "string" ||
    typeof candidate.supportRole !== "string" ||
    typeof candidate.handoffPrompt !== "string" ||
    typeof candidate.coachingTip !== "string"
  ) {
    return undefined;
  }

  return {
    leadRole: candidate.leadRole,
    supportRole: candidate.supportRole,
    handoffPrompt: candidate.handoffPrompt,
    coachingTip: candidate.coachingTip
  };
}

function normalizeListeningRecommendation(
  value: unknown
): ListeningRecommendation | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<ListeningRecommendation>;

  if (
    typeof candidate.packId !== "string" ||
    typeof candidate.packTitle !== "string" ||
    typeof candidate.reason !== "string" ||
    typeof candidate.previewLine !== "string"
  ) {
    return undefined;
  }

  return {
    packId: candidate.packId,
    packTitle: candidate.packTitle,
    reason: candidate.reason,
    previewLine: candidate.previewLine
  };
}

function fallbackRecommendedDrills(
  session: Pick<
    PracticeSession,
    "id" | "scenarioId" | "userInput" | "source"
  > & { scenarioTitle?: string },
  errorTags: ErrorTag[],
  correctedText: string,
  retryPrompt: string
): RecommendedDrill[] {
  const primaryTag = errorTags.find((tag) => tag.severity === "primary") ?? errorTags[0];

  return [
    {
      id: `${session.id}-retry`,
      kind: "retry",
      title: primaryTag
        ? `Retry ${formatErrorCode(primaryTag.code)}`
        : "Retry the corrected line",
      reason: primaryTag
        ? `${formatErrorCode(primaryTag.code)} is the clearest next fix for this turn.`
        : "Repeat the corrected line once, then try again from memory.",
      prompt: correctedText,
      steps: [
        {
          label: "Model",
          prompt: correctedText
        },
        {
          label: "Retry",
          prompt: retryPrompt
        }
      ],
      focusTagCode: primaryTag?.code,
      scenarioId: session.scenarioId,
      scenarioTitle: session.scenarioTitle,
      sourceSessionId: session.id
    }
  ];
}

function normalizeRecommendedDrills(
  value: unknown,
  session: Pick<
    PracticeSession,
    "id" | "scenarioId" | "userInput" | "source"
  > & { scenarioTitle?: string },
  errorTags: ErrorTag[],
  correctedText: string,
  retryPrompt: string
): RecommendedDrill[] {
  if (!Array.isArray(value)) {
    return fallbackRecommendedDrills(session, errorTags, correctedText, retryPrompt);
  }

  const parsed = value.flatMap((item, index): RecommendedDrill[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Partial<RecommendedDrill>;
    const kind = asDrillKind(candidate.kind);

    if (
      !kind ||
      typeof candidate.title !== "string" ||
      typeof candidate.reason !== "string" ||
      typeof candidate.prompt !== "string"
    ) {
      return [];
    }

    return [
      {
        id:
          typeof candidate.id === "string" && candidate.id.trim()
            ? candidate.id
            : `${session.id}-${kind}-${index + 1}`,
        kind,
        title: candidate.title,
        reason: candidate.reason,
        prompt: candidate.prompt,
        steps: normalizeDrillSteps(candidate.steps, candidate.prompt),
        focusTagCode: normalizeErrorCode(candidate.focusTagCode) ?? undefined,
        scenarioId:
          typeof candidate.scenarioId === "string"
            ? candidate.scenarioId
            : session.scenarioId,
        scenarioTitle:
          typeof candidate.scenarioTitle === "string"
            ? candidate.scenarioTitle
            : session.scenarioTitle,
        sourceSessionId:
          typeof candidate.sourceSessionId === "string"
            ? candidate.sourceSessionId
            : session.id,
        listeningPackId:
          typeof candidate.listeningPackId === "string"
            ? candidate.listeningPackId
            : undefined
      }
    ];
  });

  return parsed.length > 0
    ? parsed.slice(0, 4)
    : fallbackRecommendedDrills(session, errorTags, correctedText, retryPrompt);
}

function normalizeFeedback(
  value: unknown,
  session: Pick<
    PracticeSession,
    "id" | "difficulty" | "source" | "scenarioId" | "userInput"
  > & {
    scenarioTitle?: string;
  }
): Feedback {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const feedbackMode = deriveFeedbackMode(session.difficulty);
  const learnerFocus = deriveLearnerFocus(session.difficulty);

  const correctedText =
    typeof raw.correctedText === "string"
      ? raw.correctedText
      : typeof raw.correctedSpanish === "string"
        ? raw.correctedSpanish
        : session.userInput;

  const naturalText =
    typeof raw.naturalText === "string"
      ? raw.naturalText
      : typeof raw.naturalSpanish === "string"
        ? raw.naturalSpanish
        : correctedText;

  const retryPrompt =
    typeof raw.retryPrompt === "string" && raw.retryPrompt.trim()
      ? raw.retryPrompt.trim()
      : `Try again using this idea: ${correctedText}`;

  const errorTags = normalizeErrorTags(raw.errorTags);

  return {
    provider:
      typeof raw.provider === "string" && raw.provider.trim()
        ? raw.provider
        : "local-rules",
    inputMode:
      raw.inputMode === "text" || raw.inputMode === "paste" || raw.inputMode === "speech"
        ? raw.inputMode
        : session.source,
    transcriptText:
      typeof raw.transcriptText === "string" && raw.transcriptText.trim()
        ? raw.transcriptText
        : session.userInput,
    correctedText,
    naturalText,
    explanationSummary:
      typeof raw.explanationSummary === "string"
        ? raw.explanationSummary
        : typeof raw.explanation === "string"
          ? raw.explanation
          : "The correction keeps your meaning and makes the Spanish easier to use in real life.",
    errorTags,
    retryPrompt,
    followUpPrompt:
      typeof raw.followUpPrompt === "string"
        ? raw.followUpPrompt
        : typeof raw.followUpReply === "string"
          ? raw.followUpReply
          : "Keep the conversation moving with one more short reply.",
    vocabNotes:
      normalizeVocabNotes(raw.vocabNotes).length > 0
        ? normalizeVocabNotes(raw.vocabNotes)
        : normalizeVocabNotes(raw.vocabularyNotes),
    pronunciationHints:
      normalizePronunciationHints(raw.pronunciationHints).length > 0
        ? normalizePronunciationHints(raw.pronunciationHints)
        : normalizePronunciationHints(raw.pronunciationNotes),
    feedbackMode:
      raw.feedbackMode === "gentle" ||
      raw.feedbackMode === "standard" ||
      raw.feedbackMode === "detailed" ||
      raw.feedbackMode === "strict"
        ? raw.feedbackMode
        : feedbackMode,
    learnerFocus:
      raw.learnerFocus === "beginner" ||
      raw.learnerFocus === "survival" ||
      raw.learnerFocus === "naturalization"
        ? raw.learnerFocus
        : learnerFocus,
    scenarioId:
      typeof raw.scenarioId === "string" && raw.scenarioId.trim()
        ? raw.scenarioId
        : session.scenarioId,
    sessionId:
      typeof raw.sessionId === "string" && raw.sessionId.trim()
        ? raw.sessionId
        : session.id,
    reviewRecommendation:
      raw.reviewRecommendation && typeof raw.reviewRecommendation === "object"
        ? {
            shouldReview:
              typeof (raw.reviewRecommendation as Partial<ReviewRecommendation>).shouldReview === "boolean"
                ? (raw.reviewRecommendation as Partial<ReviewRecommendation>).shouldReview!
                : fallbackReviewRecommendation(errorTags, retryPrompt, 0.6).shouldReview,
            reason:
              typeof (raw.reviewRecommendation as Partial<ReviewRecommendation>).reason === "string"
                ? (raw.reviewRecommendation as Partial<ReviewRecommendation>).reason!
                : fallbackReviewRecommendation(errorTags, retryPrompt, 0.6).reason,
            nextStep:
              typeof (raw.reviewRecommendation as Partial<ReviewRecommendation>).nextStep === "string"
                ? (raw.reviewRecommendation as Partial<ReviewRecommendation>).nextStep!
                : fallbackReviewRecommendation(errorTags, retryPrompt, 0.6).nextStep
          }
        : fallbackReviewRecommendation(
            errorTags,
            retryPrompt,
            typeof raw.confidenceScore === "number" ? raw.confidenceScore : 0.6
          ),
    recommendedDrills: normalizeRecommendedDrills(
      raw.recommendedDrills ?? raw.reviewDrills,
      session,
      errorTags,
      correctedText,
      retryPrompt
    ),
    coupleHandoff: normalizeCoupleHandoff(raw.coupleHandoff),
    listeningRecommendation: normalizeListeningRecommendation(
      raw.listeningRecommendation
    ),
    confidenceScore:
      typeof raw.confidenceScore === "number"
        ? Math.max(0, Math.min(1, raw.confidenceScore))
        : 0.6
  };
}

function normalizeStoredSession(value: unknown): PracticeSession {
  const raw = value as Partial<PracticeSession> &
    Record<string, unknown> & {
      feedback?: unknown;
      scenario_context?: unknown;
      scenarioSnapshot?: unknown;
    };

  const scenarioId =
    typeof raw.scenarioId === "string"
      ? raw.scenarioId
      : typeof raw.scenario === "string"
        ? raw.scenario
        : "unknown-scenario";

  const base: Pick<
    PracticeSession,
    "id" | "learnerId" | "createdAt" | "mode" | "difficulty" | "scenarioId" | "source" | "userInput"
  > = {
    id: typeof raw.id === "string" ? raw.id : randomUUID(),
    learnerId: typeof raw.learnerId === "string" ? raw.learnerId : "unknown-learner",
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    mode:
      raw.mode === "tutor" ||
      raw.mode === "roleplay" ||
      raw.mode === "costa-rica" ||
      raw.mode === "couple"
        ? raw.mode
        : "tutor",
    difficulty:
      raw.difficulty === "beginner" ||
      raw.difficulty === "beginner+" ||
      raw.difficulty === "intermediate" ||
      raw.difficulty === "natural" ||
      raw.difficulty === "costa-rica-fast"
        ? raw.difficulty
        : "beginner",
    scenarioId,
    source:
      raw.source === "text" || raw.source === "paste" || raw.source === "speech"
        ? raw.source
        : "text",
    userInput: typeof raw.userInput === "string" ? raw.userInput : ""
  };

  const scenarioSnapshot = normalizeScenarioSnapshot(
    raw.scenarioSnapshot ?? raw.scenario_context,
    scenarioId
  );

  return {
    ...base,
    scenarioSnapshot,
    feedback: normalizeFeedback(raw.feedback, {
      ...base,
      scenarioTitle: scenarioSnapshot.title
    })
  };
}

function formatErrorCode(code: ErrorTagCode) {
  return code
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildLearnerReview(
  learnerId: string,
  sessions: PracticeSession[]
): LearnerReviewSummary {
  const recurringMap = new Map<ErrorTagCode, RecurringTagSummary>();
  const recentMistakes: LearnerReviewSummary["recentMistakes"] = [];
  const drillCandidates: RecommendedDrill[] = [];
  const drillKeys = new Set<string>();
  const listeningRecommendations: ListeningRecommendation[] = [];
  const listeningKeys = new Set<string>();
  const sessionTimes = new Map<string, number>();
  let confidenceTotal = 0;

  for (const session of sessions) {
    confidenceTotal += session.feedback.confidenceScore;
    sessionTimes.set(session.id, new Date(session.createdAt).getTime());

    const primaryTag =
      session.feedback.errorTags.find((tag) => tag.severity === "primary") ??
      session.feedback.errorTags[0];

    if (
      primaryTag &&
      session.feedback.reviewRecommendation.shouldReview &&
      recentMistakes.length < 4
    ) {
      recentMistakes.push({
        sessionId: session.id,
        createdAt: session.createdAt,
        inputMode: session.feedback.inputMode,
        scenarioId: session.scenarioId,
        scenarioTitle: session.scenarioSnapshot.title,
        transcriptText: session.feedback.transcriptText,
        correctedText: session.feedback.correctedText,
        primaryTag,
        retryPrompt: session.feedback.retryPrompt
      });
    }

    for (const tag of session.feedback.errorTags) {
      const current = recurringMap.get(tag.code);

      if (!current) {
        recurringMap.set(tag.code, {
          code: tag.code,
          count: 1,
          lastSeenAt: session.createdAt,
          lastMessage: tag.message,
          lastScenarioId: session.scenarioId,
          lastScenarioTitle: session.scenarioSnapshot.title,
          sampleCorrection: session.feedback.correctedText
        });
        continue;
      }

      recurringMap.set(tag.code, {
        ...current,
        count: current.count + 1,
        lastSeenAt:
          new Date(session.createdAt) > new Date(current.lastSeenAt)
            ? session.createdAt
            : current.lastSeenAt,
        lastMessage: tag.message,
        lastScenarioId: session.scenarioId,
        lastScenarioTitle: session.scenarioSnapshot.title,
        sampleCorrection: session.feedback.correctedText
      });
    }

    for (const drill of session.feedback.recommendedDrills) {
      const drillKey =
        drill.id ||
        `${drill.kind}:${drill.focusTagCode ?? "none"}:${drill.prompt}`;

      if (drillKeys.has(drillKey)) {
        continue;
      }

      drillKeys.add(drillKey);
      drillCandidates.push({
        ...drill,
        scenarioId: drill.scenarioId ?? session.scenarioId,
        scenarioTitle: drill.scenarioTitle ?? session.scenarioSnapshot.title,
        sourceSessionId: drill.sourceSessionId ?? session.id
      });
    }

    if (
      session.feedback.listeningRecommendation &&
      !listeningKeys.has(session.feedback.listeningRecommendation.packId)
    ) {
      listeningKeys.add(session.feedback.listeningRecommendation.packId);
      listeningRecommendations.push(session.feedback.listeningRecommendation);
    }
  }

  const recurringTags = Array.from(recurringMap.values())
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return (
        new Date(right.lastSeenAt).getTime() -
        new Date(left.lastSeenAt).getTime()
      );
    })
    .slice(0, 5);

  const topRecurring = recurringTags[0];
  const exampleSession = topRecurring
    ? sessions.find((session) =>
        session.feedback.errorTags.some((tag) => tag.code === topRecurring.code)
      )
    : null;
  const recurringCounts = new Map(
    recurringTags.map((tag) => [tag.code, tag.count] as const)
  );
  const recommendedDrills = drillCandidates
    .sort((left, right) => {
      const leftScore =
        (left.focusTagCode ? recurringCounts.get(left.focusTagCode) ?? 0 : 0) +
        (left.kind === "dictation" || left.kind === "shadowing" ? 0.5 : 0) +
        (left.kind === "partner-handoff" ? 0.25 : 0);
      const rightScore =
        (right.focusTagCode ? recurringCounts.get(right.focusTagCode) ?? 0 : 0) +
        (right.kind === "dictation" || right.kind === "shadowing" ? 0.5 : 0) +
        (right.kind === "partner-handoff" ? 0.25 : 0);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return (
        (sessionTimes.get(right.sourceSessionId ?? "") ?? 0) -
        (sessionTimes.get(left.sourceSessionId ?? "") ?? 0)
      );
    })
    .slice(0, 6);

  if (recommendedDrills.length === 0 && topRecurring && exampleSession) {
    recommendedDrills.push({
      id: `review-${exampleSession.id}-${topRecurring.code.toLowerCase()}`,
      kind: "retry",
      title: `Retry ${formatErrorCode(topRecurring.code)}`,
      reason: `${formatErrorCode(topRecurring.code)} has appeared ${topRecurring.count} times recently.`,
      prompt: exampleSession.feedback.correctedText,
      steps: [
        {
          label: "Model",
          prompt: exampleSession.feedback.correctedText
        },
        {
          label: "Retry",
          prompt: exampleSession.feedback.retryPrompt
        }
      ],
      focusTagCode: topRecurring.code,
      scenarioId: exampleSession.scenarioId,
      scenarioTitle: exampleSession.scenarioSnapshot.title,
      sourceSessionId: exampleSession.id
    });
  }

  return {
    learnerId,
    generatedAt: new Date().toISOString(),
    totalSessions: sessions.length,
    averageConfidence:
      sessions.length > 0 ? confidenceTotal / sessions.length : 0,
    recentMistakes,
    recurringTags,
    recommendedDrills,
    nextRecommendedDrill: recommendedDrills[0] ?? null,
    listeningRecommendations: listeningRecommendations.slice(0, 4)
  };
}

class MemorySessionStore implements SessionStore {
  private readonly sessions =
    globalThis.__crcMemorySessions ?? new Map<string, PracticeSession[]>();

  constructor() {
    globalThis.__crcMemorySessions = this.sessions;
  }

  async listSessions(learnerId: string) {
    const existing = this.sessions.get(learnerId) ?? [];
    return existing.map(normalizeStoredSession).slice(0, 50);
  }

  async getLearnerReview(learnerId: string) {
    const sessions = (this.sessions.get(learnerId) ?? [])
      .map(normalizeStoredSession)
      .slice(0, 120);
    return buildLearnerReview(learnerId, sessions);
  }

  async saveSession(session: PracticeSession) {
    const existing = this.sessions.get(session.learnerId) ?? [];
    const updated = [session, ...existing].map(normalizeStoredSession).slice(0, 120);
    this.sessions.set(session.learnerId, updated);
    return session;
  }
}

class PostgresSessionStore implements SessionStore {
  private readonly pool: Pool;
  private schemaReady: Promise<void> | null = null;

  constructor() {
    this.pool =
      globalThis.__crcPgPool ??
      new Pool({
        connectionString: process.env.DATABASE_URL
      });

    globalThis.__crcPgPool = this.pool;
  }

  private async ensureSchema() {
    if (!this.schemaReady) {
      this.schemaReady = this.pool
        .query(`
          create table if not exists coaching_sessions (
            id text primary key,
            learner_id text not null,
            created_at timestamptz not null,
            mode text not null,
            difficulty text not null,
            scenario_id text not null,
            scenario_context jsonb not null default '{}'::jsonb,
            source text not null,
            user_input text not null,
            feedback jsonb not null
          );
        `)
        .then(() =>
          this.pool.query(`
            alter table coaching_sessions
            add column if not exists scenario_context jsonb not null default '{}'::jsonb;
          `)
        )
        .then(() => undefined);
    }

    await this.schemaReady;
  }

  private async fetchSessions(learnerId: string, limit: number) {
    await this.ensureSchema();

    const result = await this.pool.query(
      `
        select
          id,
          learner_id,
          created_at,
          mode,
          difficulty,
          scenario_id,
          scenario_context,
          source,
          user_input,
          feedback
        from coaching_sessions
        where learner_id = $1
        order by created_at desc
        limit $2
      `,
      [learnerId, limit]
    );

    return result.rows.map((row) =>
      normalizeStoredSession({
        id: row.id,
        learnerId: row.learner_id,
        createdAt: new Date(row.created_at).toISOString(),
        mode: row.mode,
        difficulty: row.difficulty,
        scenarioId: row.scenario_id,
        scenario_context: row.scenario_context,
        source: row.source,
        userInput: row.user_input,
        feedback: row.feedback
      })
    );
  }

  async listSessions(learnerId: string) {
    return this.fetchSessions(learnerId, 50);
  }

  async getLearnerReview(learnerId: string) {
    const sessions = await this.fetchSessions(learnerId, 120);
    return buildLearnerReview(learnerId, sessions);
  }

  async saveSession(session: PracticeSession) {
    await this.ensureSchema();

    await this.pool.query(
      `
        insert into coaching_sessions (
          id,
          learner_id,
          created_at,
          mode,
          difficulty,
          scenario_id,
          scenario_context,
          source,
          user_input,
          feedback
        )
        values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb)
      `,
      [
        session.id,
        session.learnerId,
        session.createdAt,
        session.mode,
        session.difficulty,
        session.scenarioId,
        JSON.stringify(session.scenarioSnapshot),
        session.source,
        session.userInput,
        JSON.stringify(session.feedback)
      ]
    );

    return session;
  }
}

let store: SessionStore | null = null;

export function getSessionStore() {
  if (!store) {
    store = process.env.DATABASE_URL
      ? new PostgresSessionStore()
      : new MemorySessionStore();
  }

  return store;
}

export function createSessionId() {
  return randomUUID();
}

export function createSession(
  input: Omit<PracticeSession, "id" | "createdAt"> & { id?: string }
): PracticeSession {
  return {
    id: input.id ?? createSessionId(),
    createdAt: new Date().toISOString(),
    learnerId: input.learnerId,
    mode: input.mode,
    difficulty: input.difficulty,
    scenarioId: input.scenarioId,
    scenarioSnapshot: input.scenarioSnapshot,
    source: input.source,
    userInput: input.userInput,
    feedback: input.feedback
  };
}
