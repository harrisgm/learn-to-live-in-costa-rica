import { afterEach, beforeEach, vi } from "vitest";

type GlobalCaches = typeof globalThis & {
  __crcOpenAIClient?: unknown;
  __crcPgPool?: unknown;
};

const trackedEnvKeys = [
  "DATABASE_URL",
  "SESSION_HISTORY_DIR",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_TRANSCRIPTION_MODEL"
] as const;

const originalEnv = { ...process.env };

function resetGlobalCaches() {
  const caches = globalThis as GlobalCaches;
  delete caches.__crcOpenAIClient;
  delete caches.__crcPgPool;
}

function resetTrackedEnv() {
  for (const key of trackedEnvKeys) {
    const originalValue = originalEnv[key];

    if (typeof originalValue === "string") {
      process.env[key] = originalValue;
      continue;
    }

    delete process.env[key];
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetTrackedEnv();
  resetGlobalCaches();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetTrackedEnv();
  resetGlobalCaches();
});
