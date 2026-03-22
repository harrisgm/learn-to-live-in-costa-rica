import Foundation

enum CoachAPIError: LocalizedError {
    case invalidBaseURL
    case invalidResponse
    case server(message: String)

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL:
            return "Enter a valid server URL, for example http://192.168.1.40:3000."
        case .invalidResponse:
            return "The server returned an unexpected response."
        case let .server(message):
            return message
        }
    }
}

private struct ErrorPayload: Decodable {
    let error: String?
}

struct CoachAPIClient {
    func bootstrap(baseURLString: String) async throws -> BootstrapResponse {
        let request = try makeRequest(
            baseURLString: baseURLString,
            path: "/api/bootstrap",
            method: "GET"
        )
        return try await send(request, decode: BootstrapResponse.self)
    }

    func sessions(baseURLString: String, learnerID: String) async throws -> [PracticeSession] {
        let request = try makeRequest(
            baseURLString: baseURLString,
            path: "/api/sessions?learnerId=\(learnerID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? learnerID)",
            method: "GET"
        )
        let response = try await send(request, decode: SessionsResponse.self)
        return response.sessions
    }

    func runCoach(baseURLString: String, payload: CoachRequest) async throws -> PracticeSession {
        let request = try makeJSONRequest(
            baseURLString: baseURLString,
            path: "/api/coach",
            body: payload
        )
        let response = try await send(request, decode: CoachResponse.self)
        return response.session
    }

    func transcribeAudio(baseURLString: String, fileURL: URL) async throws -> SpeechTranscriptionResponse {
        let baseURL = try normalizedBaseURL(from: baseURLString)
        let url = baseURL.appending(path: "api/speech/transcribe")
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = try multipartBody(fileURL: fileURL, boundary: boundary)

        return try await send(request, decode: SpeechTranscriptionResponse.self)
    }

    private func makeJSONRequest<T: Encodable>(
        baseURLString: String,
        path: String,
        body: T
    ) throws -> URLRequest {
        var request = try makeRequest(baseURLString: baseURLString, path: path, method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        return request
    }

    private func makeRequest(baseURLString: String, path: String, method: String) throws -> URLRequest {
        let baseURL = try normalizedBaseURL(from: baseURLString)
        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw CoachAPIError.invalidBaseURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 30
        return request
    }

    private func normalizedBaseURL(from rawValue: String) throws -> URL {
        let trimmed = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw CoachAPIError.invalidBaseURL
        }

        let withScheme = trimmed.contains("://") ? trimmed : "http://\(trimmed)"
        guard let url = URL(string: withScheme) else {
            throw CoachAPIError.invalidBaseURL
        }

        return url
    }

    private func send<T: Decodable>(_ request: URLRequest, decode type: T.Type) async throws -> T {
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw CoachAPIError.invalidResponse
        }

        guard (200 ..< 300).contains(httpResponse.statusCode) else {
            let payload = try? JSONDecoder().decode(ErrorPayload.self, from: data)
            throw CoachAPIError.server(message: payload?.error ?? "Server error \(httpResponse.statusCode).")
        }

        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw CoachAPIError.invalidResponse
        }
    }

    private func multipartBody(fileURL: URL, boundary: String) throws -> Data {
        let fileData = try Data(contentsOf: fileURL)
        var data = Data()

        data.append("--\(boundary)\r\n")
        data.append("Content-Disposition: form-data; name=\"audio\"; filename=\"practice.m4a\"\r\n")
        data.append("Content-Type: audio/m4a\r\n\r\n")
        data.append(fileData)
        data.append("\r\n--\(boundary)--\r\n")

        return data
    }
}

private extension Data {
    mutating func append(_ string: String) {
        if let encoded = string.data(using: .utf8) {
            append(encoded)
        }
    }
}
