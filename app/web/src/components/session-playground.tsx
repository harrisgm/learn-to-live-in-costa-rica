"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";

import { AudioCapture } from "@/components/audio-capture";
import type {
  BootstrapPayload,
  ListeningPackRecord,
  ScenarioBranchOptionRecord,
  ScenarioRecord
} from "@/lib/data/contracts";
import { fetchBootstrap, fetchSessions, runCoach, transcribeAudio } from "@/lib/api";
import {
  currentTurnIdForSession,
  deriveScenarioOutcome,
  findLatestIncompleteSession,
  findScenarioTurnIndex,
  nextScenarioVariantId,
  resumePromptForSession
} from "@/lib/session-flow";
import type {
  Difficulty,
  LearnerReviewSummary,
  PracticeMode,
  PracticeSession,
  RecommendedDrill,
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

function confidencePercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatTag(code: string) {
  return code.toLowerCase().replaceAll("_", " ");
}

function formatDrillKind(kind: RecommendedDrill["kind"]) {
  return kind.replaceAll("-", " ");
}

function listeningPacksForScenario(
  bootstrap: BootstrapPayload | null,
  scenarioId: string
) {
  if (!bootstrap) {
    return [];
  }

  return bootstrap.listeningPacks.filter((pack) => pack.scenarioId === scenarioId);
}

function defaultVariantId(scenario: ScenarioRecord | null) {
  return scenario?.variants[0]?.id ?? "";
}

function defaultTurnId(scenario: ScenarioRecord | null) {
  return scenario?.turns[0]?.id ?? "";
}

function defaultListeningPackId(
  bootstrap: BootstrapPayload | null,
  scenario: ScenarioRecord | null
) {
  if (!bootstrap || !scenario) {
    return "";
  }

  return (
    scenario.listeningCues?.[0]?.packId ??
    listeningPacksForScenario(bootstrap, scenario.id)[0]?.id ??
    ""
  );
}

function practicePromptForDrill(drill: RecommendedDrill) {
  return drill.steps[0]?.prompt ?? drill.prompt;
}

function starterPromptForVariant(
  scenario: ScenarioRecord | null,
  variantId?: string
) {
  if (!scenario) {
    return "";
  }

  return (
    scenario.variants.find((variant) => variant.id === variantId)?.starterPrompt ??
    scenario.starterPrompts[0] ??
    scenario.turns[0]?.branchOptions[0]?.prompt ??
    ""
  );
}

export function SessionPlayground() {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [input, setInput] = useState("Yo necesito ayuda con este formulario.");
  const [mode, setMode] = useState<PracticeMode>("tutor");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedTurnId, setSelectedTurnId] = useState("");
  const [selectedBranchOptionId, setSelectedBranchOptionId] = useState("");
  const [selectedListeningPackId, setSelectedListeningPackId] = useState("");
  const [inputSource, setInputSource] = useState<SessionSource>("text");
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [review, setReview] = useState<LearnerReviewSummary | null>(null);
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBootstrap, setIsLoadingBootstrap] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<string | null>(null);
  const currentLearnerIdRef = useRef(selectedLearnerId);
  const autoResumeLearnerIdRef = useRef<string | null>(null);
  const deferredInput = useDeferredValue(input);

  useEffect(() => {
    currentLearnerIdRef.current = selectedLearnerId;
  }, [selectedLearnerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const payload = await fetchBootstrap();

        if (cancelled) {
          return;
        }

        const initialScenario = payload.scenarios[0] ?? null;
        setBootstrap(payload);
        setSelectedLearnerId(payload.learners[0]?.id ?? "");
        setSelectedScenarioId(initialScenario?.id ?? "");
        setSelectedVariantId(defaultVariantId(initialScenario));
        setSelectedTurnId(defaultTurnId(initialScenario));
        setSelectedListeningPackId(defaultListeningPackId(payload, initialScenario));
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

  const currentScenario =
    bootstrap?.scenarios.find((scenario) => scenario.id === selectedScenarioId) ??
    null;
  const currentLearner =
    bootstrap?.learners.find((learner) => learner.id === selectedLearnerId) ?? null;
  const scenarioListeningPacks = listeningPacksForScenario(
    bootstrap,
    selectedScenarioId
  );
  const currentVariant =
    currentScenario?.variants.find((variant) => variant.id === selectedVariantId) ??
    currentScenario?.variants[0] ??
    null;
  const currentTurn =
    currentScenario?.turns.find((turn) => turn.id === selectedTurnId) ??
    currentScenario?.turns[0] ??
    null;
  const currentListeningPack =
    scenarioListeningPacks.find((pack) => pack.id === selectedListeningPackId) ??
    scenarioListeningPacks[0] ??
    null;
  const topRecurring = review?.recurringTags[0] ?? null;
  const latestScenarioSession =
    activeSession?.scenarioId === selectedScenarioId
      ? activeSession
      : sessions.find((session) => session.scenarioId === selectedScenarioId) ?? null;
  const latestIncompleteSession = findLatestIncompleteSession(sessions);
  const latestScenarioCurrentTurnId = latestScenarioSession
    ? currentTurnIdForSession(latestScenarioSession)
    : undefined;
  const visibleScenarioProgress =
    latestScenarioSession?.scenarioId === selectedScenarioId
      ? latestScenarioSession.scenarioProgress
      : undefined;
  const activeScenarioProgress =
    visibleScenarioProgress && latestScenarioCurrentTurnId === selectedTurnId
      ? visibleScenarioProgress
      : undefined;
  const isCurrentScenarioComplete = activeScenarioProgress?.isComplete === true;
  const selectedTurnIndex = findScenarioTurnIndex(currentScenario, selectedTurnId);
  const selectedTurnProgressLabel =
    currentScenario && selectedTurnIndex >= 0
      ? `Turn ${selectedTurnIndex + 1} of ${currentScenario.turns.length}`
      : "Choose a turn";
  const selectedCompletedTurnIds =
    activeScenarioProgress?.completedTurnIds ?? [];
  const latestIncompleteScenario =
    latestIncompleteSession && bootstrap
      ? bootstrap.scenarios.find(
          (scenario) => scenario.id === latestIncompleteSession.scenarioId
        ) ?? null
      : null;
  const latestIncompleteTurnId = latestIncompleteSession
    ? currentTurnIdForSession(latestIncompleteSession)
    : undefined;
  const latestIncompleteTurn =
    latestIncompleteScenario?.turns.find((turn) => turn.id === latestIncompleteTurnId) ??
    null;
  const latestIncompleteTurnIndex = findScenarioTurnIndex(
    latestIncompleteScenario,
    latestIncompleteTurnId
  );
  const isResumeSelectionActive =
    latestIncompleteSession?.scenarioId === selectedScenarioId &&
    latestIncompleteTurnId === selectedTurnId;
  const activeFeedbackScenario =
    activeSession && bootstrap
      ? bootstrap.scenarios.find((scenario) => scenario.id === activeSession.scenarioId) ??
        null
      : null;
  const activeFeedbackOutcome = activeSession
    ? deriveScenarioOutcome(activeSession)
    : null;
  const activeFeedbackCurrentTurnId = activeSession
    ? currentTurnIdForSession(activeSession)
    : undefined;
  const activeFeedbackCurrentTurn =
    activeFeedbackScenario?.turns.find(
      (turn) => turn.id === activeFeedbackCurrentTurnId
    ) ?? null;
  const activeFeedbackAttemptedTurnIndex = activeSession
    ? findScenarioTurnIndex(activeFeedbackScenario, activeSession.scenarioSnapshot.turnId)
    : -1;
  const activeFeedbackCurrentTurnIndex = findScenarioTurnIndex(
    activeFeedbackScenario,
    activeFeedbackCurrentTurnId
  );

  useEffect(() => {
    if (!bootstrap || !currentScenario) {
      return;
    }

    setSelectedVariantId((current) =>
      currentScenario.variants.some((variant) => variant.id === current)
        ? current
        : defaultVariantId(currentScenario)
    );
    setSelectedTurnId((current) =>
      currentScenario.turns.some((turn) => turn.id === current)
        ? current
        : defaultTurnId(currentScenario)
    );

    const listeningPackIds = new Set(
      scenarioListeningPacks.map((pack) => pack.id)
    );
    setSelectedListeningPackId((current) =>
      current && listeningPackIds.has(current)
        ? current
        : defaultListeningPackId(bootstrap, currentScenario)
    );
  }, [bootstrap, currentScenario, scenarioListeningPacks]);

  useEffect(() => {
    setSelectedBranchOptionId((current) =>
      currentTurn?.branchOptions.some((branch) => branch.id === current)
        ? current
        : currentTurn?.branchOptions[0]?.id ?? ""
    );
  }, [currentTurn]);

  function loadIntoComposer(text: string, source: SessionSource = "text") {
    setInput(text);
    setInputSource(source);
    setErrorMessage(null);
  }

  function selectScenarioFlow(options: {
    scenarioId: string;
    variantId?: string;
    turnId?: string;
    listeningPackId?: string;
    mode?: PracticeMode;
    difficulty?: Difficulty;
  }) {
    if (!bootstrap) {
      return;
    }

    const scenario =
      bootstrap.scenarios.find((candidate) => candidate.id === options.scenarioId) ??
      null;

    if (!scenario) {
      return;
    }

    const nextVariantId =
      scenario.variants.find((variant) => variant.id === options.variantId)?.id ??
      defaultVariantId(scenario);
    const nextTurn =
      scenario.turns.find((turn) => turn.id === options.turnId) ??
      scenario.turns[0] ??
      null;
    const scenarioPackIds = new Set(
      listeningPacksForScenario(bootstrap, scenario.id).map((pack) => pack.id)
    );
    const nextListeningPackId =
      (options.listeningPackId && scenarioPackIds.has(options.listeningPackId)
        ? options.listeningPackId
        : undefined) ??
      nextTurn?.listeningPackId ??
      defaultListeningPackId(bootstrap, scenario);

    setSelectedScenarioId(scenario.id);
    setSelectedVariantId(nextVariantId);
    setSelectedTurnId(nextTurn?.id ?? "");
    setSelectedBranchOptionId(nextTurn?.branchOptions[0]?.id ?? "");
    setSelectedListeningPackId(nextListeningPackId);

    if (options.mode) {
      setMode(options.mode);
    }

    if (options.difficulty) {
      setDifficulty(options.difficulty);
    }
  }

  function handleResumeSession(session: PracticeSession, loadPrompt = true) {
    const resumeTurnId =
      currentTurnIdForSession(session) ?? session.scenarioSnapshot.turnId;

    selectScenarioFlow({
      scenarioId: session.scenarioId,
      variantId: session.scenarioSnapshot.variantId,
      turnId: resumeTurnId,
      listeningPackId: session.scenarioSnapshot.listeningPackId,
      mode: session.mode,
      difficulty: session.difficulty
    });
    setActiveSession(session);

    if (loadPrompt) {
      loadIntoComposer(resumePromptForSession(session));
    }
  }

  function handleReplaySamePath() {
    if (!currentScenario) {
      return;
    }

    setActiveSession(null);
    selectScenarioFlow({
      scenarioId: currentScenario.id,
      variantId: selectedVariantId || defaultVariantId(currentScenario),
      turnId: defaultTurnId(currentScenario)
    });
    loadIntoComposer(
      starterPromptForVariant(
        currentScenario,
        selectedVariantId || defaultVariantId(currentScenario)
      )
    );
  }

  function handleTryVariation() {
    if (!currentScenario) {
      return;
    }

    const nextVariantId = nextScenarioVariantId(currentScenario, selectedVariantId);

    setActiveSession(null);
    selectScenarioFlow({
      scenarioId: currentScenario.id,
      variantId: nextVariantId,
      turnId: defaultTurnId(currentScenario)
    });
    loadIntoComposer(starterPromptForVariant(currentScenario, nextVariantId));
  }

  async function refreshLearnerSessions(
    learnerId: string,
    preferredSessionId?: string
  ) {
    setIsLoadingSessions(true);

    try {
      const payload = await fetchSessions(learnerId);

      if (currentLearnerIdRef.current !== learnerId) {
        return;
      }

      setSessions(payload.sessions);
      setReview(payload.review);
      setActiveSession((current) => {
        if (preferredSessionId) {
          return (
            payload.sessions.find((session) => session.id === preferredSessionId) ??
            payload.sessions[0] ??
            null
          );
        }

        if (current) {
          return (
            payload.sessions.find((session) => session.id === current.id) ??
            payload.sessions[0] ??
            null
          );
        }

        return payload.sessions[0] ?? null;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load learner sessions."
      );
    } finally {
      setIsLoadingSessions(false);
    }
  }

  useEffect(() => {
    if (!selectedLearnerId) {
      autoResumeLearnerIdRef.current = null;
      setSessions([]);
      setReview(null);
      setActiveSession(null);
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
        setReview(payload.review);
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

  useEffect(() => {
    autoResumeLearnerIdRef.current = null;
  }, [selectedLearnerId]);

  useEffect(() => {
    if (
      !bootstrap ||
      !selectedLearnerId ||
      isLoadingSessions ||
      autoResumeLearnerIdRef.current === selectedLearnerId
    ) {
      return;
    }

    const resumeSession = findLatestIncompleteSession(sessions);

    autoResumeLearnerIdRef.current = selectedLearnerId;

    if (!resumeSession) {
      return;
    }

    handleResumeSession(resumeSession);
  }, [bootstrap, isLoadingSessions, selectedLearnerId, sessions]);

  async function submitCoach(rawInput: string, source: SessionSource) {
    const trimmed = rawInput.trim();
    const requestLearnerId = selectedLearnerId;
    const requestTurnId = selectedTurnId;
    const requestScenarioId = selectedScenarioId;
    const requestScenarioProgress =
      latestScenarioSession?.scenarioId === requestScenarioId &&
      latestScenarioCurrentTurnId === requestTurnId
        ? latestScenarioSession.scenarioProgress
        : undefined;
    const requestScenarioFamilyProgress =
      latestScenarioSession?.scenarioId === requestScenarioId
        ? latestScenarioSession.scenarioFamilyProgress
        : undefined;

    if (!trimmed || !requestLearnerId || !selectedScenarioId) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { session } = await runCoach({
        learnerId: requestLearnerId,
        mode,
        difficulty,
        scenarioId: selectedScenarioId,
        input: trimmed,
        source,
        scenarioVariantId: selectedVariantId || undefined,
        scenarioTurnId: selectedTurnId || undefined,
        scenarioState: requestTurnId
          ? { currentTurnId: requestTurnId }
          : undefined,
        scenarioProgress: requestScenarioProgress,
        scenarioFamilyProgress: requestScenarioFamilyProgress,
        selectedBranchOptionId: selectedBranchOptionId || undefined,
        listeningPackId: selectedListeningPackId || undefined
      });

      if (currentLearnerIdRef.current !== requestLearnerId) {
        return;
      }

      const nextTurnId = session.scenarioState?.currentTurnId ?? requestTurnId;
      const nextTurn =
        bootstrap?.scenarios
          .find((scenario) => scenario.id === requestScenarioId)
          ?.turns.find((turn) => turn.id === nextTurnId) ?? null;

      setActiveSession(session);
      setSelectedTurnId(nextTurnId);
      setSelectedBranchOptionId((current) =>
        session.scenarioProgress?.isComplete || nextTurnId !== requestTurnId
          ? nextTurn?.branchOptions[0]?.id ?? ""
          : current
      );
      if (nextTurn?.listeningPackId) {
        setSelectedListeningPackId(nextTurn.listeningPackId);
      }
      setInputSource(source);
      await refreshLearnerSessions(requestLearnerId, session.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Coach request failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRunCoach() {
    void submitCoach(input, inputSource);
  }

  async function handleTranscript(audio: Blob) {
    const { transcript, warning } = await transcribeAudio(audio);
    setInput(transcript);
    setInputSource("speech");
    setErrorMessage(warning ?? null);

    if (!transcript.trim()) {
      return;
    }

    setAudioStatus("Running coach from the transcript...");
    await submitCoach(transcript, "speech");
    setAudioStatus(null);
  }

  function handleBranchAdvance(branch: ScenarioBranchOptionRecord) {
    setSelectedBranchOptionId(branch.id);
    loadIntoComposer(branch.prompt);
  }

  function loadListeningLine(pack: ListeningPackRecord, modeSource: SessionSource = "text") {
    loadIntoComposer(pack.dictationLine, modeSource);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
      <section className="panel">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Shared coach workspace</p>
            <h2 className="section-title">Scenario loop, couple flow, and listening lab</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill bg-palm/10 text-palm">Backend-backed</span>
            <span className="pill bg-ocean/10 text-ocean">
              {bootstrap?.speech.enabled
                ? `Speech ${bootstrap.speech.provider}`
                : "Text-first"}
            </span>
            {topRecurring ? (
              <span className="pill bg-terracotta/10 text-terracotta">
                Review {formatTag(topRecurring.code)}
              </span>
            ) : null}
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
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as PracticeMode)}
                >
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

            {latestIncompleteSession && latestIncompleteScenario ? (
              <div className="mt-4 rounded-[1.5rem] border border-ocean/20 bg-ocean/8 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">
                      {isResumeSelectionActive
                        ? "Resuming saved scenario"
                        : "Resume incomplete scenario"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-coffee/80">
                      {latestIncompleteScenario.title}
                      {latestIncompleteTurn && latestIncompleteTurnIndex >= 0
                        ? ` is waiting on Turn ${latestIncompleteTurnIndex + 1} of ${latestIncompleteScenario.turns.length}: ${latestIncompleteTurn.title}.`
                        : " has a saved turn ready to continue."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResumeSession(latestIncompleteSession)}
                    className="rounded-full bg-ocean px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1f6f7f]"
                  >
                    {isResumeSelectionActive ? "Load resume prompt" : "Resume turn"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.5rem] border border-coffee/10 bg-sand/45 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <span className="pill bg-palm/10 text-palm">
                    {currentScenario?.difficulty ?? "scenario"}
                  </span>
                  {currentVariant ? (
                    <span className="pill bg-ocean/10 text-ocean">
                      Variant {currentVariant.title}
                    </span>
                  ) : null}
                  {currentTurn ? (
                    <span className="pill bg-terracotta/10 text-terracotta">
                      Turn {currentTurn.title}
                    </span>
                  ) : null}
                  {activeScenarioProgress ? (
                    <span className="pill bg-coffee/8 text-coffee">
                      {activeScenarioProgress.isComplete
                        ? "Scenario complete"
                        : `${activeScenarioProgress.completedTurnIds.length}/${activeScenarioProgress.totalTurns} complete`}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-palm">
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

                {currentScenario ? (
                  <div className="mt-4 rounded-[1.3rem] border border-coffee/10 bg-white/70 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                        Turn progress
                      </p>
                      <p className="text-sm font-semibold text-coffee">
                        {isCurrentScenarioComplete ? "Path complete" : selectedTurnProgressLabel}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {currentScenario.turns.map((turn, index) => {
                        const isCompleted = selectedCompletedTurnIds.includes(turn.id);
                        const isCurrent = turn.id === selectedTurnId && !isCompleted;
                        const statusLabel = isCompleted
                          ? "Complete"
                          : isCurrent
                            ? "Current"
                            : index > selectedTurnIndex
                              ? "Up next"
                              : "Ready";

                        return (
                          <div
                            key={turn.id}
                            className={`rounded-[1.2rem] border px-4 py-3 ${
                              isCompleted
                                ? "border-palm/25 bg-palm/8"
                                : isCurrent
                                  ? "border-terracotta/35 bg-white"
                                  : "border-coffee/10 bg-sand/35"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-coffee">
                                Turn {index + 1}
                              </p>
                              <span className="text-xs uppercase tracking-[0.16em] text-coffee/55">
                                {statusLabel}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-coffee/80">
                              {turn.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="field">
                    <span>Variant</span>
                    <select
                      value={selectedVariantId}
                      onChange={(event) => setSelectedVariantId(event.target.value)}
                    >
                      {currentScenario?.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Turn</span>
                    <select
                      value={selectedTurnId}
                      onChange={(event) => setSelectedTurnId(event.target.value)}
                    >
                      {currentScenario?.turns.map((turn) => (
                        <option key={turn.id} value={turn.id}>
                          {turn.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Listening pack</span>
                    <select
                      value={selectedListeningPackId}
                      onChange={(event) => setSelectedListeningPackId(event.target.value)}
                    >
                      {scenarioListeningPacks.length > 0 ? (
                        scenarioListeningPacks.map((pack) => (
                          <option key={pack.id} value={pack.id}>
                            {pack.title}
                          </option>
                        ))
                      ) : (
                        <option value="">No linked pack yet</option>
                      )}
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-coffee/10 bg-white/70 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                      Current branch
                    </p>
                    <p className="mt-3 text-sm leading-6 text-coffee/80">
                      {currentTurn?.prompt ?? "Choose a turn to anchor the next reply."}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-coffee/55">
                      Listen for
                    </p>
                    <p className="mt-2 text-sm leading-6 text-coffee/75">
                      {currentTurn?.listenFor.join(" • ") ??
                        "Turn-specific listening targets will appear here."}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-coffee/55">
                      Repair cue
                    </p>
                    <p className="mt-2 text-sm leading-6 text-coffee/75">
                      {currentTurn?.repairCue ??
                        "Useful repair guidance will appear once the turn is selected."}
                    </p>
                  </div>

                  <div className="rounded-[1.3rem] border border-coffee/10 bg-white/70 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                      Costa Rica realism
                    </p>
                    <p className="mt-3 text-sm leading-6 text-coffee/80">
                      {currentVariant?.setup ??
                        "Variant details will appear here when the scenario loads."}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-coffee/75">
                      Reply style: {currentVariant?.localReplyStyle ?? "Not set"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-coffee/75">
                      Pressure note: {currentVariant?.pressureNote ?? "Not set"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-[1.3rem] border border-coffee/10 bg-white/70 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                      Likely misunderstandings
                    </p>
                    <p className="mt-3 text-sm leading-6 text-coffee/75">
                      {currentScenario?.likelyMisunderstandings.join(" • ") ??
                        "Misunderstanding cues will load from the scenario pack."}
                    </p>
                  </div>

                  <div className="rounded-[1.3rem] border border-coffee/10 bg-white/70 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                      Couple support
                    </p>
                    <p className="mt-3 text-sm leading-6 text-coffee/75">
                      Roles:{" "}
                      {currentScenario?.coupleSupport?.partnerRoles.join(" • ") ??
                        currentScenario?.partnerRoles.join(" • ") ??
                        "Partner roles will appear here."}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-coffee/75">
                      {currentScenario?.coupleSupport?.keepBothInvolvedTip ??
                        "Couple-specific handoff guidance will appear here."}
                    </p>
                  </div>

                  <div className="rounded-[1.3rem] border border-coffee/10 bg-white/70 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                      Learner profile
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-coffee">
                      {currentLearner?.displayName ?? "Loading learner"}
                    </h3>
                    <p className="mt-2 text-sm text-coffee/75">
                      Level: {currentLearner?.learnerLevel ?? "Unknown"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-coffee/75">
                      {currentLearner?.confidenceNotes ??
                        "Learner notes will appear when the backend profile loads."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-coffee/10 bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                  Listening Lab starter
                </p>
                {currentListeningPack ? (
                  <div className="mt-3 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-coffee">
                        {currentListeningPack.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-coffee/75">
                        {currentListeningPack.challenge}
                      </p>
                    </div>

                    <div className="rounded-[1.2rem] border border-coffee/10 bg-sand/35 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-coffee/55">
                        Preview line
                      </p>
                      <p className="mt-2 text-sm leading-6 text-coffee/80">
                        {currentListeningPack.previewLine}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-coffee/55">
                        Comprehension checks
                      </p>
                      {currentListeningPack.comprehensionChecks.map((question) => (
                        <p
                          key={question}
                          className="text-sm leading-6 text-coffee/75"
                        >
                          {question}
                        </p>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-coffee/55">
                        Cue notes
                      </p>
                      {currentListeningPack.cueNotes.map((note) => (
                        <p key={note} className="text-sm leading-6 text-coffee/75">
                          {note}
                        </p>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => loadListeningLine(currentListeningPack)}
                        className="rounded-full bg-palm px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#26584b]"
                      >
                        Load dictation line
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          loadIntoComposer(
                            currentListeningPack.shadowingLines[0] ??
                              currentListeningPack.previewLine
                          )
                        }
                        className="rounded-full bg-ocean px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1f6f7f]"
                      >
                        Load shadowing line
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-coffee/70">
                    Link a listening pack to this scenario to seed dictation and shadowing.
                  </p>
                )}
              </div>
            </div>

            {isCurrentScenarioComplete ? (
              <div className="mt-4 rounded-[1.5rem] border border-palm/20 bg-palm/8 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                  Scenario complete
                </p>
                <p className="mt-2 text-sm leading-6 text-coffee/80">
                  You finished this path through {currentScenario?.title ?? "the scenario"}.
                  Replay the same setup, or switch to a different variant for a fresh prompt.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleReplaySamePath}
                    className="rounded-full bg-palm px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#26584b]"
                  >
                    Replay same path
                  </button>
                  <button
                    type="button"
                    onClick={handleTryVariation}
                    className="rounded-full bg-ocean px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1f6f7f]"
                  >
                    Try variation
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-coffee/65">
                  Variation currently changes the setup and starter prompt while the
                  turn path stays the same in the current scenario data.
                </p>
              </div>
            ) : currentTurn?.branchOptions.length ? (
              <div className="mt-4 rounded-[1.5rem] border border-coffee/10 bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                  Branch options
                </p>
                <p className="mt-2 text-sm leading-6 text-coffee/75">
                  The highlighted branch is what will happen after a successful reply.
                  If the coach asks for a retry, you stay on this turn and keep that
                  branch ready.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {currentTurn.branchOptions.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleBranchAdvance(branch)}
                      className={`rounded-[1.3rem] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white ${
                        selectedBranchOptionId === branch.id
                          ? "border-terracotta/40 bg-white"
                          : "border-coffee/10 bg-sand/35 hover:border-terracotta/30"
                      }`}
                    >
                      <p className="text-sm font-semibold text-coffee">
                        {branch.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-coffee/75">
                        {branch.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

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
                placeholder="Write, paste, or record Spanish here..."
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-coffee/70">
              <div className="space-y-2">
                <p>
                  Live note:{" "}
                  {deferredInput.trim()
                    ? "feedback stays tied to this learner, scenario branch, and persisted mistake history."
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
                  disabled={isSubmitting || !bootstrap}
                  onTranscript={handleTranscript}
                  onError={setErrorMessage}
                  onStatusChange={setAudioStatus}
                />
                <button
                  type="button"
                  onClick={handleRunCoach}
                  disabled={
                    isSubmitting ||
                    !input.trim() ||
                    !selectedLearnerId ||
                    !selectedScenarioId
                  }
                  className="rounded-full bg-terracotta px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b85a2e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Coaching..." : "Run shared coach"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <div className="mb-6">
          <p className="eyebrow">Current feedback</p>
          <h2 className="section-title">Branch-aware coaching</h2>
        </div>

        {activeSession ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="pill bg-palm/10 text-palm">
                {activeSession.feedback.inputMode}
              </span>
              <span className="pill bg-ocean/10 text-ocean">
                {activeSession.feedback.feedbackMode}
              </span>
              <span className="pill bg-coffee/8 text-coffee">
                {activeSession.feedback.provider}
              </span>
              <span className="pill bg-sunrise/15 text-coffee">
                confidence {confidencePercent(activeSession.feedback.confidenceScore)}
              </span>
              {activeSession.scenarioSnapshot.variantLabel ? (
                <span className="pill bg-sand text-coffee">
                  {activeSession.scenarioSnapshot.variantLabel}
                </span>
              ) : null}
              {activeSession.scenarioSnapshot.turnLabel ? (
                <span className="pill bg-terracotta/10 text-terracotta">
                  {activeSession.scenarioSnapshot.turnLabel}
                </span>
              ) : null}
              {activeSession.scenarioProgress ? (
                <span className="pill bg-coffee/8 text-coffee">
                  {activeSession.scenarioProgress.isComplete
                    ? "Scenario complete"
                    : `${activeSession.scenarioProgress.completedTurnIds.length}/${activeSession.scenarioProgress.totalTurns} complete`}
                </span>
              ) : null}
            </div>

            {activeFeedbackOutcome ? (
              <div className="rounded-[1.3rem] border border-terracotta/15 bg-terracotta/6 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
                  {activeFeedbackOutcome === "retry"
                    ? "Retry this turn"
                    : activeFeedbackOutcome === "continue"
                      ? "Continue to the next turn"
                      : "Path complete"}
                </p>
                <p className="mt-2 text-sm leading-6 text-coffee/80">
                  {activeFeedbackOutcome === "retry"
                    ? `You are still on ${activeSession.scenarioSnapshot.turnLabel ?? "this turn"}${
                        activeFeedbackAttemptedTurnIndex >= 0 && activeSession.scenarioProgress
                          ? ` (Turn ${activeFeedbackAttemptedTurnIndex + 1} of ${activeSession.scenarioProgress.totalTurns})`
                          : ""
                      }. Clean up this reply first, then the branch will move forward.`
                    : activeFeedbackOutcome === "continue"
                      ? `You cleared ${activeSession.scenarioSnapshot.turnLabel ?? "this turn"}${
                          activeFeedbackCurrentTurn &&
                          activeFeedbackCurrentTurnIndex >= 0 &&
                          activeSession.scenarioProgress
                            ? `. Next up is ${activeFeedbackCurrentTurn.title} (Turn ${
                                activeFeedbackCurrentTurnIndex + 1
                              } of ${activeSession.scenarioProgress.totalTurns}).`
                            : "."
                        }`
                      : `You finished this path through ${activeSession.scenarioSnapshot.title}. Use Replay same path or Try variation in the scenario panel to keep practicing.`}
                </p>

                {activeFeedbackOutcome === "retry" ? (
                  <button
                    type="button"
                    onClick={() => loadIntoComposer(activeSession.feedback.retryPrompt)}
                    className="mt-3 rounded-full bg-terracotta px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#b85a2e]"
                  >
                    Load retry prompt
                  </button>
                ) : null}

                {activeFeedbackOutcome === "continue" ? (
                  <button
                    type="button"
                    onClick={() => loadIntoComposer(activeSession.feedback.followUpPrompt)}
                    className="mt-3 rounded-full bg-ocean px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1f6f7f]"
                  >
                    Load follow-up
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="feedback-block">
              <span>
                {activeSession.source === "speech" ? "Transcript" : "Original reply"}
              </span>
              <p>{activeSession.feedback.transcriptText}</p>
            </div>

            <div className="feedback-block">
              <span>Scenario branch</span>
              <p>{activeSession.scenarioSnapshot.turnPrompt ?? activeSession.scenarioSnapshot.userGoal}</p>
            </div>

            <div className="feedback-block">
              <span>Corrected Spanish</span>
              <p>{activeSession.feedback.correctedText}</p>
            </div>

            <div className="feedback-block">
              <span>More natural version</span>
              <p>{activeSession.feedback.naturalText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadIntoComposer(activeSession.feedback.correctedText)}
                  className="rounded-full bg-palm px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#26584b]"
                >
                  Use corrected
                </button>
                <button
                  type="button"
                  onClick={() => loadIntoComposer(activeSession.feedback.naturalText)}
                  className="rounded-full bg-ocean px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1f6f7f]"
                >
                  Use natural
                </button>
              </div>
            </div>

            <div className="feedback-block">
              <span>Minimal explanation</span>
              <p>{activeSession.feedback.explanationSummary}</p>
            </div>

            <div className="feedback-block">
              <span>Retry prompt</span>
              <p>{activeSession.feedback.retryPrompt}</p>
            </div>

            <div className="feedback-block">
              <span>Follow-up prompt</span>
              <p>{activeSession.feedback.followUpPrompt}</p>
            </div>

            {activeSession.feedback.coupleHandoff ? (
              <div className="feedback-block">
                <span>Couple handoff</span>
                <p>
                  {activeSession.feedback.coupleHandoff.leadRole} to{" "}
                  {activeSession.feedback.coupleHandoff.supportRole}
                </p>
                <p className="mt-2 text-sm leading-6 text-coffee/75">
                  {activeSession.feedback.coupleHandoff.handoffPrompt}
                </p>
                <p className="mt-2 text-sm leading-6 text-coffee/70">
                  {activeSession.feedback.coupleHandoff.coachingTip}
                </p>
              </div>
            ) : null}

            {activeSession.feedback.listeningRecommendation ? (
              <div className="feedback-block">
                <span>Listening lab link</span>
                <p>{activeSession.feedback.listeningRecommendation.reason}</p>
                <p className="mt-2 text-sm leading-6 text-coffee/75">
                  {activeSession.feedback.listeningRecommendation.previewLine}
                </p>
              </div>
            ) : null}

            <div className="feedback-block">
              <span>Error focus</span>
              <div className="mt-2 space-y-3">
                {activeSession.feedback.errorTags.length > 0 ? (
                  activeSession.feedback.errorTags.map((tag) => (
                    <div key={`${tag.code}-${tag.message}`}>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`pill ${
                            tag.severity === "primary"
                              ? "bg-terracotta/10 text-terracotta"
                              : "bg-coffee/8 text-coffee"
                          }`}
                        >
                          {formatTag(tag.code)}
                        </span>
                        <span className="pill bg-sand text-coffee">
                          {tag.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-coffee/80">
                        {tag.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No major error tags were flagged for this turn.</p>
                )}
              </div>
            </div>

            <div className="feedback-block">
              <span>Recommended drills</span>
              <div className="mt-3 space-y-3">
                {activeSession.feedback.recommendedDrills.map((drill) => (
                  <div
                    key={drill.id}
                    className="rounded-[1.2rem] border border-coffee/10 bg-sand/35 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="pill bg-terracotta/10 text-terracotta">
                        {formatDrillKind(drill.kind)}
                      </span>
                      {drill.focusTagCode ? (
                        <span className="pill bg-coffee/8 text-coffee">
                          {formatTag(drill.focusTagCode)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-base font-semibold text-coffee">
                      {drill.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-coffee/75">
                      {drill.reason}
                    </p>
                    <div className="mt-3 space-y-2">
                      {drill.steps.map((step) => (
                        <p
                          key={`${drill.id}-${step.label}-${step.prompt}`}
                          className="text-sm leading-6 text-coffee/75"
                        >
                          <span className="font-semibold text-coffee">{step.label}:</span>{" "}
                          {step.prompt}
                        </p>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => loadIntoComposer(practicePromptForDrill(drill))}
                      className="mt-3 rounded-full bg-palm px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#26584b]"
                    >
                      Load drill
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="feedback-block">
              <span>Vocabulary notes</span>
              <div className="mt-2 space-y-3">
                {activeSession.feedback.vocabNotes.map((note) => (
                  <div key={`${note.term}-${note.gloss}`}>
                    <p className="font-semibold text-coffee">
                      {note.term}{" "}
                      <span className="font-normal text-coffee/60">({note.gloss})</span>
                    </p>
                    <p className="mt-1 text-sm leading-6 text-coffee/75">{note.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="feedback-block">
              <span>Pronunciation hints</span>
              <div className="mt-2 space-y-3">
                {activeSession.feedback.pronunciationHints.map((hint) => (
                  <div key={`${hint.term}-${hint.hint}`}>
                    <p className="font-semibold text-coffee">{hint.term}</p>
                    <p className="mt-1 text-sm leading-6 text-coffee/75">{hint.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="feedback-block">
              <span>Review recommendation</span>
              <p>{activeSession.feedback.reviewRecommendation.reason}</p>
              <p className="mt-2 text-sm leading-6 text-coffee/70">
                Next step: {activeSession.feedback.reviewRecommendation.nextStep}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-coffee/70">
            Run the shared coach to generate the first structured practice session.
          </p>
        )}
      </section>

      <section className="panel lg:col-span-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Review and progress</p>
            <h2 className="section-title">Richer drills, recurring tags, and listening follow-up</h2>
          </div>
          <p className="text-sm text-coffee/65">
            {review
              ? "Recurring tags and drill recommendations are derived from persisted learner sessions, not just the current tab."
              : "Choose a learner to load the review summary."}
          </p>
        </div>

        {review ? (
          <div className="grid gap-4 xl:grid-cols-[0.7fr_1fr_1.3fr]">
            <div className="rounded-[1.5rem] border border-coffee/10 bg-sand/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                Progress snapshot
              </p>
              <div className="mt-3 space-y-3 text-sm text-coffee/80">
                <p>
                  Sessions stored:{" "}
                  <span className="font-semibold text-coffee">{review.totalSessions}</span>
                </p>
                <p>
                  Average confidence:{" "}
                  <span className="font-semibold text-coffee">
                    {confidencePercent(review.averageConfidence)}
                  </span>
                </p>
                <p>
                  Last refresh:{" "}
                  <span className="font-semibold text-coffee">
                    {prettyDate(review.generatedAt)}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-coffee/10 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                Recurring tags
              </p>
              <div className="mt-3 space-y-4">
                {review.recurringTags.length > 0 ? (
                  review.recurringTags.map((tag) => (
                    <div key={`${tag.code}-${tag.lastSeenAt}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="pill bg-terracotta/10 text-terracotta">
                          {formatTag(tag.code)}
                        </span>
                        <span className="pill bg-coffee/8 text-coffee">
                          {tag.count}x
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-coffee/80">
                        {tag.lastMessage}
                      </p>
                      <p className="mt-1 text-xs text-coffee/60">
                        Last seen in {tag.lastScenarioTitle} on {prettyDate(tag.lastSeenAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-coffee/70">
                    No recurring tags yet. The learner needs a few saved sessions first.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-coffee/10 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-palm">
                Recommended drills
              </p>
              {review.recommendedDrills.length > 0 ? (
                <div className="mt-3 grid gap-3">
                  {review.recommendedDrills.map((drill) => (
                    <div
                      key={drill.id}
                      className="rounded-[1.2rem] border border-coffee/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span className="pill bg-terracotta/10 text-terracotta">
                          {formatDrillKind(drill.kind)}
                        </span>
                        {drill.focusTagCode ? (
                          <span className="pill bg-coffee/8 text-coffee">
                            {formatTag(drill.focusTagCode)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-lg font-semibold text-coffee">
                        {drill.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-coffee/80">
                        {drill.reason}
                      </p>
                      <p className="mt-2 text-xs text-coffee/60">
                        {drill.scenarioTitle ?? "General review"}
                      </p>
                      <button
                        type="button"
                        onClick={() => loadIntoComposer(practicePromptForDrill(drill))}
                        className="mt-3 rounded-full bg-palm px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#26584b]"
                      >
                        Load drill
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-coffee/70">
                  The first saved mistakes will turn into richer drill recommendations here.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-coffee/70">No review summary yet for this learner.</p>
        )}

        {review?.listeningRecommendations.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {review.listeningRecommendations.map((item) => (
              <div
                key={item.packId}
                className="rounded-[1.5rem] border border-coffee/10 bg-white/70 p-4"
              >
                <p className="text-sm font-semibold text-coffee">{item.packTitle}</p>
                <p className="mt-2 text-sm leading-6 text-coffee/75">{item.reason}</p>
                <p className="mt-2 text-sm leading-6 text-coffee/70">
                  {item.previewLine}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedListeningPackId(item.packId);
                    loadIntoComposer(item.previewLine);
                  }}
                  className="mt-3 rounded-full bg-ocean px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1f6f7f]"
                >
                  Open pack cue
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {review?.recentMistakes.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {review.recentMistakes.map((mistake) => (
              <div
                key={`${mistake.sessionId}-${mistake.createdAt}`}
                className="rounded-[1.5rem] border border-coffee/10 bg-sand/35 p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="pill bg-terracotta/10 text-terracotta">
                    {formatTag(mistake.primaryTag.code)}
                  </span>
                  <span className="pill bg-ocean/10 text-ocean">
                    {mistake.inputMode}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-coffee/80">
                  {mistake.transcriptText}
                </p>
                <p className="mt-2 text-sm leading-6 text-coffee/75">
                  Correction: {mistake.correctedText}
                </p>
                <p className="mt-2 text-xs text-coffee/60">
                  {mistake.scenarioTitle} • {prettyDate(mistake.createdAt)}
                </p>
                <p className="mt-2 text-sm leading-6 text-coffee/75">
                  Retry: {mistake.retryPrompt}
                </p>
              </div>
            ))}
          </div>
        ) : null}
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
                onClick={() => handleResumeSession(session, false)}
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
                  {session.scenarioSnapshot.title}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-coffee/55">
                  {session.scenarioSnapshot.variantLabel ?? "Default variant"}
                  {" • "}
                  {session.scenarioSnapshot.turnLabel ?? "Scenario start"}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-coffee/70">
                  {session.feedback.transcriptText}
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
