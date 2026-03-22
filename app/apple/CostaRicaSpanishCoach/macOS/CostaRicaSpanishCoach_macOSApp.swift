import SwiftUI

@main
struct CostaRicaSpanishCoach_macOSApp: App {
    var body: some Scene {
        WindowGroup {
            CoachRootView()
                .frame(minWidth: 1180, minHeight: 760)
        }
    }
}
