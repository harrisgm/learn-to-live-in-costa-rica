import Combine
import Foundation

@MainActor
final class CoachViewModel: ObservableObject {
    @Published var bootstrap: BootstrapResponse?
    @Published var sessions: [PracticeSession] = []
    @Published var activeSession: PracticeSession?
    @Published var input = ""
    @Published var selectedLearnerID = ""
    @Published var selectedScenarioID = ""
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

    var learners: [LearnerProfile] {
        bootstrap?.learners ?? []
    }

    var scenarios: [ScenarioRecord] {
        bootstrap?.scenarios ?? []
    }

    var currentLearner: LearnerProfile? {
        learners.first(where: { $0.id == selectedLearnerID })
    }

    var currentScenario: ScenarioRecord? {
        scenarios.first(where: { $0.id == selectedScenarioID })
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

            statusMessage = payload.speech.warning ?? "Connected to the shared coach server."
            isLoadingBootstrap = false
            await reloadSessions(baseURL: baseURL)
        } catch {
            bootstrap = nil
            sessions = []
            activeSession = nil
            isLoadingBootstrap = false
            errorMessage = error.localizedDescription
            statusMessage = nil
        }
    }

    func reloadSessions(baseURL: String) async {
        guard !selectedLearnerID.isEmpty else {
            sessions = []
            activeSession = nil
            return
        }

        errorMessage = nil
        isLoadingSessions = true

        do {
            let result = try await apiClient.sessions(
                baseURLString: baseURL,
                learnerID: selectedLearnerID
            )
            sessions = result
            activeSession = activeSession.flatMap { current in
                result.first(where: { $0.id == current.id })
            } ?? result.first
            isLoadingSessions = false
        } catch {
            isLoadingSessions = false
            errorMessage = error.localizedDescription
        }
    }

    func submit(baseURL: String) async {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmed.isEmpty else {
            errorMessage = "Enter Spanish text or transcribe a recording first."
            return
        }

        guard !selectedLearnerID.isEmpty, !selectedScenarioID.isEmpty else {
            errorMessage = "Choose a learner and scenario first."
            return
        }

        errorMessage = nil
        statusMessage = "Running the coach..."
        isSubmitting = true

        do {
            let session = try await apiClient.runCoach(
                baseURLString: baseURL,
                payload: CoachRequest(
                    learnerId: selectedLearnerID,
                    mode: selectedMode,
                    difficulty: selectedDifficulty,
                    scenarioId: selectedScenarioID,
                    input: trimmed,
                    source: inputSource
                )
            )

            sessions = [session] + sessions.filter { $0.id != session.id }
            activeSession = session
            statusMessage = "Feedback ready."
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

    func registerPaste() {
        inputSource = .paste
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

            input = response.transcript
            inputSource = .speech
            statusMessage = response.warning ?? "Transcription ready."

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
