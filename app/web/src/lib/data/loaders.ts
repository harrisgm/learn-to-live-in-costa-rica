import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type {
  BootstrapPayload,
  LearnerProfile,
  ListeningPackRecord,
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
let listeningPacksCache: ListeningPackRecord[] | null = null;
const promptCache = new Map<string, PromptBundle>();

async function readJsonFile<T>(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function readMarkdown(filePath: string) {
  return readFile(filePath, "utf8");
}

type ScenarioRecordInput = Omit<
  ScenarioRecord,
  | "culturalNotes"
  | "partnerRoles"
  | "likelyMisunderstandings"
  | "variants"
  | "turns"
  | "followUpDrills"
> &
  Partial<
    Pick<
      ScenarioRecord,
      | "culturalNotes"
      | "partnerRoles"
      | "likelyMisunderstandings"
      | "variants"
      | "turns"
      | "followUpDrills"
    >
  >;

function normalizeArray<T>(value: T[] | undefined) {
  return Array.isArray(value) ? value : [];
}

function normalizeScenarioRecord(scenario: ScenarioRecordInput): ScenarioRecord {
  return {
    ...scenario,
    culturalNotes: normalizeArray(scenario.culturalNotes),
    partnerRoles: normalizeArray(scenario.partnerRoles),
    likelyMisunderstandings: normalizeArray(scenario.likelyMisunderstandings),
    variants: normalizeArray(scenario.variants),
    turns: normalizeArray(scenario.turns),
    followUpDrills: normalizeArray(scenario.followUpDrills)
  };
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
    scenarioFiles.map(async (entry) =>
      normalizeScenarioRecord(
        await readJsonFile<ScenarioRecordInput>(path.join(scenariosDir, entry))
      )
    )
  );

  return scenariosCache;
}

export async function loadListeningPacks() {
  if (listeningPacksCache) {
    return listeningPacksCache;
  }

  const listeningDir = path.join(dataRoot, "listening");
  let entries: string[] = [];

  try {
    entries = await readdir(listeningDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      listeningPacksCache = [];
      return listeningPacksCache;
    }

    throw error;
  }

  const listeningFiles = entries.filter((entry) => entry.endsWith(".json")).sort();

  listeningPacksCache = await Promise.all(
    listeningFiles.map((entry) =>
      readJsonFile<ListeningPackRecord>(path.join(listeningDir, entry))
    )
  );

  return listeningPacksCache;
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

async function loadOptionalScenarioPrompt(scenarioId?: string) {
  if (!scenarioId) {
    return undefined;
  }

  const candidateIds = Array.from(
    new Set([scenarioId, scenarioId.replaceAll("-", "_"), scenarioId.replaceAll("_", "-")])
  );

  for (const candidateId of candidateIds) {
    const scenarioPromptPath = path.join(
      promptsRoot,
      "roleplay",
      `${candidateId}.md`
    );

    try {
      await access(scenarioPromptPath);
      return await readMarkdown(scenarioPromptPath);
    } catch {
      continue;
    }
  }

  return undefined;
}

export async function loadPromptBundle(
  mode: PracticeMode,
  difficulty: Difficulty,
  scenarioId?: string
) {
  const cacheKey = `${mode}:${difficulty}:${scenarioId ?? "none"}`;
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
    ),
    scenarioPrompt: await loadOptionalScenarioPrompt(scenarioId)
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

export async function findListeningPack(listeningPackId: string) {
  const listeningPacks = await loadListeningPacks();
  return listeningPacks.find((pack) => pack.id === listeningPackId) ?? null;
}

export async function loadBootstrapPayload(): Promise<BootstrapPayload> {
  const [learners, scenarios, listeningPacks] = await Promise.all([
    loadLearners(),
    loadScenarios(),
    loadListeningPacks()
  ]);

  return {
    learners,
    scenarios,
    listeningPacks,
    speech: getSpeechCapabilities()
  };
}
