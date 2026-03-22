import SwiftUI

@main
struct CostaRicaSpanishCoach_macOSApp: App {
    @AppStorage("serverBaseURL") private var serverBaseURL = ""

    var body: some Scene {
        WindowGroup {
            CoachRootView()
                .frame(minWidth: 1180, minHeight: 760)
                .tint(CoachVisuals.terracotta)
        }
        .windowResizability(.contentMinSize)

        Settings {
            ServerSettingsView(serverBaseURL: $serverBaseURL)
                .frame(width: 760, height: 720)
        }
    }
}
