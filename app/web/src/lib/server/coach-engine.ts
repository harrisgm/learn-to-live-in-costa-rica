import type { CoachContext } from "@/lib/data/contracts";
import type { Feedback } from "@/lib/types";

import { getOpenAIClient } from "@/lib/server/openai";

function normalizeSentence(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "";
  }

  const first = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(first) ? first : `${first}.`;
}

function detectErrorTags(input: string) {
  const tags: string[] = [];

  if (!/[.!?]$/.test(input.trim())) {
    tags.push("punctuation");
  }

  if (/^\s*yo\s+/i.test(input)) {
    tags.push("subject-pronoun-overuse");
  }

  if (/\b(the|is|are|my|your|with|for)\b/i.test(input)) {
    tags.push("literal-translation");
  }

  if (input.trim().split(/\s+/).length < 4) {
    tags.push("short-response");
  }

  return Array.from(new Set(tags)).slice(0, 4);
}

function naturalize(correctedSpanish: string, context: CoachContext) {
  const scenarioPhrase = context.scenario.starterPrompts[0];

  let natural = correctedSpanish
    .replace(/^Necesito\b/i, "Quisiera")
    .replace(/^Quiero\b/i, "Quisiera")
    .replace(/^Yo\s+/i, "");

  if (context.request.mode === "costa-rica" && !/por favor[.!?]?$/i.test(natural)) {
    natural = natural.replace(/[.!?]$/, ", por favor.");
  }

  if (
    context.request.mode === "roleplay" &&
    scenarioPhrase &&
    natural.length < scenarioPhrase.length
  ) {
    natural = scenarioPhrase;
  }

  if (context.request.mode === "couple") {
    natural = `${natural.replace(/[.!?]$/, "")} Y ahora hazle una pregunta corta a tu pareja.`;
  }

  return natural;
}

function pronunciationNotes(input: string) {
  const words = input
    .toLowerCase()
    .split(/[^a-zA-Z]+/)
    .filter(Boolean);
  const notes: string[] = [];

  if (words.some((word) => word.includes("rr"))) {
    notes.push("Practice the rolled rr sound in the hardest word of the sentence.");
  }

  if (words.some((word) => word.includes("ll") || word.includes("y"))) {
    notes.push("Keep ll and y light and consistent instead of forcing an English sound.");
  }

  if (words.some((word) => word.includes("j"))) {
    notes.push("Use a breathy Spanish j rather than an English j.");
  }

  if (notes.length === 0) {
    notes.push("Focus on pure vowels and steady rhythm before speed.");
  }

  return notes.slice(0, 3);
}

function explanation(context: CoachContext, errorTags: string[]) {
  const learnerTone =
    context.learner.learnerLevel === "beginner"
      ? "Keep it simple and confidence-building."
      : "Keep it practical and slightly more native-like.";

  if (errorTags.includes("literal-translation")) {
    return `${learnerTone} The main improvement is moving away from direct English structure toward more natural Spanish for this scenario.`;
  }

  if (errorTags.includes("subject-pronoun-overuse")) {
    return `${learnerTone} Spanish often drops the subject pronoun when the verb already makes the meaning clear.`;
  }

  if (errorTags.includes("short-response")) {
    return `${learnerTone} Add one more useful detail so the answer works better in real conversation.`;
  }

  if (context.prompts.correctionPrompt.toLowerCase().includes("do not shame")) {
    return "Your message is understandable. This correction mainly smooths the Spanish so it sounds more natural and useful in daily life.";
  }

  return "The correction keeps your meaning, improves clarity, and nudges the phrasing closer to real conversational Spanish.";
}

function followUp(context: CoachContext) {
  const starter = context.scenario.starterPrompts[1] ?? context.scenario.starterPrompts[0];

  if (context.request.mode === "couple") {
    return `Turn this into a two-person exchange and have the other learner answer: ${starter}`;
  }

  return starter;
}

function generateRuleBasedFeedback(context: CoachContext): Feedback {
  const correctedSpanish = normalizeSentence(context.request.input);
  const errorTags = detectErrorTags(context.request.input);

  return {
    provider: "local-rules",
    correctedSpanish,
    naturalSpanish: naturalize(correctedSpanish, context),
    explanation: explanation(context, errorTags),
    vocabularyNotes: context.scenario.mustKnowVocabulary.slice(0, 4),
    pronunciationNotes: pronunciationNotes(context.request.input),
    followUpReply: followUp(context),
    errorTags,
    confidenceScore: Math.max(
      0.25,
      Math.min(0.92, 0.55 + Math.min(context.request.input.trim().length / 160, 0.2) - errorTags.length * 0.07)
    )
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

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.filter((item): item is string => typeof item === "string");
}

function asConfidence(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
}

async function generateOpenAIFeedback(context: CoachContext) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const fallback = generateRuleBasedFeedback(context);
  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";

  const response = await client.responses.create({
    model,
    instructions: [
      context.prompts.systemPrompt.trim(),
      context.prompts.correctionPrompt.trim(),
      "Return only valid JSON with these keys:",
      "correctedSpanish, naturalSpanish, explanation, vocabularyNotes, pronunciationNotes, followUpReply, errorTags, confidenceScore.",
      "Use arrays of short strings for vocabularyNotes, pronunciationNotes, and errorTags.",
      "confidenceScore must be a number from 0 to 1.",
      "Do not include markdown fences or any extra commentary."
    ].join("\n\n"),
    input: [
      `Learner: ${context.learner.displayName} (${context.learner.learnerLevel})`,
      `Goals: ${context.learner.goals.join("; ")}`,
      `Challenges: ${context.learner.challenges.join("; ")}`,
      `Mode: ${context.request.mode}`,
      `Difficulty: ${context.request.difficulty}`,
      `Scenario: ${context.scenario.title}`,
      `Setting: ${context.scenario.setting}`,
      `Scenario goal: ${context.scenario.userGoal}`,
      `Must-know vocabulary: ${context.scenario.mustKnowVocabulary.join(", ")}`,
      `Starter prompts: ${context.scenario.starterPrompts.join(" | ")}`,
      `Learner input: ${context.request.input}`
    ].join("\n")
  });

  const raw = response.output_text?.trim();

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(extractJsonObject(raw)) as Partial<Feedback>;

  return {
    provider: `openai:${model}`,
    correctedSpanish:
      typeof parsed.correctedSpanish === "string"
        ? parsed.correctedSpanish
        : fallback.correctedSpanish,
    naturalSpanish:
      typeof parsed.naturalSpanish === "string"
        ? parsed.naturalSpanish
        : fallback.naturalSpanish,
    explanation:
      typeof parsed.explanation === "string"
        ? parsed.explanation
        : fallback.explanation,
    vocabularyNotes: asStringArray(
      parsed.vocabularyNotes,
      fallback.vocabularyNotes
    ).slice(0, 5),
    pronunciationNotes: asStringArray(
      parsed.pronunciationNotes,
      fallback.pronunciationNotes
    ).slice(0, 4),
    followUpReply:
      typeof parsed.followUpReply === "string"
        ? parsed.followUpReply
        : fallback.followUpReply,
    errorTags: asStringArray(parsed.errorTags, fallback.errorTags).slice(0, 5),
    confidenceScore: asConfidence(
      parsed.confidenceScore,
      fallback.confidenceScore
    )
  };
}

export async function generateFeedback(context: CoachContext): Promise<Feedback> {
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
