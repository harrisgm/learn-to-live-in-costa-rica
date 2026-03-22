import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type {
  BootstrapPayload,
  LearnerProfile,
  PromptBundle,
  ScenarioRecord
} from "@/lib/data/contracts";
import type { Difficulty, PracticeMode } from "@/lib/types";
import { getSpeechCapabilities } from "@/lib/server/speech";

const repoRoot = path.resolve(process.cwd(), "../..");
const dataRoot = path.join(repoRoot, "data");
const promptsRoot = path.join(repoRoot, "prompts");

let learnersCache: LearnerProfile[] | null = null;
let scenariosCache: ScenarioRecord[] | null = null;
const promptCache = new Map<string, PromptBundle>();

async function readJsonFile<T>(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function readMarkdown(filePath: string) {
  return readFile(filePath, "utf8");
}

export async function loadLearners() {
  if (learnersCache) {
    return learnersCache;
  }

  const learnersDir = path.join(dataRoot, "user");
  const entries = await readdir(learnersDir);
  const learnerFiles = entries
    .filter((entry) => entry.startsWith("profile_") && entry.endsWith(".json"))
    .sort();

  learnersCache = await Promise.all(
    learnerFiles.map((entry) =>
      readJsonFile<LearnerProfile>(path.join(learnersDir, entry))
    )
  );

  return learnersCache;
}

export async function loadScenarios() {
  if (scenariosCache) {
    return scenariosCache;
  }

  const scenariosDir = path.join(dataRoot, "scenarios");
  const entries = await readdir(scenariosDir);
  const scenarioFiles = entries.filter((entry) => entry.endsWith(".json")).sort();

  scenariosCache = await Promise.all(
    scenarioFiles.map((entry) =>
      readJsonFile<ScenarioRecord>(path.join(scenariosDir, entry))
    )
  );

  return scenariosCache;
}

function correctionPromptName(difficulty: Difficulty) {
  return difficulty === "beginner" || difficulty === "beginner+"
    ? "beginner"
    : "naturalization";
}

function systemPromptName(mode: PracticeMode) {
  if (mode === "couple") {
    return "couple-mode";
  }

  if (mode === "costa-rica" || mode === "roleplay") {
    return "costa-rica-mode";
  }

  return "tutor-mode";
}

export async function loadPromptBundle(mode: PracticeMode, difficulty: Difficulty) {
  const cacheKey = `${mode}:${difficulty}`;
  const cached = promptCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const bundle = {
    correctionPrompt: await readMarkdown(
      path.join(
        promptsRoot,
        "correction",
        `${correctionPromptName(difficulty)}.md`
      )
    ),
    systemPrompt: await readMarkdown(
      path.join(promptsRoot, "system", `${systemPromptName(mode)}.md`)
    )
  };

  promptCache.set(cacheKey, bundle);
  return bundle;
}

export async function findLearner(learnerId: string) {
  const learners = await loadLearners();
  return learners.find((learner) => learner.id === learnerId) ?? null;
}

export async function findScenario(scenarioId: string) {
  const scenarios = await loadScenarios();
  return scenarios.find((scenario) => scenario.id === scenarioId) ?? null;
}

export async function loadBootstrapPayload(): Promise<BootstrapPayload> {
  const [learners, scenarios] = await Promise.all([
    loadLearners(),
    loadScenarios()
  ]);

  return {
    learners,
    scenarios,
    speech: getSpeechCapabilities()
  };
}
