import Foundation

enum PracticeMode: String, Codable, CaseIterable, Identifiable {
    case tutor
    case roleplay
    case costaRica = "costa-rica"
    case couple

    var id: String { rawValue }

    var title: String {
        switch self {
        case .tutor:
            return "Tutor"
        case .roleplay:
            return "Roleplay"
        case .costaRica:
            return "Costa Rica"
        case .couple:
            return "Couple"
        }
    }
}

enum Difficulty: String, Codable, CaseIterable, Identifiable {
    case beginner
    case beginnerPlus = "beginner+"
    case intermediate
    case natural
    case costaRicaFast = "costa-rica-fast"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .beginner:
            return "Beginner"
        case .beginnerPlus:
            return "Beginner+"
        case .intermediate:
            return "Intermediate"
        case .natural:
            return "Natural"
        case .costaRicaFast:
            return "Costa Rica Fast"
        }
    }
}

enum SessionSource: String, Codable, CaseIterable, Identifiable {
    case text
    case paste
    case speech

    var id: String { rawValue }

    var title: String {
        switch self {
        case .text:
            return "Text"
        case .paste:
            return "Paste"
        case .speech:
            return "Speech"
        }
    }
}

enum FeedbackMode: String, Codable, Hashable {
    case gentle
    case standard
    case detailed
    case strict
}

enum LearnerFocus: String, Codable, Hashable {
    case beginner
    case survival
    case naturalization
}

enum DrillKind: String, Codable, Hashable {
    case retry
    case contrast
    case roleplayReset = "roleplay-reset"
    case shadowing
    case dictation
    case partnerHandoff = "partner-handoff"

    var title: String {
        switch self {
        case .retry:
            return "Retry"
        case .contrast:
            return "Contrast"
        case .roleplayReset:
            return "Roleplay Reset"
        case .shadowing:
            return "Shadowing"
        case .dictation:
            return "Dictation"
        case .partnerHandoff:
            return "Partner Handoff"
        }
    }
}

enum ErrorSeverity: String, Codable, Hashable {
    case primary
    case secondary
}

struct ErrorTag: Codable, Hashable {
    let code: String
    let severity: ErrorSeverity
    let message: String
}

struct VocabNote: Codable, Hashable {
    let term: String
    let gloss: String
    let note: String
}

struct PronunciationHint: Codable, Hashable {
    let term: String
    let hint: String
}

struct ReviewRecommendation: Codable, Hashable {
    let shouldReview: Bool
    let reason: String
    let nextStep: String
}

struct DrillStep: Codable, Hashable {
    let label: String
    let prompt: String
}

struct CoupleHandoff: Codable, Hashable {
    let leadRole: String
    let supportRole: String
    let handoffPrompt: String
    let coachingTip: String
}

struct ListeningRecommendation: Codable, Hashable {
    let packId: String
    let packTitle: String
    let reason: String
    let previewLine: String
}

struct ScenarioSnapshot: Codable, Hashable {
    let id: String
    let title: String
    let setting: String
    let userGoal: String
    let variantId: String?
    let variantLabel: String?
    let turnId: String?
    let turnLabel: String?
    let turnPrompt: String?
    let partnerRole: String?
    let listeningPackId: String?
    let listeningPackTitle: String?
}

struct ScenarioVariantRecord: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let setup: String
    let localReplyStyle: String
    let pressureNote: String
    let starterPrompt: String?
}

struct ScenarioBranchOptionRecord: Codable, Identifiable, Hashable {
    let id: String
    let label: String
    let prompt: String
    let nextTurnId: String
}

struct ScenarioTurnRecord: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let learnerGoal: String
    let localRole: String
    let prompt: String
    let listenFor: [String]
    let repairCue: String
    let branchOptions: [ScenarioBranchOptionRecord]
    let coupleHandoffPrompt: String?
    let recommendedDrillIds: [String]?
    let listeningPackId: String?
}

struct ScenarioDrillRecord: Codable, Identifiable, Hashable {
    let id: String
    let kind: DrillKind
    let title: String
    let goal: String
    let prompt: String
    let steps: [String]
    let focusTagCodes: [String]?
    let listeningPackId: String?
}

struct CoupleSupportRecord: Codable, Hashable {
    let sharedGoal: String
    let partnerRoles: [String]
    let handoffPrompts: [String]
    let keepBothInvolvedTip: String
}

struct ListeningCueRecord: Codable, Hashable {
    let packId: String
    let focus: String
    let previewLine: String
}

struct ScenarioRecord: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let setting: String
    let difficulty: Difficulty
    let userGoal: String
    let mustKnowVocabulary: [String]
    let starterPrompts: [String]
    let culturalNotes: [String]?
    let partnerRoles: [String]
    let likelyMisunderstandings: [String]
    let variants: [ScenarioVariantRecord]
    let turns: [ScenarioTurnRecord]
    let followUpDrills: [ScenarioDrillRecord]
    let coupleSupport: CoupleSupportRecord?
    let listeningCues: [ListeningCueRecord]?

    private enum CodingKeys: String, CodingKey {
        case id
        case title
        case setting
        case difficulty
        case userGoal
        case mustKnowVocabulary
        case starterPrompts
        case culturalNotes
        case partnerRoles
        case likelyMisunderstandings
        case variants
        case turns
        case followUpDrills
        case coupleSupport
        case listeningCues
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        setting = try container.decode(String.self, forKey: .setting)
        difficulty = try container.decode(Difficulty.self, forKey: .difficulty)
        userGoal = try container.decode(String.self, forKey: .userGoal)
        mustKnowVocabulary = try container.decode([String].self, forKey: .mustKnowVocabulary)
        starterPrompts = try container.decode([String].self, forKey: .starterPrompts)
        culturalNotes = try container.decodeIfPresent([String].self, forKey: .culturalNotes)
        partnerRoles = try container.decodeIfPresent([String].self, forKey: .partnerRoles) ?? []
        likelyMisunderstandings = try container.decodeIfPresent([String].self, forKey: .likelyMisunderstandings) ?? []
        variants = try container.decodeIfPresent([ScenarioVariantRecord].self, forKey: .variants) ?? []
        turns = try container.decodeIfPresent([ScenarioTurnRecord].self, forKey: .turns) ?? []
        followUpDrills = try container.decodeIfPresent([ScenarioDrillRecord].self, forKey: .followUpDrills) ?? []
        coupleSupport = try container.decodeIfPresent(CoupleSupportRecord.self, forKey: .coupleSupport)
        listeningCues = try container.decodeIfPresent([ListeningCueRecord].self, forKey: .listeningCues)
    }
}

struct ListeningTranscriptLineRecord: Codable, Hashable {
    let speaker: String
    let text: String
    let speed: String
    let note: String?
}

struct ListeningPackRecord: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let scenarioId: String
    let difficulty: Difficulty
    let focus: String
    let challenge: String
    let previewLine: String
    let transcript: [ListeningTranscriptLineRecord]
    let comprehensionChecks: [String]
    let dictationLine: String
    let shadowingLines: [String]
    let cueNotes: [String]
}

struct LearnerProfile: Codable, Identifiable, Hashable {
    let id: String
    let displayName: String
    let learnerLevel: Difficulty
    let goals: [String]
    let strengths: [String]
    let challenges: [String]
    let confidenceNotes: String?
    let privacyLevel: String
}

struct SpeechCapabilities: Codable, Hashable {
    let provider: String
    let enabled: Bool
    let acceptedMimeTypes: [String]
    let warning: String?
}

struct BootstrapResponse: Codable {
    let learners: [LearnerProfile]
    let scenarios: [ScenarioRecord]
    let listeningPacks: [ListeningPackRecord]
    let speech: SpeechCapabilities
}

struct Feedback: Codable, Hashable {
    let provider: String
    let inputMode: SessionSource
    let transcriptText: String
    let correctedText: String
    let naturalText: String
    let explanationSummary: String
    let errorTags: [ErrorTag]
    let retryPrompt: String
    let followUpPrompt: String
    let vocabNotes: [VocabNote]
    let pronunciationHints: [PronunciationHint]
    let feedbackMode: FeedbackMode
    let learnerFocus: LearnerFocus
    let scenarioId: String
    let sessionId: String
    let reviewRecommendation: ReviewRecommendation
    let recommendedDrills: [RecommendedDrill]
    let coupleHandoff: CoupleHandoff?
    let listeningRecommendation: ListeningRecommendation?
    let confidenceScore: Double
}

struct PracticeSession: Codable, Identifiable, Hashable {
    let id: String
    let learnerId: String
    let createdAt: String
    let mode: PracticeMode
    let difficulty: Difficulty
    let scenarioId: String
    let scenarioSnapshot: ScenarioSnapshot
    let source: SessionSource
    let userInput: String
    let feedback: Feedback

    var createdAtDate: Date? {
        ISO8601DateFormatter().date(from: createdAt)
    }
}

struct RecentMistake: Codable, Hashable {
    let sessionId: String
    let createdAt: String
    let inputMode: SessionSource
    let scenarioId: String
    let scenarioTitle: String
    let transcriptText: String
    let correctedText: String
    let primaryTag: ErrorTag
    let retryPrompt: String
}

struct RecurringTagSummary: Codable, Hashable {
    let code: String
    let count: Int
    let lastSeenAt: String
    let lastMessage: String
    let lastScenarioId: String
    let lastScenarioTitle: String
    let sampleCorrection: String
}

struct RecommendedDrill: Codable, Hashable {
    let id: String
    let kind: DrillKind
    let title: String
    let reason: String
    let prompt: String
    let steps: [DrillStep]
    let focusTagCode: String?
    let scenarioId: String?
    let scenarioTitle: String?
    let sourceSessionId: String?
    let listeningPackId: String?
}

struct LearnerReviewSummary: Codable, Hashable {
    let learnerId: String
    let generatedAt: String
    let totalSessions: Int
    let averageConfidence: Double
    let recentMistakes: [RecentMistake]
    let recurringTags: [RecurringTagSummary]
    let recommendedDrills: [RecommendedDrill]
    let nextRecommendedDrill: RecommendedDrill?
    let listeningRecommendations: [ListeningRecommendation]
}

struct SessionsResponse: Codable {
    let sessions: [PracticeSession]
    let review: LearnerReviewSummary?
}

struct CoachRequest: Codable {
    let learnerId: String
    let mode: PracticeMode
    let difficulty: Difficulty
    let scenarioId: String
    let input: String
    let source: SessionSource
    let scenarioVariantId: String?
    let scenarioTurnId: String?
    let listeningPackId: String?
}

struct CoachResponse: Codable {
    let session: PracticeSession
}

struct SpeechTranscriptionResponse: Codable {
    let transcript: String
    let provider: String
    let warning: String?
}
