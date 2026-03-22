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

struct ScenarioRecord: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let setting: String
    let difficulty: Difficulty
    let userGoal: String
    let mustKnowVocabulary: [String]
    let starterPrompts: [String]
    let culturalNotes: [String]?
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
    let speech: SpeechCapabilities
}

struct Feedback: Codable, Hashable {
    let provider: String
    let correctedSpanish: String
    let naturalSpanish: String
    let explanation: String
    let vocabularyNotes: [String]
    let pronunciationNotes: [String]
    let followUpReply: String
    let errorTags: [String]
    let confidenceScore: Double
}

struct PracticeSession: Codable, Identifiable, Hashable {
    let id: String
    let learnerId: String
    let createdAt: String
    let mode: PracticeMode
    let difficulty: Difficulty
    let scenarioId: String
    let source: SessionSource
    let userInput: String
    let feedback: Feedback

    var createdAtDate: Date? {
        ISO8601DateFormatter().date(from: createdAt)
    }
}

struct SessionsResponse: Codable {
    let sessions: [PracticeSession]
}

struct CoachRequest: Codable {
    let learnerId: String
    let mode: PracticeMode
    let difficulty: Difficulty
    let scenarioId: String
    let input: String
    let source: SessionSource
}

struct CoachResponse: Codable {
    let session: PracticeSession
}

struct SpeechTranscriptionResponse: Codable {
    let transcript: String
    let provider: String
    let warning: String?
}
