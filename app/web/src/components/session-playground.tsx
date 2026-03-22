"use client";

import {
  useDeferredValue,
  useEffect,
  useState,
  useTransition
} from "react";

import { AudioCapture } from "@/components/audio-capture";
import type {
  BootstrapPayload,
  ScenarioRecord
} from "@/lib/data/contracts";
import { fetchBootstrap, fetchSessions, runCoach, transcribeAudio } from "@/lib/api";
import type {
  Difficulty,
  PracticeMode,
  PracticeSession,
  SessionSource
} from "@/lib/types";

const modeOptions: { value: PracticeMode; label: string }[] = [
  { value: "tutor", label: "Tutor mode" },
  { value: "roleplay", label: "Roleplay mode" },
  { value: "costa-rica", label: "Costa Rica mode" },
  { value: "couple", label: "Couple mode" }
];

const difficultyOptions: Difficulty[] = [
  "beginner",
  "beginner+",
  "intermediate",
  "natural",
  "costa-rica-fast"
];

function prettyDate(input: string) {
  return new Date(input).toLocaleString();
}

export function SessionPlayground() {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [input, setInput] = useState("Yo necesito ayuda con este formulario.");
  const [mode, setMode] = useState<PracticeMode>("tutor");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [inputSource, setInputSource] = useState<SessionSource>("text");
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingBootstrap, setIsLoadingBootstrap] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<string | null>(null);
  const deferredInput = useDeferredValue(input);

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const payload = await fetchBootstrap();

        if (cancelled) {
          return;
        }

        setBootstrap(payload);
        setSelectedLearnerId(payload.learners[0]?.id ?? "");
        setSelectedScenarioId(payload.scenarios[0]?.id ?? "");
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load shared app data."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBootstrap(false);
        }
      }
    }

    void loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedLearnerId) {
      return;
    }

    let cancelled = false;
    setIsLoadingSessions(true);

    async function loadLearnerSessions() {
      try {
        const payload = await fetchSessions(selectedLearnerId);

        if (cancelled) {
          return;
        }

        setSessions(payload.sessions);
        setActiveSession(payload.sessions[0] ?? null);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load learner sessions."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSessions(false);
        }
      }
    }

    void loadLearnerSessions();

    return () => {
      cancelled = true;
    };
  }, [selectedLearnerId]);

  const currentScenario =
    bootstrap?.scenarios.find((scenario) => scenario.id === selectedScenarioId) ??
    null;

  const currentLearner =
    bootstrap?.learners.find((learner) => learner.id === selectedLearnerId) ?? null;

  function handleRunCoach() {
    const trimmed = input.trim();

    if (!trimmed || !selectedLearnerId || !selectedScenarioId) {
      return;
    }

    setErrorMessage(null);

    startTransition(() => {
      void runCoach({
        learnerId: selectedLearnerId,
        mode,
        difficulty,
        scenarioId: selectedScenarioId,
        input: trimmed,
        source: inputSource
      })
        .then(({ session }) => {
          setSessions((current) => [session, ...current].slice(0, 10));
          setActiveSession(session);
          setInputSource("text");
        })
        .catch((error) => {
          setErrorMessage(
            error instanceof Error ? error.message : "Coach request failed."
          );
        });
    });
  }

  async function handleTranscript(audio: Blob) {
    const { transcript, warning } = await transcribeAudio(audio);
    setInput(transcript);
    setInputSource("speech");
    if (warning) {
      setErrorMessage(warning);
    } else {
      setErrorMessage(null);
    }
  }

  function resolveScenarioTitle(
    scenarioId: string,
    scenarioList: ScenarioRecord[] | undefined
  ) {
    return scenarioList?.find((item) => item.id === scenarioId)?.title ?? scenarioId;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="panel">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Shared coach workspace</p>
            <h2 className="section-title">Local network text and speech practice</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill bg-palm/10 text-palm">Backend-backed</span>
            <span className="pill bg-ocean/10 text-ocean">
              {bootstrap?.speech.enabled
                ? `Speech ${bootstrap.speech.provider}`
                : "Speech ready"}
            </span>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-[1.3rem] border border-terracotta/20 bg-terracotta/8 px-4 py-3 text-sm text-coffee">
            {errorMessage}
          </div>
        ) : null}

        {isLoadingBootstrap ? (
          <p className="text-sm text-coffee/70">Loading shared app data...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="field">
                <span>Learner</span>
                <select
                  value={selectedLearnerId}
                  onChange={(event) => setSelectedLearnerId(event.target.value)}
                >
                  {bootstrap?.learners.map((learner) => (
                    <option key={learner.id} value={learner.id}>
                      {learner.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Mode</span>
                <select value={mode} onChange={(event) => setMode(event.target.value as PracticeMode)}>
                  {modeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Scenario</span>
                <select
                  value={selectedScenarioId}
                  onChange={(event) => setSelectedScenarioId(event.target.value)}
                >
                  {bootstrap?.scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.4fr]">
              <div className="rounded-[1.5rem] border border-coffee/10 bg-sand/45 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                  Scenario focus
                </p>
                <h3 className="mt-2 text-xl font-semibold text-coffee">
                  {currentScenario?.title ?? "Select a scenario"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-coffee/75">
                  {currentScenario?.setting ?? "Scenario details will appear here."}
                </p>
                <p className="mt-3 text-sm leading-6 text-coffee/75">
                  Goal: {currentScenario?.userGoal ?? "Choose a scenario to set the coaching target."}
                </p>
                <p className="mt-3 text-sm leading-6 text-coffee/75">
                  Starter prompts:{" "}
                  {currentScenario?.starterPrompts.join(" • ") ??
                    "Starter prompts will load from repo data."}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-coffee/10 bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                  Learner profile
                </p>
                <h3 className="mt-2 text-xl font-semibold text-coffee">
                  {currentLearner?.displayName ?? "Loading learner"}
                </h3>
                <p className="mt-2 text-sm text-coffee/75">
                  Level: {currentLearner?.learnerLevel ?? "Unknown"}
                </p>
                <p className="mt-3 text-sm leading-6 text-coffee/75">
                  {currentLearner?.confidenceNotes ??
                    "Learner notes will appear when the backend profile loads."}
                </p>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-coffee">
                Learner input
              </span>
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setInputSource("text");
                }}
                onPaste={() => setInputSource("paste")}
                className="min-h-40 w-full rounded-[1.5rem] border border-coffee/15 bg-white/80 px-5 py-4 text-base text-coffee outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                placeholder="Write, paste, or transcribe Spanish here..."
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-coffee/70">
              <div className="space-y-2">
                <p>
                  Live note:{" "}
                  {deferredInput.trim()
                    ? "feedback stays grounded in the learner's meaning and gets saved to the shared backend."
                    : "enter Spanish or use the microphone to begin."}
                </p>
                <p>
                  Input source: <span className="font-semibold text-coffee">{inputSource}</span>
                  {audioStatus ? ` • ${audioStatus}` : ""}
                </p>
                {bootstrap?.speech.warning ? (
                  <p className="text-xs leading-5 text-coffee/60">
                    {bootstrap.speech.warning}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <AudioCapture
                  disabled={isPending || !bootstrap}
                  onTranscript={handleTranscript}
                  onError={setErrorMessage}
                  onStatusChange={setAudioStatus}
                />
                <button
                  type="button"
                  onClick={handleRunCoach}
                  disabled={
                    isPending ||
                    !input.trim() ||
                    !selectedLearnerId ||
                    !selectedScenarioId
                  }
                  className="rounded-full bg-terracotta px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b85a2e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Analyzing..." : "Run shared coach"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <div className="mb-6">
          <p className="eyebrow">Current feedback</p>
          <h2 className="section-title">Correction and follow-up</h2>
        </div>

        {activeSession ? (
          <div className="space-y-4">
            <div className="feedback-block">
              <span>Original</span>
              <p>{activeSession.userInput}</p>
            </div>
            <div className="feedback-block">
              <span>Feedback provider</span>
              <p>{activeSession.feedback.provider}</p>
            </div>
            <div className="feedback-block">
              <span>Corrected Spanish</span>
              <p>{activeSession.feedback.correctedSpanish}</p>
            </div>
            <div className="feedback-block">
              <span>More natural version</span>
              <p>{activeSession.feedback.naturalSpanish}</p>
            </div>
            <div className="feedback-block">
              <span>English explanation</span>
              <p>{activeSession.feedback.explanation}</p>
            </div>
            <div className="feedback-block">
              <span>Vocabulary notes</span>
              <p>{activeSession.feedback.vocabularyNotes.join(" • ")}</p>
            </div>
            <div className="feedback-block">
              <span>Pronunciation watch-outs</span>
              <p>
                {activeSession.feedback.pronunciationNotes.length > 0
                  ? activeSession.feedback.pronunciationNotes.join(" ")
                  : "No obvious text-only pronunciation flags yet."}
              </p>
            </div>
            <div className="feedback-block">
              <span>Follow-up reply</span>
              <p>{activeSession.feedback.followUpReply}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {activeSession.feedback.errorTags.map((tag) => (
                <span key={tag} className="pill bg-coffee/8 text-coffee">
                  {tag}
                </span>
              ))}
              <span className="pill bg-ocean/10 text-ocean">
                confidence {Math.round(activeSession.feedback.confidenceScore * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-coffee/70">
            Run the shared coach to generate the first backend-backed practice session.
          </p>
        )}
      </section>

      <section className="panel lg:col-span-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Recent practice</p>
            <h2 className="section-title">Shared session history</h2>
          </div>
          <p className="text-sm text-coffee/65">
            {isLoadingSessions
              ? "Refreshing sessions..."
              : "These sessions come from the backend so both learners can use the same local-network app."}
          </p>
        </div>

        {sessions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSession(session)}
                className="rounded-[1.5rem] border border-coffee/10 bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-terracotta/30 hover:bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-palm">
                    {session.mode}
                  </p>
                  <span className="text-xs uppercase tracking-[0.16em] text-coffee/55">
                    {session.source}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-coffee">
                  {resolveScenarioTitle(session.scenarioId, bootstrap?.scenarios)}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-coffee/70">
                  {session.userInput}
                </p>
                <p className="mt-3 text-xs text-coffee/55">{prettyDate(session.createdAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-coffee/70">
            No sessions yet for this learner. The first one will show up here after the coach runs.
          </p>
        )}
      </section>
    </div>
  );
}
