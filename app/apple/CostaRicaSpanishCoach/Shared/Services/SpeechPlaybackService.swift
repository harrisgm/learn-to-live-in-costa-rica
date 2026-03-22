import AVFoundation
import Foundation

@MainActor
final class SpeechPlaybackService {
    private let synthesizer = AVSpeechSynthesizer()

    func speak(_ text: String, language: String = "es-CR") {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: language)
        utterance.rate = 0.45
        synthesizer.stopSpeaking(at: .immediate)
        synthesizer.speak(utterance)
    }
}
