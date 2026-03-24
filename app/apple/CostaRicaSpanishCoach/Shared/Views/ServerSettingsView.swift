import SwiftUI

struct ServerSettingsView: View {
    @Binding var serverBaseURL: String
    let onSave: (() async -> Void)?

    @Environment(\.dismiss) private var dismiss
    @State private var draftURL = ""
    @State private var isSaving = false
    @State private var isTesting = false
    @State private var testMessage: String?
    @State private var testError: String?
    @State private var previewBootstrap: BootstrapResponse?

    private let apiClient = CoachAPIClient()

    init(serverBaseURL: Binding<String>, onSave: (() async -> Void)? = nil) {
        _serverBaseURL = serverBaseURL
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    headerCard
                    connectionCard
                    installCard
                    tipsCard
                }
                .padding(24)
                .frame(maxWidth: 900, alignment: .leading)
            }
            .background(CoachBackdrop())
            .navigationTitle("Connect Your Coach")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving..." : "Save") {
                        Task {
                            await saveAndDismissIfValid()
                        }
                    }
                    .disabled(normalizedDraftURL.isEmpty || isSaving)
                }
            }
            .task {
                draftURL = serverBaseURL
            }
        }
    }

    private var normalizedDraftURL: String {
        draftURL.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var quickFillTitle: String {
        #if os(macOS)
        "Use This Mac"
        #else
        "Use Example LAN URL"
        #endif
    }

    private var headerCard: some View {
        HStack(alignment: .top, spacing: 18) {
            BrandMarkView(size: 78)

            VStack(alignment: .leading, spacing: 10) {
                Text("Point every household device at the same shared practice server.")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)

                Text("Enter the LAN address of the Mac or Windows machine running your coach backend. Once this is saved, iPhone, iPad, and Mac all share the same learner history.")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.9))
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(CoachVisuals.heroGradient)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .stroke(Color.white.opacity(0.16), lineWidth: 1)
        )
    }

    private var connectionCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            SectionIntroView(
                eyebrow: "Connection",
                title: "Save a real server address before you leave setup.",
                bodyText: "A working connection is checked here first so setup errors stay inside this screen instead of spilling back into the main app.",
                tint: CoachVisuals.terracotta
            )

            serverURLField

            HStack(spacing: 12) {
                Button {
                    #if os(macOS)
                    draftURL = "http://127.0.0.1:3000"
                    #else
                    draftURL = "http://192.168.1.40:3000"
                    #endif
                } label: {
                    Label(quickFillTitle, systemImage: "sparkles")
                }
                .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))

                Button {
                    Task {
                        await testConnection()
                    }
                } label: {
                    Label(isTesting ? "Testing..." : "Test Connection", systemImage: "wifi")
                }
                .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.palm))
                .disabled(normalizedDraftURL.isEmpty || isTesting || isSaving)
            }

            if let testError {
                statusBanner(
                    title: "Connection needs attention",
                    bodyText: testError,
                    tint: CoachVisuals.terracotta
                )
            } else if let testMessage {
                statusBanner(
                    title: "Connection looks good",
                    bodyText: testMessage,
                    tint: CoachVisuals.palm
                )
            }

            if let previewBootstrap {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: 14)], spacing: 14) {
                    MetricTileView(
                        title: "Learners",
                        value: "\(previewBootstrap.learners.count)",
                        subtitle: "Profiles found",
                        tint: CoachVisuals.terracotta
                    )
                    MetricTileView(
                        title: "Scenarios",
                        value: "\(previewBootstrap.scenarios.count)",
                        subtitle: "Practice scenes",
                        tint: CoachVisuals.ocean
                    )
                    MetricTileView(
                        title: "Speech",
                        value: previewBootstrap.speech.enabled ? "Available" : "Text-first",
                        subtitle: previewBootstrap.speech.provider,
                        tint: CoachVisuals.palm
                    )
                }
            }
        }
        .coachCard()
    }

    private var installCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            SectionIntroView(
                eyebrow: "Household Install",
                title: "Use one signed build, then reuse the same backend URL everywhere.",
                bodyText: "This app is meant to live on your actual devices, not just in a simulator.",
                tint: CoachVisuals.ocean
            )

            VStack(alignment: .leading, spacing: 16) {
                ChecklistStepView(
                    number: 1,
                    title: "Generate and open the Xcode project",
                    bodyText: "Run `xcodegen generate` in `app/apple/`, then open the project in Xcode.",
                    tint: CoachVisuals.terracotta
                )
                ChecklistStepView(
                    number: 2,
                    title: "Set your Apple team and signing",
                    bodyText: "Choose your personal Apple Developer team for the iOS and macOS targets before installing onto real devices.",
                    tint: CoachVisuals.ocean
                )
                ChecklistStepView(
                    number: 3,
                    title: "Run once on each household device",
                    bodyText: "Install to your iPhone, iPad, MacBook, or your wife’s devices directly from Xcode, then enter the same shared server URL here.",
                    tint: CoachVisuals.palm
                )
            }
        }
        .coachCard()
    }

    private var tipsCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            SectionIntroView(
                eyebrow: "Helpful Notes",
                title: "A few details make setup much smoother.",
                bodyText: "Keep the server URL simple and local-network friendly.",
                tint: CoachVisuals.sunrise
            )

            VStack(alignment: .leading, spacing: 10) {
                Text("Examples: `http://192.168.1.40:3000` on your home network, or `http://127.0.0.1:3000` when the native app and backend run on the same Mac.")
                Text("The app already allows local-network HTTP traffic, so you do not need to force HTTPS for home-LAN use.")
                Text("If you later want easier installs without plugging devices into Xcode each time, archive the app and use a signed distribution path after the direct-Xcode install flow feels stable.")
            }
            .font(.subheadline)
            .foregroundStyle(CoachVisuals.coffee.opacity(0.74))
        }
        .coachCard()
    }

    @ViewBuilder
    private var serverURLField: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Server URL")
                .font(.caption.weight(.semibold))
                .foregroundStyle(CoachVisuals.terracotta)

            #if os(iOS)
            TextField(text: $draftURL) {
                Text("http://192.168.1.40:3000")
                    .foregroundStyle(CoachVisuals.coffee.opacity(0.46))
            }
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(.body.monospaced())
                .foregroundStyle(CoachVisuals.coffee)
                .tint(CoachVisuals.ocean)
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(Color.white.opacity(0.72))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color.white.opacity(0.46), lineWidth: 1)
                )
            #else
            TextField(text: $draftURL) {
                Text("http://192.168.1.40:3000")
                    .foregroundStyle(CoachVisuals.coffee.opacity(0.46))
            }
                .textFieldStyle(.plain)
                .font(.body.monospaced())
                .foregroundStyle(CoachVisuals.coffee)
                .tint(CoachVisuals.ocean)
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(Color.white.opacity(0.72))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color.white.opacity(0.46), lineWidth: 1)
                )
            #endif
        }
    }

    private func statusBanner(title: String, bodyText: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(tint)
            Text(bodyText)
                .font(.subheadline)
                .foregroundStyle(CoachVisuals.coffee.opacity(0.78))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(tint.opacity(0.1))
        )
    }

    private func testConnection() async {
        let trimmed = normalizedDraftURL
        guard !trimmed.isEmpty else {
            testError = "Enter the server URL first."
            testMessage = nil
            previewBootstrap = nil
            return
        }

        isTesting = true
        testError = nil
        testMessage = nil

        do {
            let payload = try await apiClient.bootstrap(baseURLString: trimmed)
            previewBootstrap = payload
            testMessage = payload.speech.warning ?? "Connected successfully. Learners and scenarios are available."
        } catch {
            previewBootstrap = nil
            testError = error.localizedDescription
        }

        isTesting = false
    }

    private func saveAndDismissIfValid() async {
        let trimmed = normalizedDraftURL
        guard !trimmed.isEmpty else { return }

        isSaving = true
        await testConnection()

        guard testError == nil else {
            isSaving = false
            return
        }

        serverBaseURL = trimmed
        if let onSave {
            await onSave()
        }
        isSaving = false
        dismiss()
    }
}
