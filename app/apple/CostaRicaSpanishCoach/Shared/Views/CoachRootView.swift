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

            Text(session.scenarioSnapshot.title)
                .font(.headline)
                .foregroundStyle(CoachVisuals.coffee)

            if let variant = session.scenarioSnapshot.variantLabel {
                Text(variant)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let turn = session.scenarioSnapshot.turnLabel {
                Text(turn)
                    .font(.caption)
                    .foregroundStyle(CoachVisuals.palm)
            }

            Text(session.feedback.transcriptText)
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
                    if viewModel.currentListeningPack != nil {
                        listeningLabCard
                    }

                    if let session = viewModel.activeSession {
                        feedbackCard(session: session)
                    }

                    if let summary = viewModel.reviewSummary {
                        reviewCard(summary: summary)
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

                    if let variant = viewModel.currentScenarioVariant {
                        HStack(alignment: .top, spacing: 10) {
                            ChipView(title: variant.title, tint: CoachVisuals.palm)
                            Text(variant.setup)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }

                    if let turn = viewModel.currentScenarioTurn {
                        HStack(alignment: .top, spacing: 10) {
                            ChipView(title: turn.title, tint: CoachVisuals.ocean)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(turn.learnerGoal)
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(CoachVisuals.coffee)
                                Text(turn.repairCue)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    if let pack = viewModel.currentListeningPack {
                        HStack(alignment: .top, spacing: 10) {
                            ChipView(title: pack.title, tint: CoachVisuals.terracotta)
                            Text(pack.previewLine)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
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
                    title: "Variant",
                    subtitle: viewModel.currentScenarioVariant?.setup ?? "Choose the scenario version and pressure level.",
                    accessory: AnyView(
                        Group {
                            if let scenario = viewModel.currentScenario, !scenario.variants.isEmpty {
                                Picker("Variant", selection: $viewModel.selectedScenarioVariantID) {
                                    ForEach(scenario.variants) { variant in
                                        Text(variant.title).tag(variant.id)
                                    }
                                }
                                .pickerStyle(.menu)
                            } else {
                                Text("Variants load with the selected scenario.")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    )
                )

                selectionCard(
                    title: "Turn",
                    subtitle: viewModel.currentScenarioTurn?.learnerGoal ?? "Choose the next roleplay beat.",
                    accessory: AnyView(
                        Group {
                            if let scenario = viewModel.currentScenario, !scenario.turns.isEmpty {
                                Picker("Turn", selection: $viewModel.selectedScenarioTurnID) {
                                    ForEach(scenario.turns) { turn in
                                        Text(turn.title).tag(turn.id)
                                    }
                                }
                                .pickerStyle(.menu)
                            } else {
                                Text("Turns load with the selected scenario.")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
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

                selectionCard(
                    title: "Listening Pack",
                    subtitle: viewModel.currentListeningPack?.focus ?? "Pick a practice ear-training pack.",
                    accessory: AnyView(
                        Group {
                            if viewModel.currentScenarioListeningPacks.isEmpty == false {
                                Picker("Listening Pack", selection: $viewModel.selectedListeningPackID) {
                                    ForEach(viewModel.currentScenarioListeningPacks) { pack in
                                        Text(pack.title).tag(pack.id)
                                    }
                                }
                                .pickerStyle(.menu)
                            } else if viewModel.listeningPacks.isEmpty == false {
                                Picker("Listening Pack", selection: $viewModel.selectedListeningPackID) {
                                    ForEach(viewModel.listeningPacks) { pack in
                                        Text(pack.title).tag(pack.id)
                                    }
                                }
                                .pickerStyle(.menu)
                            } else {
                                Text("No listening packs loaded yet.")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    )
                )
            }
        }
        .coachCard()
        .onChange(of: viewModel.selectedScenarioID) { _, _ in
            viewModel.syncScenarioContext()
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
                        viewModel.handleComposerChange()
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

    private var listeningLabCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            if let pack = viewModel.currentListeningPack {
                SectionIntroView(
                    eyebrow: "Listening Lab",
                    title: pack.title,
                    bodyText: "\(pack.focus) - \(pack.challenge)",
                    tint: CoachVisuals.terracotta
                )

                HStack(alignment: .top, spacing: 14) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Preview line")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CoachVisuals.ocean)
                        Text(pack.previewLine)
                            .font(.body)
                            .foregroundStyle(CoachVisuals.coffee.opacity(0.84))

                        HStack(spacing: 12) {
                            Button {
                                viewModel.speak(pack.previewLine)
                            } label: {
                                Label("Hear Preview", systemImage: "speaker.wave.2.fill")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))

                            Button {
                                viewModel.useListeningPreview(pack)
                            } label: {
                                Label("Load Dictation", systemImage: "text.badge.plus")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.palm))
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Cues")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CoachVisuals.terracotta)

                        ForEach(pack.cueNotes.prefix(3), id: \.self) { note in
                            Text("- \(note)")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        if let firstCheck = pack.comprehensionChecks.first {
                            Text("Check: \(firstCheck)")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(CoachVisuals.coffee)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Transcript snippets")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.palm)

                    ForEach(pack.transcript.prefix(3), id: \.self) { line in
                        HStack(alignment: .top, spacing: 10) {
                            ChipView(title: line.speed.capitalized, tint: CoachVisuals.sunrise)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(line.speaker)
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(CoachVisuals.coffee)
                                Text(line.text)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                                if let note = line.note {
                                    Text(note)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
            }
        }
        .coachCard()
    }

    private func feedbackCard(session: PracticeSession) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                SectionIntroView(
                    eyebrow: "Current Feedback",
                    title: session.scenarioSnapshot.title,
                    bodyText: session.createdAtDate?.formatted(date: .abbreviated, time: .shortened) ?? session.createdAt,
                    tint: CoachVisuals.ocean
                )
                Spacer()
                VStack(alignment: .trailing, spacing: 10) {
                    ChipView(title: session.feedback.provider, tint: CoachVisuals.ocean)
                    ChipView(title: session.feedback.feedbackMode.rawValue.capitalized, tint: CoachVisuals.palm)
                }
            }

            HStack {
                ChipView(title: session.feedback.inputMode.title, tint: CoachVisuals.sunrise)
                ChipView(title: session.feedback.learnerFocus.rawValue.capitalized, tint: CoachVisuals.terracotta)
                Spacer()
                Text("Confidence \(Int(session.feedback.confidenceScore * 100))%")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(CoachVisuals.coffee)
            }

            feedbackRow(
                title: session.source == .speech ? "Transcript" : "Original",
                body: session.feedback.transcriptText,
                tint: CoachVisuals.coffee
            )
            feedbackRow(title: "Corrected Spanish", body: session.feedback.correctedText, tint: CoachVisuals.terracotta, speakable: true)
            feedbackRow(title: "More Natural", body: session.feedback.naturalText, tint: CoachVisuals.ocean, speakable: true)
            feedbackRow(title: "Explanation", body: session.feedback.explanationSummary, tint: CoachVisuals.palm)

            VStack(alignment: .leading, spacing: 14) {
                Text("RETRY PROMPT")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.terracotta)

                Text(session.feedback.retryPrompt)
                    .font(.body)
                    .foregroundStyle(CoachVisuals.coffee.opacity(0.84))

                HStack(spacing: 12) {
                    Button {
                        viewModel.useCorrectedText(from: session)
                    } label: {
                        Label("Use Corrected", systemImage: "text.badge.checkmark")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.palm))

                    Button {
                        viewModel.useNaturalText(from: session)
                    } label: {
                        Label("Use Natural", systemImage: "text.badge.star")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))
                }
            }
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.white.opacity(0.66))
            )

            VStack(alignment: .leading, spacing: 14) {
                Text("FOLLOW-UP PROMPT")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.sunrise)

                Text(session.feedback.followUpPrompt)
                    .font(.body)
                    .foregroundStyle(CoachVisuals.coffee.opacity(0.84))

                HStack(spacing: 12) {
                    Button {
                        viewModel.speak(session.feedback.followUpPrompt)
                    } label: {
                        Label("Speak Prompt", systemImage: "speaker.wave.2.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))
                }
            }
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.white.opacity(0.66))
            )

            if let coupleHandoff = session.feedback.coupleHandoff {
                VStack(alignment: .leading, spacing: 14) {
                    Text("COUPLE HANDOFF")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.palm)

                    HStack(alignment: .top, spacing: 12) {
                        ChipView(title: coupleHandoff.leadRole, tint: CoachVisuals.terracotta)
                        ChipView(title: coupleHandoff.supportRole, tint: CoachVisuals.ocean)
                    }

                    Text(coupleHandoff.handoffPrompt)
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.84))
                    Text(coupleHandoff.coachingTip)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(18)
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(Color.white.opacity(0.66))
                )
            }

            if let recommendation = session.feedback.listeningRecommendation {
                VStack(alignment: .leading, spacing: 14) {
                    Text("LISTENING RECOMMENDATION")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.terracotta)

                    Text(recommendation.packTitle)
                        .font(.headline)
                        .foregroundStyle(CoachVisuals.coffee)
                    Text(recommendation.reason)
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.82))
                    Text(recommendation.previewLine)
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    if let pack = viewModel.listeningPacks.first(where: { $0.id == recommendation.packId }) {
                        Button {
                            viewModel.useListeningPreview(pack)
                        } label: {
                            Label("Load Listening Preview", systemImage: "text.viewfinder")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.palm))
                    }
                }
                .padding(18)
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(Color.white.opacity(0.66))
                )
            }

            if !session.feedback.recommendedDrills.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("RECOMMENDED DRILLS")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.terracotta)

                    ForEach(Array(session.feedback.recommendedDrills.prefix(2)), id: \.self) { drill in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                ChipView(title: drill.kind.title, tint: CoachVisuals.ocean)
                                Spacer()
                            }

                            Text(drill.title)
                                .font(.headline)
                                .foregroundStyle(CoachVisuals.coffee)
                            Text(drill.reason)
                                .font(.subheadline)
                                .foregroundStyle(CoachVisuals.coffee.opacity(0.82))
                            Text("Model: \(drill.prompt)")
                                .font(.footnote)
                                .foregroundStyle(.secondary)

                            if !drill.steps.isEmpty {
                                VStack(alignment: .leading, spacing: 6) {
                                    ForEach(drill.steps, id: \.self) { step in
                                        Text("\(step.label): \(step.prompt)")
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }

                            Button {
                                viewModel.useRecommendedDrill(drill)
                            } label: {
                                Label("Load Drill", systemImage: "list.bullet.clipboard")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))
                        }
                        .padding(16)
                        .background(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(Color.white.opacity(0.58))
                        )
                    }
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Vocabulary")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.palm)
                ForEach(session.feedback.vocabNotes, id: \.term) { note in
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(note.term) (\(note.gloss))")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(CoachVisuals.coffee)
                        Text(note.note)
                            .font(.subheadline)
                            .foregroundStyle(CoachVisuals.coffee.opacity(0.8))
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .fill(Color.white.opacity(0.58))
                    )
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Pronunciation Notes")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.ocean)
                ForEach(session.feedback.pronunciationHints, id: \.self) { hint in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(hint.term)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(CoachVisuals.coffee)
                        Text(hint.hint)
                            .font(.subheadline)
                            .foregroundStyle(CoachVisuals.coffee.opacity(0.8))
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .fill(Color.white.opacity(0.58))
                    )
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Error Focus")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.terracotta)
                ForEach(session.feedback.errorTags, id: \.self) { tag in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            ChipView(
                                title: formatTagCode(tag.code),
                                tint: tag.severity == .primary ? CoachVisuals.terracotta : CoachVisuals.ocean
                            )
                            ChipView(title: tag.severity.rawValue.capitalized, tint: CoachVisuals.sunrise)
                            Spacer()
                        }

                        Text(tag.message)
                            .font(.subheadline)
                            .foregroundStyle(CoachVisuals.coffee.opacity(0.8))
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .fill(Color.white.opacity(0.58))
                    )
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Review Recommendation")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CoachVisuals.palm)
                Text(session.feedback.reviewRecommendation.reason)
                    .font(.subheadline)
                    .foregroundStyle(CoachVisuals.coffee.opacity(0.84))
                Text("Next step: \(session.feedback.reviewRecommendation.nextStep)")
                    .font(.subheadline)
                    .foregroundStyle(CoachVisuals.coffee.opacity(0.72))
            }
        }
        .coachCard()
    }

    private func reviewCard(summary: LearnerReviewSummary) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            SectionIntroView(
                eyebrow: "Review Summary",
                title: "Persisted mistake memory for this learner",
                bodyText: "These recurring tags and drill suggestions come from saved backend sessions, so they travel across devices.",
                tint: CoachVisuals.terracotta
            )

            HStack(spacing: 14) {
                MetricTileView(
                    title: "Sessions",
                    value: "\(summary.totalSessions)",
                    subtitle: "Stored turns",
                    tint: CoachVisuals.terracotta
                )
                MetricTileView(
                    title: "Confidence",
                    value: "\(Int(summary.averageConfidence * 100))%",
                    subtitle: "Average",
                    tint: CoachVisuals.ocean
                )
            }

            if !summary.recurringTags.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recurring Tags")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.palm)

                    ForEach(summary.recurringTags.prefix(3), id: \.self) { tag in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                ChipView(title: formatTagCode(tag.code), tint: CoachVisuals.terracotta)
                                ChipView(title: "\(tag.count)x", tint: CoachVisuals.ocean)
                                Spacer()
                            }

                            Text(tag.lastMessage)
                                .font(.subheadline)
                                .foregroundStyle(CoachVisuals.coffee.opacity(0.82))

                            Text("Last seen in \(tag.lastScenarioTitle)")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        .padding(16)
                        .background(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(Color.white.opacity(0.58))
                        )
                    }
                }
            }

            if !summary.recentMistakes.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Mistakes")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.ocean)

                    ForEach(summary.recentMistakes.prefix(3), id: \.self) { mistake in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                ChipView(title: formatTagCode(mistake.primaryTag.code), tint: CoachVisuals.terracotta)
                                ChipView(title: mistake.inputMode.title, tint: CoachVisuals.sunrise)
                                Spacer()
                            }

                            Text(mistake.transcriptText)
                                .font(.subheadline)
                                .foregroundStyle(CoachVisuals.coffee.opacity(0.82))

                            Text("Retry: \(mistake.retryPrompt)")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            Text("Correction: \(mistake.correctedText)")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        .padding(16)
                        .background(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(Color.white.opacity(0.58))
                        )
                    }
                }
            }

            if !summary.recommendedDrills.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recommended Drills")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.sunrise)

                    ForEach(Array(summary.recommendedDrills.prefix(3)), id: \.self) { drill in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                ChipView(title: drill.kind.title, tint: CoachVisuals.ocean)
                                Spacer()
                            }

                            Text(drill.title)
                                .font(.headline)
                                .foregroundStyle(CoachVisuals.coffee)
                            Text(drill.reason)
                                .font(.subheadline)
                                .foregroundStyle(CoachVisuals.coffee.opacity(0.82))
                            Text("Model sentence: \(drill.prompt)")
                                .font(.footnote)
                                .foregroundStyle(.secondary)

                            if !drill.steps.isEmpty {
                                VStack(alignment: .leading, spacing: 4) {
                                    ForEach(drill.steps, id: \.self) { step in
                                        Text("\(step.label): \(step.prompt)")
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }

                            Button {
                                viewModel.useRecommendedDrill(drill)
                            } label: {
                                Label("Load Drill", systemImage: "list.bullet.clipboard")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.palm))
                        }
                        .padding(16)
                        .background(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(Color.white.opacity(0.58))
                        )
                    }
                }
            } else if let drill = summary.nextRecommendedDrill {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Next Drill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.sunrise)

                    Text(drill.title)
                        .font(.headline)
                        .foregroundStyle(CoachVisuals.coffee)
                    Text(drill.reason)
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.82))
                    Text("Suggested model sentence: \(drill.prompt)")
                        .font(.subheadline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.74))

                    Button {
                        viewModel.useRecommendedDrill(drill)
                    } label: {
                        Label("Load Model", systemImage: "list.bullet.clipboard")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CoachPrimaryButtonStyle(tint: CoachVisuals.palm))
                }
                .padding(18)
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(Color.white.opacity(0.66))
                )
            }

            if !summary.listeningRecommendations.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Listening Recommendations")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CoachVisuals.terracotta)

                    ForEach(Array(summary.listeningRecommendations.prefix(2)), id: \.self) { recommendation in
                        VStack(alignment: .leading, spacing: 10) {
                            Text(recommendation.packTitle)
                                .font(.headline)
                                .foregroundStyle(CoachVisuals.coffee)
                            Text(recommendation.reason)
                                .font(.subheadline)
                                .foregroundStyle(CoachVisuals.coffee.opacity(0.82))
                            Text(recommendation.previewLine)
                                .font(.footnote)
                                .foregroundStyle(.secondary)

                            if let pack = viewModel.listeningPacks.first(where: { $0.id == recommendation.packId }) {
                                Button {
                                    viewModel.useListeningPreview(pack)
                                } label: {
                                    Label("Load Listening Preview", systemImage: "text.viewfinder")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(CoachSecondaryButtonStyle(tint: CoachVisuals.ocean))
                            }
                        }
                        .padding(16)
                        .background(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(Color.white.opacity(0.58))
                        )
                    }
                }
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

    private func formatTagCode(_ code: String) -> String {
        code
            .lowercased()
            .split(separator: "_")
            .map { $0.capitalized }
            .joined(separator: " ")
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
