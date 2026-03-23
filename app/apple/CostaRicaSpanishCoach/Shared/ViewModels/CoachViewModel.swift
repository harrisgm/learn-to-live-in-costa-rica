import Combine
import Foundation

@MainActor
final class CoachViewModel: ObservableObject {
    @Published var bootstrap: BootstrapResponse?
    @Published var sessions: [PracticeSession] = []
    @Published var reviewSummary: LearnerReviewSummary?
    @Published var activeSession: PracticeSession?
    @Published var input = ""
    @Published var selectedLearnerID = ""
    @Published var selectedScenarioID = ""
    @Published var selectedScenarioVariantID = ""
    @Published var selectedScenarioTurnID = ""
    @Published var selectedListeningPackID = ""
    @Published var selectedMode: PracticeMode = .tutor
    @Published var selectedDifficulty: Difficulty = .beginner
    @Published var inputSource: SessionSource = .text
    @Published var statusMessage: String?
    @Published var errorMessage: String?
    @Published var isLoadingBootstrap = false
    @Published var isLoadingSessions = false
    @Published var isSubmitting = false
    @Published var isRecording = false

    private let apiClient = CoachAPIClient()
    private let recorder = AudioRecorderService()
    private let speaker = SpeechPlaybackService()
    private var ignoresNextComposerChange = false

    var learners: [LearnerProfile] {
        bootstrap?.learners ?? []
    }

    var scenarios: [ScenarioRecord] {
        bootstrap?.scenarios ?? []
    }

    var listeningPacks: [ListeningPackRecord] {
        bootstrap?.listeningPacks ?? []
    }

    var currentLearner: LearnerProfile? {
        learners.first(where: { $0.id == selectedLearnerID })
    }

    var currentScenario: ScenarioRecord? {
        scenarios.first(where: { $0.id == selectedScenarioID })
    }

    var currentScenarioVariant: ScenarioVariantRecord? {
        guard let scenario = currentScenario else { return nil }

        return scenario.variants.first(where: { $0.id == selectedScenarioVariantID })
            ?? scenario.variants.first
    }

    var currentScenarioTurn: ScenarioTurnRecord? {
        guard let scenario = currentScenario else { return nil }

        return scenario.turns.first(where: { $0.id == selectedScenarioTurnID })
            ?? scenario.turns.first
    }

    var currentScenarioListeningPacks: [ListeningPackRecord] {
        guard let scenario = currentScenario else {
            return []
        }

        let scenarioPackIDs = Set((scenario.listeningCues ?? []).map { $0.packId })
        let packs = listeningPacks.filter { pack in
            pack.scenarioId == scenario.id || scenarioPackIDs.contains(pack.id)
        }

        return packs.isEmpty ? listeningPacks : packs
    }

    var currentListeningPack: ListeningPackRecord? {
        currentScenarioListeningPacks.first(where: { $0.id == selectedListeningPackID })
            ?? currentScenarioListeningPacks.first
            ?? listeningPacks.first(where: { $0.id == selectedListeningPackID })
            ?? listeningPacks.first
    }

    func connect(to baseURL: String) async {
        errorMessage = nil
        statusMessage = "Connecting to coach server..."
        isLoadingBootstrap = true

        do {
            let payload = try await apiClient.bootstrap(baseURLString: baseURL)
            bootstrap = payload

            if !payload.learners.contains(where: { $0.id == selectedLearnerID }) {
                selectedLearnerID = payload.learners.first?.id ?? ""
            }

            if !payload.scenarios.contains(where: { $0.id == selectedScenarioID }) {
                selectedScenarioID = payload.scenarios.first?.id ?? ""
            }

            syncScenarioContext()
            statusMessage = payload.speech.warning ?? "Connected to the shared coach server."
            isLoadingBootstrap = false
            await reloadSessions(baseURL: baseURL)
        } catch {
            bootstrap = nil
            sessions = []
            reviewSummary = nil
            activeSession = nil
            selectedScenarioVariantID = ""
            selectedScenarioTurnID = ""
            selectedListeningPackID = ""
            isLoadingBootstrap = false
            errorMessage = error.localizedDescription
            statusMessage = nil
        }
    }

    func reloadSessions(baseURL: String, preferredSessionID: String? = nil) async {
        guard !selectedLearnerID.isEmpty else {
            sessions = []
            reviewSummary = nil
            activeSession = nil
            return
        }

        let requestedLearnerID = selectedLearnerID
        errorMessage = nil
        isLoadingSessions = true

        do {
            let result = try await apiClient.sessions(
                baseURLString: baseURL,
                learnerID: requestedLearnerID
            )

            guard requestedLearnerID == selectedLearnerID else {
                isLoadingSessions = false
                return
            }

            sessions = result.sessions
            reviewSummary = result.review
            activeSession =
                preferredSessionID.flatMap { id in
                    result.sessions.first(where: { $0.id == id })
                } ??
                activeSession.flatMap { current in
                    result.sessions.first(where: { $0.id == current.id })
                } ??
                result.sessions.first
            isLoadingSessions = false
        } catch {
            sessions = []
            reviewSummary = nil
            activeSession = nil
            isLoadingSessions = false
            errorMessage = error.localizedDescription
        }
    }

    func submit(baseURL: String) async {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        let requestedLearnerID = selectedLearnerID

        guard !trimmed.isEmpty else {
            errorMessage = "Enter Spanish text or transcribe a recording first."
            return
        }

        guard !selectedLearnerID.isEmpty, !selectedScenarioID.isEmpty else {
            errorMessage = "Choose a learner and scenario first."
            return
        }

        syncScenarioContext()
        errorMessage = nil
        statusMessage = "Running the coach..."
        isSubmitting = true

        do {
            let session = try await apiClient.runCoach(
                baseURLString: baseURL,
                payload: CoachRequest(
                    learnerId: requestedLearnerID,
                    mode: selectedMode,
                    difficulty: selectedDifficulty,
                    scenarioId: selectedScenarioID,
                    input: trimmed,
                    source: inputSource,
                    scenarioVariantId: selectedScenarioVariantID.isEmpty ? nil : selectedScenarioVariantID,
                    scenarioTurnId: selectedScenarioTurnID.isEmpty ? nil : selectedScenarioTurnID,
                    listeningPackId: selectedListeningPackID.isEmpty ? nil : selectedListeningPackID
                )
            )

            guard requestedLearnerID == selectedLearnerID else {
                isSubmitting = false
                return
            }

            activeSession = session
            await reloadSessions(baseURL: baseURL, preferredSessionID: session.id)
            statusMessage = inputSource == .speech ? "Speech feedback ready." : "Feedback ready."
            isSubmitting = false
        } catch {
            isSubmitting = false
            errorMessage = error.localizedDescription
            statusMessage = nil
        }
    }

    func beginTyping() {
        inputSource = .text
    }

    func handleComposerChange() {
        if ignoresNextComposerChange {
            ignoresNextComposerChange = false
            return
        }

        beginTyping()
    }

    func registerPaste() {
        inputSource = .paste
    }

    func syncScenarioContext() {
        guard let scenario = currentScenario else {
            selectedScenarioVariantID = ""
            selectedScenarioTurnID = ""
            selectedListeningPackID = ""
            return
        }

        if !scenario.variants.contains(where: { $0.id == selectedScenarioVariantID }) {
            selectedScenarioVariantID = scenario.variants.first?.id ?? ""
        }

        if !scenario.turns.contains(where: { $0.id == selectedScenarioTurnID }) {
            selectedScenarioTurnID = scenario.turns.first?.id ?? ""
        }

        let availableListeningPackIDs = Set(currentScenarioListeningPacks.map { $0.id })
        if !availableListeningPackIDs.contains(selectedListeningPackID) {
            selectedListeningPackID = currentScenarioListeningPacks.first?.id ?? listeningPacks.first?.id ?? ""
        }
    }

    private func setComposerText(_ value: String, source: SessionSource) {
        ignoresNextComposerChange = input != value
        input = value
        inputSource = source
    }

    func useCorrectedText(from session: PracticeSession) {
        setComposerText(session.feedback.correctedText, source: .text)
    }

    func useNaturalText(from session: PracticeSession) {
        setComposerText(session.feedback.naturalText, source: .text)
    }

    func useFollowUpPrompt(from session: PracticeSession) {
        setComposerText(session.feedback.followUpPrompt, source: .text)
    }

    func useRecommendedDrill(_ drill: RecommendedDrill) {
        setComposerText(drill.prompt, source: .text)
    }

    func useListeningPreview(_ pack: ListeningPackRecord) {
        setComposerText(pack.dictationLine, source: .text)
    }

    func startRecording() async {
        errorMessage = nil

        do {
            try await recorder.startRecording()
            isRecording = true
            statusMessage = "Recording..."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func stopRecording(baseURL: String) async {
        do {
            let fileURL = try recorder.stopRecording()
            isRecording = false
            statusMessage = "Transcribing..."

            let response = try await apiClient.transcribeAudio(
                baseURLString: baseURL,
                fileURL: fileURL
            )

            setComposerText(response.transcript, source: .speech)
            statusMessage = response.warning ?? "Transcription ready."

            if !response.transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                statusMessage = "Transcript ready. Running coach..."
                await submit(baseURL: baseURL)
            }

            try? FileManager.default.removeItem(at: fileURL)
        } catch {
            isRecording = false
            errorMessage = error.localizedDescription
            statusMessage = nil
        }
    }

    func discardRecording() {
        recorder.discardRecording()
        isRecording = false
        statusMessage = nil
    }

    func speak(_ text: String) {
        speaker.speak(text)
    }
}
