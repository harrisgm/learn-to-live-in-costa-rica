import SwiftUI

struct CoachRootView: View {
    @StateObject private var viewModel = CoachViewModel()
    @AppStorage("serverBaseURL") private var serverBaseURL = ""
    @State private var showingSettings = false
    @State private var showLaunchOverlay = true

    var body: some View {
        NavigationSplitView {
            sidebar
        } detail: {
            detail
        }
        .navigationSplitViewStyle(.balanced)
        .background(CoachBackdrop())
        .overlay {
            if showLaunchOverlay {
                CoachLaunchOverlayView()
                    .transition(.opacity.animation(.easeOut(duration: 0.35)))
                    .zIndex(10)
            }
        }
        .sheet(isPresented: $showingSettings) {
            ServerSettingsView(serverBaseURL: $serverBaseURL) {
                await viewModel.connect(to: serverBaseURL)
            }
        }
        .task(id: serverBaseURL) {
            guard hasConfiguredServer else { return }
            await viewModel.connect(to: serverBaseURL)
        }
        .task(id: "\(serverBaseURL)|\(viewModel.selectedLearnerID)") {
            guard hasConfiguredServer, viewModel.bootstrap != nil else { return }
            await viewModel.reloadSessions(baseURL: serverBaseURL)
        }
        .task {
            if !hasConfiguredServer {
                showingSettings = true
            }
        }
        .task {
            try? await Task.sleep(nanoseconds: 900_000_000)
            withAnimation(.easeOut(duration: 0.35)) {
                showLaunchOverlay = false
            }
        }
    }

    private var hasConfiguredServer: Bool {
        !serverBaseURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var speechStatusLabel: String {
        guard let speech = viewModel.bootstrap?.speech else {
            return hasConfiguredServer ? "Pending" : "Not configured"
        }

        return speech.enabled ? "Ready" : "Text-first"
    }

    private var sidebar: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 14) {
                        BrandMarkView(size: 68)

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Costa Rica Coach")
                                .font(.title3.weight(.bold))
                                .foregroundStyle(CoachVisuals.coffee)
                            Text("A household Spanish practice app for life in Costa Rica.")
                                .font(.subheadline)
                                .foregroundStyle(CoachVisuals.coffee.opacity(0.72))
                        }
                    }

                    HStack {
                        ChipView(title: "iPhone + iPad + Mac", tint: CoachVisuals.terracotta)
                        ChipView(title: "Shared Home Coach", tint: CoachVisuals.ocean)
                    }
                }
                .listRowInsets(EdgeInsets(top: 18, leading: 16, bottom: 18, trailing: 16))
                .listRowBackground(Color.clear)
            }

            Section("Recent Sessions") {
                if viewModel.sessions.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(viewModel.isLoadingSessions ? "Loading recent practice..." : "No sessions yet")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(CoachVisuals.coffee)
                        Text("Once you run the coach, your latest sessions will appear here for quick review.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 6)
                    .listRowBackground(Color.clear)
                } else {
                    ForEach(viewModel.sessions) { session in
                        Button {
                            viewModel.activeSession = session
                        } label: {
                            sessionSidebarCard(session)
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(Color.clear)
                    }
                }
            }

            Section("Household") {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        ChipView(
                            title: hasConfiguredServer ? "Connected setup" : "Setup needed",
                            tint: hasConfiguredServer ? CoachVisuals.palm : CoachVisuals.terracotta
                        )
                        Spacer()
                        Button("Server") {
                            showingSettings = true
                        }
                        .buttonStyle(.borderless)
                        .foregroundStyle(CoachVisuals.ocean)
                    }

                    Text(hasConfiguredServer ? serverBaseURL : "Add your shared backend URL to finish setup.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 6)
                .listRowBackground(Color.clear)
            }
        }
        .listStyle(.sidebar)
        .scrollContentBackground(.hidden)
        .background(CoachBackdrop())
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showingSettings = true
                } label: {
                    Label("Household Setup", systemImage: "gearshape")
                }
            }
        }
    }

    private func sessionSidebarCard(_ session: PracticeSession) -> some View {
        let isActive = session.id == viewModel.activeSession?.id

        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(session.mode.title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.palm)
                Spacer()
                Text(session.source.title)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Text(viewModel.scenarios.first(where: { $0.id == session.scenarioId })?.title ?? session.scenarioId)
                .font(.headline)
                .foregroundStyle(CoachVisuals.coffee)

            Text(session.userInput)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(
                    isActive
                        ? CoachVisuals.terracotta.opacity(0.12)
                        : Color.white.opacity(0.58)
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(
                    isActive ? CoachVisuals.terracotta.opacity(0.25) : Color.white.opacity(0.4),
                    lineWidth: 1
                )
        )
    }

    private var detail: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                heroCard

                if viewModel.bootstrap == nil {
                    setupCard
                } else {
                    readinessCard
                    selectionGrid
                    composerCard

                    if let session = viewModel.activeSession {
                        feedbackCard(session: session)
                    }
                }
            }
            .padding(24)
            .frame(maxWidth: 1200, alignment: .leading)
        }
        .background(CoachBackdrop())
        .navigationTitle("Practice")
        #if os(macOS)
        .navigationSubtitle(viewModel.currentLearner?.displayName ?? "Shared Coach")
        #endif
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 22) {
            HStack(alignment: .top, spacing: 18) {
                BrandMarkView(size: 88)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Spanish practice that feels native on the devices you actually use.")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    Text("Built for a household preparing for Costa Rica, with one shared coach backend and a calm Apple-style interface across iPhone, iPad, and Mac.")
                        .font(.headline)
                        .foregroundStyle(.white.opacity(0.9))
                }

                Spacer(minLength: 12)
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 170), spacing: 14)], spacing: 14) {
                MetricTileView(
                    title: "Learners",
                    value: "\(viewModel.learners.count)",
                    subtitle: "Profiles available",
                    tint: CoachVisuals.terracotta
                )
                MetricTileView(
                    title: "Scenarios",
                    value: "\(viewModel.scenarios.count)",
                    subtitle: "Everyday situations",
                    tint: CoachVisuals.ocean
                )
                MetricTileView(
                    title: "Sessions",
                    value: "\(viewModel.sessions.count)",
                    subtitle: "Recent shared history",
                    tint: CoachVisuals.palm
                )
                MetricTileView(
                    title: "Speech",
                    value: speechStatusLabel,
                    subtitle: "Microphone pathway",
                    tint: CoachVisuals.sunrise
                )
            }

            HStack(spacing: 12) {
                Button {
                    showingSettings = true
                } label: {
                    Label("Connect Devices", systemImage: "wifi")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CoachSecondaryButtonStyle(tint: .white))

                Button {
                    Task {
                        await viewModel.connect(to: serverBaseURL)
                    }
                } label: {
                    Label("Refresh Practice", systemImage: "arrow.clockwise")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CoachPrimaryButtonStyle(tint: Color.white.opacity(0.2)))
                .disabled(!hasConfiguredServer)
            }

            if !hasConfiguredServer {
                Text("Add the LAN IP or hostname of your shared coach server to finish device setup.")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
            }

            if let status = viewModel.statusMessage {
                Text(status)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
            }

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.92))
            }
        }
        .padding(28)
        .background(
            RoundedRectangle(cornerRadius: 34, style: .continuous)
                .fill(CoachVisuals.heroGradient)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 34, style: .continuous)
                .stroke(Color.white.opacity(0.16), lineWidth: 1)
        )
        .shadow(color: CoachVisuals.coffee.opacity(0.18), radius: 34, y: 18)
    }

    private var setupCard: some View {
        VStack(alignment: .leading, spacing: 20) {
            SectionIntroView(
                eyebrow: "Household Setup",
                title: "Finish the Apple-device install flow once, then practice anywhere at home.",
                bodyText: "This app is designed to stay thin and native while your shared backend handles the AI and session history for both of you.",
                tint: CoachVisuals.terracotta
            )

            VStack(alignment: .leading, spacing: 16) {
                ChecklistStepView(
                    number: 1,
                    title: "Start the backend server",
                    bodyText: "Run the Next.js backend on your LAN machine and keep the Postgres-backed coach reachable from the house.",
                    tint: CoachVisuals.terracotta
                )
                ChecklistStepView(
                    number: 2,
                    title: "Install the app on each device",
                    bodyText: "Run the iOS or macOS target from Xcode on your household devices once signing is configured for your Apple team.",
                    tint: CoachVisuals.ocean
                )
                ChecklistStepView(
                    number: 3,
                    title: "Enter the same server URL",
                    bodyText: "Use the backend machine’s LAN IP or hostname so every phone, iPad, and Mac points at the same shared coach.",
                    tint: CoachVisuals.palm
                )
            }

            HStack(spacing: 12) {
                Button {
                    showingSettings = true
                } label: {
                    Label("Open Setup", systemImage: "gearshape")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.terracotta))

                if hasConfiguredServer {
                    Button {
                        Task {
                            await viewModel.connect(to: serverBaseURL)
                        }
                    } label: {
                        Label("Retry Connection", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))
                }
            }
        }
        .coachCard()
    }

    private var readinessCard: some View {
        HStack(alignment: .top, spacing: 18) {
            VStack(alignment: .leading, spacing: 16) {
                SectionIntroView(
                    eyebrow: "Current Learner",
                    title: viewModel.currentLearner?.displayName ?? "Select a learner",
                    bodyText: viewModel.currentLearner?.confidenceNotes ?? "Choose which household learner is practicing right now.",
                    tint: CoachVisuals.palm
                )

                if let learner = viewModel.currentLearner {
                    HStack {
                        ChipView(title: learner.learnerLevel.title, tint: CoachVisuals.terracotta)
                        ChipView(title: learner.privacyLevel, tint: CoachVisuals.ocean)
                    }

                    FlexibleChipsView(items: learner.goals, tint: CoachVisuals.palm)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(alignment: .leading, spacing: 16) {
                SectionIntroView(
                    eyebrow: "Current Scenario",
                    title: viewModel.currentScenario?.title ?? "Select a scenario",
                    bodyText: viewModel.currentScenario?.setting ?? "Pick a real-life Costa Rica context to focus the practice.",
                    tint: CoachVisuals.ocean
                )

                if let scenario = viewModel.currentScenario {
                    Text(scenario.userGoal)
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.78))

                    FlexibleChipsView(items: scenario.mustKnowVocabulary, tint: CoachVisuals.sunrise)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .coachCard()
    }

    private var selectionGrid: some View {
        VStack(alignment: .leading, spacing: 18) {
            SectionIntroView(
                eyebrow: "Practice Controls",
                title: "Tune the session before you speak or type.",
                bodyText: "Choose the learner, scenario, mode, and difficulty so the feedback matches the exact kind of conversation you want to rehearse.",
                tint: CoachVisuals.sunrise
            )

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 220), spacing: 16)], spacing: 16) {
                selectionCard(
                    title: "Learner",
                    subtitle: viewModel.currentLearner?.confidenceNotes ?? "Choose which learner is practicing.",
                    accessory: AnyView(
                        Picker("Learner", selection: $viewModel.selectedLearnerID) {
                            ForEach(viewModel.learners) { learner in
                                Text(learner.displayName).tag(learner.id)
                            }
                        }
                        .pickerStyle(.menu)
                    )
                )

                selectionCard(
                    title: "Scenario",
                    subtitle: viewModel.currentScenario?.setting ?? "Choose a real-life Costa Rica situation.",
                    accessory: AnyView(
                        Picker("Scenario", selection: $viewModel.selectedScenarioID) {
                            ForEach(viewModel.scenarios) { scenario in
                                Text(scenario.title).tag(scenario.id)
                            }
                        }
                        .pickerStyle(.menu)
                    )
                )

                selectionCard(
                    title: "Mode",
                    subtitle: "Switch the tone of the coaching flow.",
                    accessory: AnyView(
                        Picker("Mode", selection: $viewModel.selectedMode) {
                            ForEach(PracticeMode.allCases) { mode in
                                Text(mode.title).tag(mode)
                            }
                        }
                        .pickerStyle(.segmented)
                    )
                )

                selectionCard(
                    title: "Difficulty",
                    subtitle: viewModel.currentScenario?.userGoal ?? "Tune pacing and realism.",
                    accessory: AnyView(
                        Picker("Difficulty", selection: $viewModel.selectedDifficulty) {
                            ForEach(Difficulty.allCases) { difficulty in
                                Text(difficulty.title).tag(difficulty)
                            }
                        }
                        .pickerStyle(.menu)
                    )
                )
            }
        }
        .coachCard()
    }

    private func selectionCard(title: String, subtitle: String, accessory: AnyView) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(CoachVisuals.terracotta)

            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(CoachVisuals.coffee.opacity(0.75))

            accessory
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white.opacity(0.64))
        )
    }

    private var composerCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                SectionIntroView(
                    eyebrow: "Session Composer",
                    title: "Write, paste, or record your next turn.",
                    bodyText: "Keep the workflow simple: put the Spanish on the page first, then let the coach tighten it.",
                    tint: CoachVisuals.palm
                )

                Spacer()

                ChipView(title: viewModel.inputSource.title, tint: CoachVisuals.palm)
            }

            if let scenario = viewModel.currentScenario {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Starter prompts")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.palm)
                    Text(scenario.starterPrompts.joined(separator: " • "))
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.8))
                }
            }

            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.white.opacity(0.72))

                if viewModel.input.isEmpty {
                    Text("Try a real reply, for example: Buenas tardes, estamos buscando una casa tranquila cerca del pueblo.")
                        .font(.body)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.35))
                        .padding(.horizontal, 18)
                        .padding(.top, 20)
                }

                TextEditor(text: $viewModel.input)
                    .font(.body)
                    .foregroundStyle(CoachVisuals.coffee)
                    .frame(minHeight: 190)
                    .padding(12)
                    .scrollContentBackground(.hidden)
                    .background(Color.clear)
                    .onChange(of: viewModel.input) { _, _ in
                        viewModel.beginTyping()
                    }
            }
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(Color.white.opacity(0.45), lineWidth: 1)
            )

            HStack(spacing: 12) {
                Button {
                    viewModel.registerPaste()
                } label: {
                    Label("Paste Transcript", systemImage: "doc.on.clipboard")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))

                Button {
                    Task {
                        if viewModel.isRecording {
                            await viewModel.stopRecording(baseURL: serverBaseURL)
                        } else {
                            await viewModel.startRecording()
                        }
                    }
                } label: {
                    Label(
                        viewModel.isRecording ? "Stop Recording" : "Use Microphone",
                        systemImage: viewModel.isRecording ? "stop.circle.fill" : "mic.fill"
                    )
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(
                    CoachPrimaryButtonStyle(
                        tint: viewModel.isRecording ? CoachVisuals.coffee : CoachVisuals.palm
                    )
                )

                Button {
                    Task {
                        await viewModel.submit(baseURL: serverBaseURL)
                    }
                } label: {
                    Label(viewModel.isSubmitting ? "Starting..." : "Start Practice", systemImage: "arrow.right.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.terracotta))
                .disabled(viewModel.isSubmitting || viewModel.input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .coachCard()
    }

    private func feedbackCard(session: PracticeSession) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                SectionIntroView(
                    eyebrow: "Current Feedback",
                    title: viewModel.scenarios.first(where: { $0.id == session.scenarioId })?.title ?? "Practice Review",
                    bodyText: session.createdAtDate?.formatted(date: .abbreviated, time: .shortened) ?? session.createdAt,
                    tint: CoachVisuals.ocean
                )
                Spacer()
                ChipView(title: session.feedback.provider, tint: CoachVisuals.ocean)
            }

            feedbackRow(title: "Original", body: session.userInput, tint: CoachVisuals.coffee)
            feedbackRow(title: "Corrected Spanish", body: session.feedback.correctedSpanish, tint: CoachVisuals.terracotta, speakable: true)
            feedbackRow(title: "More Natural", body: session.feedback.naturalSpanish, tint: CoachVisuals.ocean, speakable: true)
            feedbackRow(title: "Explanation", body: session.feedback.explanation, tint: CoachVisuals.palm)
            feedbackRow(title: "Follow-up Reply", body: session.feedback.followUpReply, tint: CoachVisuals.sunrise, speakable: true)

            VStack(alignment: .leading, spacing: 10) {
                Text("Vocabulary")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.palm)
                FlexibleChipsView(items: session.feedback.vocabularyNotes, tint: CoachVisuals.palm)
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Pronunciation Notes")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.ocean)
                ForEach(session.feedback.pronunciationNotes, id: \.self) { note in
                    Text(note)
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.8))
                }
            }

            HStack {
                FlexibleChipsView(items: session.feedback.errorTags, tint: CoachVisuals.terracotta)
                Spacer()
                Text("Confidence \(Int(session.feedback.confidenceScore * 100))%")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(CoachVisuals.coffee)
            }
        }
        .coachCard()
    }

    private func feedbackRow(title: String, body: String, tint: Color, speakable: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title.uppercased())
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(tint)

                Spacer()

                if speakable {
                    Button {
                        viewModel.speak(body)
                    } label: {
                        Label("Speak", systemImage: "speaker.wave.2.fill")
                            .font(.caption.weight(.semibold))
                    }
                    .buttonStyle(.borderless)
                    .foregroundStyle(tint)
                }
            }

            Text(body)
                .font(.body)
                .foregroundStyle(CoachVisuals.coffee.opacity(0.84))
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white.opacity(0.66))
        )
    }
}

private struct FlexibleChipsView: View {
    let items: [String]
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(chunked(items, size: 3), id: \.self) { row in
                HStack {
                    ForEach(row, id: \.self) { item in
                        ChipView(title: item, tint: tint)
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private func chunked(_ values: [String], size: Int) -> [[String]] {
        stride(from: 0, to: values.count, by: size).map {
            Array(values[$0 ..< min($0 + size, values.count)])
        }
    }
}
