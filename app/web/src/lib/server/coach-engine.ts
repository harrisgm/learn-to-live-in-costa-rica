import type {
  CoachContext,
  ScenarioDrillRecord,
  ScenarioTurnRecord,
  ScenarioVariantRecord
} from "@/lib/data/contracts";
import type {
  CoupleHandoff,
  DrillKind,
  DrillStep,
  ErrorSeverity,
  ErrorTag,
  ErrorTagCode,
  FeedbackDraft,
  FeedbackMode,
  LearnerFocus,
  ListeningRecommendation,
  PronunciationHint,
  RecommendedDrill,
  ReviewRecommendation,
  VocabNote
} from "@/lib/types";
import { ERROR_TAG_CODES } from "@/lib/types";

import { getOpenAIClient } from "@/lib/server/openai";

const errorCodeSet = new Set<ErrorTagCode>(ERROR_TAG_CODES);

const vocabularyGlossary: Record<string, string> = {
  arroz: "rice",
  frijoles: "beans",
  "cuanto cuesta": "how much does it cost",
  "medio kilo": "half a kilo",
  "mucho gusto": "nice to meet you",
  "de donde son": "where are you from",
  "por aqui": "around here",
  "que dicha": "that's wonderful",
  alquiler: "rent",
  deposito: "deposit",
  arreglar: "to fix",
  incluido: "included",
  cuenta: "account or bill",
  transferencia: "transfer",
  "estado de cuenta": "account statement",
  documento: "document",
  dolor: "pain",
  medicina: "medicine",
  receta: "prescription",
  fiebre: "fever",
  cita: "appointment"
};

function normalizeSentence(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "";
  }

  const first = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(first) ? first : `${first}.`;
}

function asWords(input: string) {
  return input.toLowerCase().match(/[a-záéíóúüñ]+/gi) ?? [];
}

function activeVariant(context: CoachContext): ScenarioVariantRecord | undefined {
  return (
    context.scenario.variants.find(
      (variant) => variant.id === context.request.scenarioVariantId
    ) ?? context.scenario.variants[0]
  );
}

function activeTurn(context: CoachContext): ScenarioTurnRecord | undefined {
  return (
    context.scenario.turns.find(
      (turn) => turn.id === context.request.scenarioTurnId
    ) ?? context.scenario.turns[0]
  );
}

function drillIdentity(drill: RecommendedDrill) {
  return `${drill.kind}:${drill.title}:${drill.prompt}`;
}

function dedupeRecommendedDrills(drills: RecommendedDrill[]) {
  const seen = new Set<string>();

  return drills.filter((drill) => {
    const key = drillIdentity(drill);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function scenarioPromptSeed(context: CoachContext) {
  return (
    activeVariant(context)?.starterPrompt ??
    activeTurn(context)?.prompt ??
    context.scenario.starterPrompts[0]
  );
}

function sanitizeId(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function prettyErrorCode(code: ErrorTagCode) {
  return code.toLowerCase().replaceAll("_", " ");
}

function templateValue(
  template: string,
  values: Record<string, string | undefined>
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}

function deriveFeedbackMode(context: CoachContext): FeedbackMode {
  if (context.request.feedbackMode) {
    return context.request.feedbackMode;
  }

  if (
    context.request.difficulty === "natural" ||
    context.request.difficulty === "costa-rica-fast"
  ) {
    return "strict";
  }

  if (context.request.difficulty === "intermediate") {
    return "detailed";
  }

  if (
    context.request.difficulty === "beginner" ||
    context.learner.learnerLevel === "beginner"
  ) {
    return "gentle";
  }

  return "standard";
}

function deriveLearnerFocus(context: CoachContext): LearnerFocus {
  if (
    context.request.difficulty === "natural" ||
    context.request.difficulty === "costa-rica-fast"
  ) {
    return "naturalization";
  }

  if (context.learner.learnerLevel === "beginner") {
    return "beginner";
  }

  return "survival";
}

function maxErrorCount(mode: FeedbackMode) {
  return mode === "gentle" || mode === "standard" ? 2 : 3;
}

function makeErrorTag(
  code: ErrorTagCode,
  severity: ErrorSeverity,
  message: string
): ErrorTag {
  return { code, severity, message };
}

function normalizeErrorCode(value: unknown): ErrorTagCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (errorCodeSet.has(normalized as ErrorTagCode)) {
    return normalized as ErrorTagCode;
  }

  const legacyMap: Record<string, ErrorTagCode> = {
    PUNCTUATION: "CLARITY_REPAIR_NEEDED",
    SHORT_RESPONSE: "CLARITY_REPAIR_NEEDED",
    SUBJECT_PRONOUN_OVERUSE: "REGISTER_MISMATCH",
    LITERAL_TRANSLATION: "LITERAL_TRANSLATION",
    REGISTER: "REGISTER_MISMATCH"
  };

  return legacyMap[normalized] ?? null;
}

function dedupeErrorTags(tags: ErrorTag[], limit: number) {
  const seen = new Set<ErrorTagCode>();
  const deduped: ErrorTag[] = [];

  for (const tag of tags) {
    if (seen.has(tag.code)) {
      continue;
    }

    seen.add(tag.code);
    deduped.push(tag);

    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

function detectErrorTags(context: CoachContext): ErrorTag[] {
  const input = context.request.input.trim();
  const lower = input.toLowerCase();
  const words = asWords(input);
  const tags: ErrorTag[] = [];

  if (/\b(the|is|are|my|your|with|for|help|price|bank|house)\b/i.test(input)) {
    tags.push(
      makeErrorTag(
        "LITERAL_TRANSLATION",
        "primary",
        "This reply still leans on English structure. Keep the whole sentence in Spanish."
      )
    );
  }

  if (/^\s*yo\s+(quiero|necesito)\b/i.test(input)) {
    tags.push(
      makeErrorTag(
        "REGISTER_MISMATCH",
        tags.length === 0 ? "primary" : "secondary",
        "A slightly softer phrasing will sound more natural in this situation."
      )
    );
  }

  if (!/[.!?]$/.test(input) || words.length < 4) {
    tags.push(
      makeErrorTag(
        "CLARITY_REPAIR_NEEDED",
        tags.length === 0 ? "primary" : "secondary",
        "Add one more clear detail so a local listener can respond quickly."
      )
    );
  }

  if (/\bsoy\b.*\b(aqui|aquí|en)\b/i.test(lower)) {
    tags.push(
      makeErrorTag(
        "SER_ESTAR",
        tags.length === 0 ? "primary" : "secondary",
        "Double-check whether this idea needs ser or estar in Spanish."
      )
    );
  }

  return dedupeErrorTags(tags, maxErrorCount(deriveFeedbackMode(context)));
}

function naturalize(correctedText: string, context: CoachContext) {
  const scenarioPhrase = scenarioPromptSeed(context);
  const learnerFocus = deriveLearnerFocus(context);

  let natural = correctedText
    .replace(/^Necesito\b/i, "Quisiera")
    .replace(/^Quiero\b/i, "Quisiera")
    .replace(/^Yo\s+/i, "");

  if (context.request.mode === "costa-rica" && !/por favor[.!?]?$/i.test(natural)) {
    natural = natural.replace(/[.!?]$/, ", por favor.");
  }

  if (
    learnerFocus === "beginner" &&
    natural.split(/\s+/).length > 10 &&
    scenarioPhrase
  ) {
    natural = normalizeSentence(scenarioPhrase);
  }

  if (
    context.request.mode === "roleplay" &&
    scenarioPhrase &&
    natural.length < scenarioPhrase.length
  ) {
    natural = normalizeSentence(scenarioPhrase);
  }

  return natural;
}

function buildExplanation(context: CoachContext, errorTags: ErrorTag[]) {
  const learnerFocus = deriveLearnerFocus(context);
  const primaryTag = errorTags.find((tag) => tag.severity === "primary") ?? errorTags[0];

  if (primaryTag?.code === "LITERAL_TRANSLATION") {
    return learnerFocus === "beginner"
      ? "Your meaning is clear. The main next step is to keep the whole reply in simple Spanish instead of mirroring English."
      : "The idea works, but the phrasing still sounds translated from English. A more Spanish sentence rhythm will feel smoother.";
  }

  if (primaryTag?.code === "REGISTER_MISMATCH") {
    return learnerFocus === "naturalization"
      ? "This reply is understandable, but it sounds stiffer than locals usually do. A softer request makes it feel more natural."
      : "This reply works. The coach is mainly softening the phrasing so it sounds polite and comfortable in real life.";
  }

  if (primaryTag?.code === "SER_ESTAR") {
    return "The sentence is close. The main fix is choosing ser or estar more naturally for this kind of description.";
  }

  if (primaryTag?.code === "CLARITY_REPAIR_NEEDED") {
    return learnerFocus === "beginner"
      ? "Your idea is a good start. Add one more useful detail so the other person can help you right away."
      : "The reply needs one more practical detail to work better in a fast real-world exchange.";
  }

  return learnerFocus === "beginner"
    ? "Your message is understandable. This version keeps the meaning and makes it easier to use in a real conversation."
    : "The correction keeps your meaning, improves clarity, and nudges the phrasing closer to natural Costa Rica Spanish.";
}

function glossary(term: string) {
  return vocabularyGlossary[term.toLowerCase()] ?? "useful scenario phrase";
}

function buildVocabNotes(context: CoachContext): VocabNote[] {
  return context.scenario.mustKnowVocabulary.slice(0, 3).map((term) => ({
    term,
    gloss: glossary(term),
    note: `Useful for ${context.scenario.title.toLowerCase()} practice and quick follow-up turns.`
  }));
}

function buildPronunciationHints(input: string): PronunciationHint[] {
  const words = asWords(input);
  const hints: PronunciationHint[] = [];

  for (const word of words) {
    if (word.includes("rr")) {
      hints.push({
        term: word,
        hint: "Roll the rr lightly and keep both vowels clean."
      });
    } else if (word.includes("ll") || word.includes("y")) {
      hints.push({
        term: word,
        hint: "Keep the ll or y soft and even instead of using a hard English j."
      });
    } else if (word.includes("j")) {
      hints.push({
        term: word,
        hint: "Use a breathy Spanish j rather than the English j sound."
      });
    }

    if (hints.length >= 3) {
      break;
    }
  }

  if (hints.length === 0) {
    const anchorWord = words.find((word) => word.length >= 4) ?? words[0] ?? "frase";
    hints.push({
      term: anchorWord,
      hint: "Keep every vowel short and pure before you worry about speed."
    });
  }

  return hints;
}

function buildFollowUpPrompt(context: CoachContext) {
  const turn = activeTurn(context);
  const nextBranch = turn?.branchOptions[0];
  const starter =
    nextBranch?.prompt ??
    context.scenario.starterPrompts[1] ??
    context.scenario.starterPrompts[0] ??
    context.scenario.userGoal;

  if (context.request.mode === "couple") {
    const handoff = turn?.coupleHandoffPrompt ??
      context.scenario.coupleSupport?.handoffPrompts[0];

    return handoff ? `${handoff} ${starter}` : starter;
  }

  return starter;
}

function buildCoupleHandoff(context: CoachContext): CoupleHandoff | undefined {
  if (context.request.mode !== "couple") {
    return undefined;
  }

  const roles =
    context.scenario.coupleSupport?.partnerRoles.length
      ? context.scenario.coupleSupport.partnerRoles
      : context.scenario.partnerRoles;
  const turn = activeTurn(context);
  const leadRole = turn?.localRole ?? roles[0] ?? "Partner A";
  const supportRole = roles.find((role) => role !== leadRole) ?? roles[1] ?? "Partner B";

  return {
    leadRole,
    supportRole,
    handoffPrompt:
      turn?.coupleHandoffPrompt ??
      context.scenario.coupleSupport?.handoffPrompts[0] ??
      "Ahora pasa el turno con una pregunta corta.",
    coachingTip:
      context.scenario.coupleSupport?.keepBothInvolvedTip ??
      "Keep each partner to one short move before handing the scenario back."
  };
}

function buildListeningRecommendation(
  context: CoachContext
): ListeningRecommendation | undefined {
  const listeningPack = context.listeningPack;

  if (!listeningPack) {
    return undefined;
  }

  const turn = activeTurn(context);
  const focusPhrase = turn?.listenFor[0] ?? listeningPack.focus;

  return {
    packId: listeningPack.id,
    packTitle: listeningPack.title,
    reason: `Use this pack to train your ear for ${focusPhrase.toLowerCase()}.`,
    previewLine: listeningPack.previewLine
  };
}

function retryInstructionFromTag(tag: ErrorTag | undefined) {
  switch (tag?.code) {
    case "LITERAL_TRANSLATION":
      return "Keep the structure fully in Spanish and avoid English filler words.";
    case "REGISTER_MISMATCH":
      return "Make the request softer and more natural for this setting.";
    case "SER_ESTAR":
      return "Choose the ser or estar form that matches the situation.";
    case "PREPOSITION":
      return "Listen for the most natural preposition in the corrected version.";
    case "CLARITY_REPAIR_NEEDED":
      return "Add one practical detail so the other person knows how to help.";
    case "PRONUNCIATION_LIKELY":
      return "Say the sentence slowly once, then repeat it with clear stress.";
    default:
      return "Stay short, useful, and easy to say out loud.";
  }
}

function buildRetryPrompt(
  context: CoachContext,
  correctedText: string,
  primaryTag: ErrorTag | undefined
) {
  const learnerFocus = deriveLearnerFocus(context);
  const prefix =
    learnerFocus === "beginner"
      ? "Try again with one short useful sentence."
      : "Try again without copying word-for-word.";

  return `${prefix} ${retryInstructionFromTag(primaryTag)} Model idea: ${correctedText}`;
}

function drillStepsFromTemplate(
  drill: ScenarioDrillRecord,
  values: Record<string, string | undefined>
): DrillStep[] {
  const parsed = drill.steps
    .map((step, index) => ({
      label: `Step ${index + 1}`,
      prompt: templateValue(step, values).trim()
    }))
    .filter((step) => step.prompt.length > 0);

  return parsed.length > 0
    ? parsed.slice(0, 4)
    : [
        {
          label: "Step 1",
          prompt: templateValue(drill.prompt, values).trim()
        }
      ];
}

function buildRecommendedDrills(
  context: CoachContext,
  correctedText: string,
  naturalText: string,
  retryPrompt: string,
  followUpPrompt: string,
  errorTags: ErrorTag[],
  coupleHandoff: CoupleHandoff | undefined,
  listeningRecommendation: ListeningRecommendation | undefined
): RecommendedDrill[] {
  const turn = activeTurn(context);
  const primaryTag = errorTags.find((tag) => tag.severity === "primary") ?? errorTags[0];
  const listeningPack = context.listeningPack;
  const templateValues = {
    correctedText,
    naturalText,
    retryPrompt,
    followUpPrompt,
    handoffPrompt: coupleHandoff?.handoffPrompt,
    dictationLine: listeningPack?.dictationLine,
    previewLine: listeningPack?.previewLine,
    turnPrompt: turn?.prompt
  };

  const scenarioDrills = context.scenario.followUpDrills
    .filter((drill) => {
      if (turn?.recommendedDrillIds?.includes(drill.id)) {
        return true;
      }

      if (!primaryTag) {
        return true;
      }

      return drill.focusTagCodes?.includes(primaryTag.code) ?? false;
    })
    .slice(0, 2)
    .map((drill) => ({
      id: `${context.scenario.id}-${drill.id}`,
      kind: drill.kind as DrillKind,
      title: drill.title,
      reason: drill.goal,
      prompt: templateValue(drill.prompt, templateValues).trim(),
      steps: drillStepsFromTemplate(drill, templateValues),
      focusTagCode:
        drill.focusTagCodes?.find((code) => code === primaryTag?.code) ??
        drill.focusTagCodes?.[0],
      scenarioId: context.scenario.id,
      scenarioTitle: context.scenario.title,
      listeningPackId: drill.listeningPackId ?? listeningRecommendation?.packId
    }));

  const fallbackDrill: RecommendedDrill = {
    id: `${context.scenario.id}-${sanitizeId(primaryTag?.code ?? "retry")}-contrast`,
    kind: "contrast",
    title: primaryTag
      ? `Contrast ${prettyErrorCode(primaryTag.code)}`
      : "Contrast the model and your retry",
    reason: primaryTag
      ? `Use one short contrast drill to clean up ${prettyErrorCode(primaryTag.code)} before moving on.`
      : "Hear the correction, then say it again from memory.",
    prompt: naturalText,
    steps: [
      {
        label: "Model",
        prompt: correctedText
      },
      {
        label: "Natural",
        prompt: naturalText
      },
      {
        label: "Retry",
        prompt: retryPrompt
      }
    ],
    focusTagCode: primaryTag?.code,
    scenarioId: context.scenario.id,
    scenarioTitle: context.scenario.title,
    listeningPackId: listeningRecommendation?.packId
  };

  const listeningDrill =
    listeningPack && listeningRecommendation
      ? ({
          id: `${listeningPack.id}-dictation`,
          kind: "dictation",
          title: `Listening lab: ${listeningPack.title}`,
          reason: listeningRecommendation.reason,
          prompt: listeningPack.dictationLine,
          steps: [
            {
              label: "Listen for",
              prompt: listeningPack.previewLine
            },
            {
              label: "Dictation",
              prompt: listeningPack.dictationLine
            },
            {
              label: "Shadow",
              prompt: listeningPack.shadowingLines[0] ?? listeningPack.dictationLine
            }
          ],
          scenarioId: context.scenario.id,
          scenarioTitle: context.scenario.title,
          listeningPackId: listeningPack.id
        } satisfies RecommendedDrill)
      : null;

  const coupleDrill =
    coupleHandoff
      ? ({
          id: `${context.scenario.id}-partner-handoff`,
          kind: "partner-handoff",
          title: `Partner handoff: ${coupleHandoff.supportRole}`,
          reason: coupleHandoff.coachingTip,
          prompt: coupleHandoff.handoffPrompt,
          steps: [
            {
              label: "Lead",
              prompt: naturalText
            },
            {
              label: "Handoff",
              prompt: coupleHandoff.handoffPrompt
            },
            {
              label: "Partner reply",
              prompt: followUpPrompt
            }
          ],
          scenarioId: context.scenario.id,
          scenarioTitle: context.scenario.title
        } satisfies RecommendedDrill)
      : null;

  const drills = [
    ...scenarioDrills,
    coupleDrill,
    listeningDrill,
    fallbackDrill
  ].filter((drill): drill is RecommendedDrill => Boolean(drill));

  return dedupeRecommendedDrills(drills).slice(0, 4);
}

function buildReviewRecommendation(
  errorTags: ErrorTag[],
  retryPrompt: string,
  confidenceScore: number
): ReviewRecommendation {
  const primaryTag = errorTags.find((tag) => tag.severity === "primary") ?? errorTags[0];

  if (!primaryTag && confidenceScore >= 0.8) {
    return {
      shouldReview: false,
      reason: "This turn is solid enough to keep the conversation moving.",
      nextStep: "Say the natural version once, then answer the follow-up prompt."
    };
  }

  return {
    shouldReview: true,
    reason: primaryTag
      ? `This turn is worth reviewing because ${primaryTag.message.toLowerCase()}`
      : "This turn is worth reviewing before you move on.",
    nextStep: `Repeat the retry once, then do it again from memory. ${retryPrompt}`
  };
}

function baseConfidence(context: CoachContext, errorTags: ErrorTag[]) {
  const learnerBonus = deriveLearnerFocus(context) === "beginner" ? -0.03 : 0.03;

  return Math.max(
    0.28,
    Math.min(
      0.93,
      0.58 +
        Math.min(context.request.input.trim().length / 180, 0.16) -
        errorTags.length * 0.08 +
        learnerBonus
    )
  );
}

function buildMetadata(context: CoachContext) {
  return {
    inputMode: context.request.source,
    transcriptText: context.request.input.trim(),
    feedbackMode: deriveFeedbackMode(context),
    learnerFocus: deriveLearnerFocus(context),
    scenarioId: context.scenario.id
  };
}

function generateRuleBasedFeedback(context: CoachContext): FeedbackDraft {
  const correctedText = normalizeSentence(context.request.input);
  const errorTags = detectErrorTags(context);
  const confidenceScore = baseConfidence(context, errorTags);
  const primaryTag = errorTags.find((tag) => tag.severity === "primary") ?? errorTags[0];
  const retryPrompt = buildRetryPrompt(context, correctedText, primaryTag);
  const naturalText = naturalize(correctedText, context);
  const followUpPrompt = buildFollowUpPrompt(context);
  const coupleHandoff = buildCoupleHandoff(context);
  const listeningRecommendation = buildListeningRecommendation(context);
  const recommendedDrills = buildRecommendedDrills(
    context,
    correctedText,
    naturalText,
    retryPrompt,
    followUpPrompt,
    errorTags,
    coupleHandoff,
    listeningRecommendation
  );

  return {
    provider: "local-rules",
    ...buildMetadata(context),
    correctedText,
    naturalText,
    explanationSummary: buildExplanation(context, errorTags),
    errorTags,
    retryPrompt,
    followUpPrompt,
    vocabNotes: buildVocabNotes(context),
    pronunciationHints: buildPronunciationHints(context.request.input),
    reviewRecommendation: buildReviewRecommendation(
      errorTags,
      retryPrompt,
      confidenceScore
    ),
    recommendedDrills,
    coupleHandoff,
    listeningRecommendation,
    confidenceScore
  };
}

function stripCodeFences(input: string) {
  return input
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonObject(input: string) {
  const trimmed = stripCodeFences(input);
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function asFeedbackMode(value: unknown, fallback: FeedbackMode) {
  if (
    value === "gentle" ||
    value === "standard" ||
    value === "detailed" ||
    value === "strict"
  ) {
    return value;
  }

  return fallback;
}

function asLearnerFocus(value: unknown, fallback: LearnerFocus) {
  if (
    value === "beginner" ||
    value === "survival" ||
    value === "naturalization"
  ) {
    return value;
  }

  return fallback;
}

function asConfidence(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function coerceErrorTags(
  value: unknown,
  fallback: ErrorTag[],
  limit: number
): ErrorTag[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value.flatMap((item): ErrorTag[] => {
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

  const deduped = dedupeErrorTags(parsed, limit);
  return deduped.length > 0 ? deduped : fallback;
}

function coerceVocabNotes(value: unknown, fallback: VocabNote[]): VocabNote[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value.flatMap((item): VocabNote[] => {
    if (typeof item === "string") {
      return [
        {
          term: item,
          gloss: glossary(item),
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
        gloss: asString(candidate.gloss, glossary(candidate.term)),
        note: asString(
          candidate.note,
          "Useful phrase to keep handy in this scenario."
        )
      }
    ];
  });

  return parsed.length > 0 ? parsed.slice(0, 4) : fallback;
}

function coercePronunciationHints(
  value: unknown,
  fallback: PronunciationHint[]
): PronunciationHint[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value.flatMap((item): PronunciationHint[] => {
    if (typeof item === "string") {
      return [
        {
          term: "focus",
          hint: item
        }
      ];
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
        term: asString(candidate.term, "focus"),
        hint: candidate.hint.trim()
      }
    ];
  });

  return parsed.length > 0 ? parsed.slice(0, 3) : fallback;
}

function coerceReviewRecommendation(
  value: unknown,
  fallback: ReviewRecommendation
): ReviewRecommendation {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<ReviewRecommendation>;

  return {
    shouldReview:
      typeof candidate.shouldReview === "boolean"
        ? candidate.shouldReview
        : fallback.shouldReview,
    reason: asString(candidate.reason, fallback.reason),
    nextStep: asString(candidate.nextStep, fallback.nextStep)
  };
}

function coerceCoupleHandoff(
  value: unknown,
  fallback: CoupleHandoff | undefined
): CoupleHandoff | undefined {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<CoupleHandoff>;

  if (
    typeof candidate.leadRole !== "string" ||
    typeof candidate.supportRole !== "string" ||
    typeof candidate.handoffPrompt !== "string" ||
    typeof candidate.coachingTip !== "string"
  ) {
    return fallback;
  }

  return {
    leadRole: candidate.leadRole.trim(),
    supportRole: candidate.supportRole.trim(),
    handoffPrompt: candidate.handoffPrompt.trim(),
    coachingTip: candidate.coachingTip.trim()
  };
}

function coerceListeningRecommendation(
  value: unknown,
  fallback: ListeningRecommendation | undefined
): ListeningRecommendation | undefined {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<ListeningRecommendation>;

  if (
    typeof candidate.packId !== "string" ||
    typeof candidate.packTitle !== "string" ||
    typeof candidate.reason !== "string" ||
    typeof candidate.previewLine !== "string"
  ) {
    return fallback;
  }

  return {
    packId: candidate.packId.trim(),
    packTitle: candidate.packTitle.trim(),
    reason: candidate.reason.trim(),
    previewLine: candidate.previewLine.trim()
  };
}

function coerceRecommendedDrills(
  value: unknown,
  fallback: RecommendedDrill[]
): RecommendedDrill[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value.flatMap((item, index): RecommendedDrill[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Partial<RecommendedDrill>;

    if (
      (candidate.kind !== "retry" &&
        candidate.kind !== "contrast" &&
        candidate.kind !== "roleplay-reset" &&
        candidate.kind !== "shadowing" &&
        candidate.kind !== "dictation" &&
        candidate.kind !== "partner-handoff") ||
      typeof candidate.title !== "string" ||
      typeof candidate.reason !== "string" ||
      typeof candidate.prompt !== "string"
    ) {
      return [];
    }

    const steps = Array.isArray(candidate.steps)
      ? (candidate.steps as unknown[]).flatMap((step): DrillStep[] => {
          if (typeof step === "string") {
            return [
              {
                label: "Practice",
                prompt: step.trim()
              }
            ];
          }

          if (!step || typeof step !== "object") {
            return [];
          }

          const stepCandidate = step as Partial<DrillStep>;

          if (typeof stepCandidate.prompt !== "string") {
            return [];
          }

          return [
            {
              label: asString(stepCandidate.label, "Practice"),
              prompt: stepCandidate.prompt.trim()
            }
          ];
        })
      : [];

    return [
      {
        id: asString(candidate.id, `ai-drill-${index + 1}`),
        kind: candidate.kind,
        title: candidate.title.trim(),
        reason: candidate.reason.trim(),
        prompt: candidate.prompt.trim(),
        steps:
          steps.length > 0
            ? steps.slice(0, 4)
            : [
                {
                  label: "Practice",
                  prompt: candidate.prompt.trim()
                }
              ],
        focusTagCode: normalizeErrorCode(candidate.focusTagCode) ?? undefined,
        scenarioId: asOptionalString(candidate.scenarioId),
        scenarioTitle: asOptionalString(candidate.scenarioTitle),
        sourceSessionId: asOptionalString(candidate.sourceSessionId),
        listeningPackId: asOptionalString(candidate.listeningPackId)
      }
    ];
  });

  return parsed.length > 0 ? parsed.slice(0, 4) : fallback;
}

function mergeRecommendedDrills(
  value: unknown,
  fallback: RecommendedDrill[],
  listeningPackId?: string
) {
  const parsed = coerceRecommendedDrills(value, fallback);
  const required = fallback.filter(
    (drill) =>
      drill.kind === "partner-handoff" ||
      (drill.kind === "dictation" &&
        Boolean(listeningPackId) &&
        drill.listeningPackId === listeningPackId)
  );

  if (required.length === 0) {
    return parsed;
  }

  const requiredKeys = new Set(required.map(drillIdentity));
  const selected = dedupeRecommendedDrills([...parsed]).slice(0, 4);

  for (const drill of required) {
    const key = drillIdentity(drill);

    if (selected.some((candidate) => drillIdentity(candidate) === key)) {
      continue;
    }

    let replaceIndex = -1;

    for (let index = selected.length - 1; index >= 0; index -= 1) {
      const candidate = selected[index];

      if (candidate && !requiredKeys.has(drillIdentity(candidate))) {
        replaceIndex = index;
        break;
      }
    }

    if (replaceIndex >= 0) {
      selected.splice(replaceIndex, 1, drill);
      continue;
    }

    if (selected.length < 4) {
      selected.push(drill);
    }
  }

  return dedupeRecommendedDrills(selected).slice(0, 4);
}

async function generateOpenAIFeedback(context: CoachContext) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const fallback = generateRuleBasedFeedback(context);
  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const turn = activeTurn(context);
  const variant = activeVariant(context);

  const response = await client.responses.create({
    model,
    instructions: [
      context.prompts.systemPrompt.trim(),
      context.prompts.correctionPrompt.trim(),
      context.prompts.scenarioPrompt?.trim(),
      "Return only valid JSON.",
      "Use these keys exactly: correctedText, naturalText, explanationSummary, errorTags, retryPrompt, followUpPrompt, vocabNotes, pronunciationHints, reviewRecommendation, recommendedDrills, coupleHandoff, listeningRecommendation, confidenceScore.",
      `errorTags must be objects with code, severity, and message. code must be one of: ${ERROR_TAG_CODES.join(", ")}.`,
      "vocabNotes must be objects with term, gloss, and note.",
      "pronunciationHints must be objects with term and hint.",
      "reviewRecommendation must be an object with shouldReview, reason, and nextStep.",
      "recommendedDrills must be an array of objects with id, kind, title, reason, prompt, and steps.",
      "recommendedDrills.steps must be arrays of objects with label and prompt.",
      "coupleHandoff, when present, must be an object with leadRole, supportRole, handoffPrompt, and coachingTip.",
      "listeningRecommendation, when present, must be an object with packId, packTitle, reason, and previewLine.",
      "Keep explanationSummary to one or two short sentences.",
      "Keep the number of errorTags low and prioritize motivation over coverage."
    ]
      .filter(Boolean)
      .join("\n\n"),
    input: [
      `Learner: ${context.learner.displayName} (${context.learner.learnerLevel})`,
      `Goals: ${context.learner.goals.join("; ")}`,
      `Challenges: ${context.learner.challenges.join("; ")}`,
      `Mode: ${context.request.mode}`,
      `Difficulty: ${context.request.difficulty}`,
      `Feedback mode: ${fallback.feedbackMode}`,
      `Learner focus: ${fallback.learnerFocus}`,
      `Scenario: ${context.scenario.title}`,
      `Setting: ${context.scenario.setting}`,
      `Scenario goal: ${context.scenario.userGoal}`,
      `Likely misunderstandings: ${context.scenario.likelyMisunderstandings.join("; ")}`,
      `Partner roles: ${context.scenario.partnerRoles.join(", ")}`,
      `Must-know vocabulary: ${context.scenario.mustKnowVocabulary.join(", ")}`,
      `Starter prompts: ${context.scenario.starterPrompts.join(" | ")}`,
      variant ? `Variant: ${variant.title} - ${variant.setup}` : null,
      turn ? `Turn: ${turn.title} - ${turn.prompt}` : null,
      turn ? `Listen for: ${turn.listenFor.join("; ")}` : null,
      turn
        ? `Branch options: ${turn.branchOptions
            .map((branch) => `${branch.label}: ${branch.prompt}`)
            .join(" | ")}`
        : null,
      context.listeningPack
        ? `Listening pack: ${context.listeningPack.title} - ${context.listeningPack.previewLine}`
        : null,
      `Input mode: ${context.request.source}`,
      `Learner input: ${context.request.input}`
    ]
      .filter(Boolean)
      .join("\n")
  });

  const raw = response.output_text?.trim();

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(extractJsonObject(raw)) as Partial<FeedbackDraft>;

  return {
    ...fallback,
    correctedText: asString(parsed.correctedText, fallback.correctedText),
    naturalText: asString(parsed.naturalText, fallback.naturalText),
    explanationSummary: asString(
      parsed.explanationSummary,
      fallback.explanationSummary
    ),
    errorTags: coerceErrorTags(
      parsed.errorTags,
      fallback.errorTags,
      maxErrorCount(fallback.feedbackMode)
    ),
    retryPrompt: asString(parsed.retryPrompt, fallback.retryPrompt),
    followUpPrompt: asString(parsed.followUpPrompt, fallback.followUpPrompt),
    vocabNotes: coerceVocabNotes(parsed.vocabNotes, fallback.vocabNotes),
    pronunciationHints: coercePronunciationHints(
      parsed.pronunciationHints,
      fallback.pronunciationHints
    ),
    feedbackMode: asFeedbackMode(parsed.feedbackMode, fallback.feedbackMode),
    learnerFocus: asLearnerFocus(parsed.learnerFocus, fallback.learnerFocus),
    reviewRecommendation: coerceReviewRecommendation(
      parsed.reviewRecommendation,
      fallback.reviewRecommendation
    ),
    recommendedDrills: mergeRecommendedDrills(
      parsed.recommendedDrills,
      fallback.recommendedDrills,
      fallback.listeningRecommendation?.packId
    ),
    coupleHandoff: coerceCoupleHandoff(
      parsed.coupleHandoff,
      fallback.coupleHandoff
    ),
    listeningRecommendation: coerceListeningRecommendation(
      parsed.listeningRecommendation,
      fallback.listeningRecommendation
    ),
    confidenceScore: asConfidence(
      parsed.confidenceScore,
      fallback.confidenceScore
    )
  } satisfies FeedbackDraft;
}

export async function generateFeedback(context: CoachContext): Promise<FeedbackDraft> {
  try {
    const aiFeedback = await generateOpenAIFeedback(context);

    if (aiFeedback) {
      return aiFeedback;
    }
  } catch (error) {
    console.error("AI feedback failed, falling back to local rules.", error);
  }

  return generateRuleBasedFeedback(context);
}
