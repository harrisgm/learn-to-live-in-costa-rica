import AVFoundation
import Foundation

enum AudioRecorderError: LocalizedError {
    case permissionDenied
    case recorderUnavailable
    case noRecording

    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "Microphone access is required for recording."
        case .recorderUnavailable:
            return "The recorder could not start."
        case .noRecording:
            return "No recording was captured."
        }
    }
}

@MainActor
final class AudioRecorderService: NSObject {
    private var recorder: AVAudioRecorder?
    private var currentURL: URL?

    func startRecording() async throws {
        let granted = await requestMicrophoneAccess()
        guard granted else {
            throw AudioRecorderError.permissionDenied
        }

        #if os(iOS)
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
        try session.setActive(true)
        #endif

        let fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension("m4a")

        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 44_100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        let recorder = try AVAudioRecorder(url: fileURL, settings: settings)
        guard recorder.prepareToRecord(), recorder.record() else {
            throw AudioRecorderError.recorderUnavailable
        }

        self.recorder = recorder
        currentURL = fileURL
    }

    func stopRecording() throws -> URL {
        recorder?.stop()
        recorder = nil

        guard let currentURL else {
            throw AudioRecorderError.noRecording
        }

        self.currentURL = nil
        return currentURL
    }

    func discardRecording() {
        recorder?.stop()
        recorder = nil

        if let currentURL {
            try? FileManager.default.removeItem(at: currentURL)
        }

        currentURL = nil
    }

    private func requestMicrophoneAccess() async -> Bool {
        await withCheckedContinuation { continuation in
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                continuation.resume(returning: granted)
            }
        }
    }
}
