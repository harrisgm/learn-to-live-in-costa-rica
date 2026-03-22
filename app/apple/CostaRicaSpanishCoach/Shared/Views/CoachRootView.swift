import SwiftUI

struct CoachRootView: View {
    @StateObject private var viewModel = CoachViewModel()
    @AppStorage("serverBaseURL") private var serverBaseURL = ""
    @State private var showingSettings = false

    var body: some View {
        NavigationSplitView {
            sidebar
        } detail: {
            detail
        }
        .background(CoachVisuals.pageGradient.ignoresSafeArea())
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
    }

    private var hasConfiguredServer: Bool {
        !serverBaseURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var sidebar: some View {
        List(selection: .constant(viewModel.activeSession?.id)) {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Costa Rica Coach")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(CoachVisuals.coffee)
                    Text("Native Apple client for the shared household coach")
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.75))

                    HStack {
                        ChipView(title: "iPhone + Mac", tint: CoachVisuals.terracotta)
                        ChipView(title: "LAN Server", tint: CoachVisuals.ocean)
                    }
                }
                .listRowBackground(Color.clear)
            }

            Section("Recent Sessions") {
                if viewModel.sessions.isEmpty {
                    Text(viewModel.isLoadingSessions ? "Loading..." : "No sessions yet")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(viewModel.sessions) { session in
                        Button {
                            viewModel.activeSession = session
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
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
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(CoachVisuals.pageGradient)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showingSettings = true
                } label: {
                    Label("Server", systemImage: "gearshape")
                }
            }
        }
    }

    private var detail: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                heroCard
                selectionGrid
                composerCard

                if let session = viewModel.activeSession {
                    feedbackCard(session: session)
                }
            }
            .padding(24)
            .frame(maxWidth: 1100, alignment: .leading)
        }
        .background(CoachVisuals.pageGradient.ignoresSafeArea())
        .navigationTitle("Practice")
        #if os(macOS)
        .navigationSubtitle(viewModel.currentLearner?.displayName ?? "Shared Coach")
        #endif
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("A real Apple client for your shared Costa Rica practice system.")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    Text("Text, scenario practice, and optional microphone capture now fit into a native SwiftUI app that talks to the same backend.")
                        .font(.headline)
                        .foregroundStyle(.white.opacity(0.9))
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 10) {
                    ChipView(
                        title: hasConfiguredServer ? "Server: \(serverBaseURL)" : "Server not set",
                        tint: .white
                    )
                    if let warning = viewModel.bootstrap?.speech.warning {
                        Text(warning)
                            .font(.footnote)
                            .foregroundStyle(.white.opacity(0.82))
                            .multilineTextAlignment(.trailing)
                    }
                }
            }

            if !hasConfiguredServer {
                Text("Set the shared coach server before practicing. Use the LAN IP or local hostname of the machine running the backend.")
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
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(CoachVisuals.heroGradient)
        )
        .shadow(color: CoachVisuals.coffee.opacity(0.18), radius: 30, y: 14)
    }

    private var selectionGrid: some View {
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
        .coachCard()
    }

    private var composerCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Practice Composer")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(CoachVisuals.coffee)
                    Text("Write Spanish, paste a transcript, or record a short reply.")
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.7))
                }
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

            TextEditor(text: $viewModel.input)
                .font(.body)
                .foregroundStyle(CoachVisuals.coffee)
                .frame(minHeight: 180)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(Color.white.opacity(0.72))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Color.white.opacity(0.35), lineWidth: 1)
                )
                .onChange(of: viewModel.input) { _, _ in
                    viewModel.beginTyping()
                }

            HStack(spacing: 12) {
                Button {
                    viewModel.registerPaste()
                } label: {
                    Label("Mark as Pasted", systemImage: "doc.on.clipboard")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

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
                .buttonStyle(.borderedProminent)
                .tint(viewModel.isRecording ? CoachVisuals.coffee : CoachVisuals.palm)

                Button {
                    Task {
                        await viewModel.submit(baseURL: serverBaseURL)
                    }
                } label: {
                    Label(viewModel.isSubmitting ? "Running..." : "Run Coach", systemImage: "arrow.right.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(CoachVisuals.terracotta)
                .disabled(viewModel.isSubmitting || viewModel.input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .coachCard()
    }

    private func feedbackCard(session: PracticeSession) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Current Feedback")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(CoachVisuals.coffee)
                    Text(session.createdAtDate?.formatted(date: .abbreviated, time: .shortened) ?? session.createdAt)
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.65))
                }
                Spacer()
                ChipView(title: session.feedback.provider, tint: CoachVisuals.ocean)
            }

            feedbackRow(title: "Original", body: session.userInput, tint: CoachVisuals.coffee)
            feedbackRow(title: "Corrected Spanish", body: session.feedback.correctedSpanish, tint: CoachVisuals.terracotta, speakable: true)
            feedbackRow(title: "More Natural", body: session.feedback.naturalSpanish, tint: CoachVisuals.ocean, speakable: true)
            feedbackRow(title: "Explanation", body: session.feedback.explanation, tint: CoachVisuals.palm)
            feedbackRow(title: "Follow-up Reply", body: session.feedback.followUpReply, tint: CoachVisuals.terracotta, speakable: true)

            VStack(alignment: .leading, spacing: 10) {
                Text("Vocabulary")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.palm)
                flowLayout(items: session.feedback.vocabularyNotes, tint: CoachVisuals.palm)
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
                flowLayout(items: session.feedback.errorTags, tint: CoachVisuals.terracotta)
                Spacer()
                Text("Confidence \(Int(session.feedback.confidenceScore * 100))%")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(CoachVisuals.coffee)
            }
        }
        .coachCard()
    }

    private func feedbackRow(title: String, body: String, tint: Color, speakable: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
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
                .foregroundStyle(CoachVisuals.coffee.opacity(0.82))
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white.opacity(0.66))
        )
    }

    private func flowLayout(items: [String], tint: Color) -> some View {
        FlexibleChipsView(items: items, tint: tint)
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
