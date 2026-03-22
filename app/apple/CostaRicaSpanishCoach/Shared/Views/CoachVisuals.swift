import SwiftUI

enum CoachVisuals {
    static let sand = Color(red: 0.96, green: 0.92, blue: 0.84)
    static let terracotta = Color(red: 0.79, green: 0.42, blue: 0.24)
    static let coffee = Color(red: 0.32, green: 0.21, blue: 0.17)
    static let palm = Color(red: 0.18, green: 0.40, blue: 0.35)
    static let ocean = Color(red: 0.06, green: 0.42, blue: 0.47)

    static let pageGradient = LinearGradient(
        colors: [
            Color(red: 0.99, green: 0.95, blue: 0.89),
            Color(red: 0.96, green: 0.93, blue: 0.90),
            Color(red: 0.93, green: 0.91, blue: 0.90)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let heroGradient = LinearGradient(
        colors: [terracotta, ocean],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

struct CoachCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
            )
            .shadow(color: CoachVisuals.coffee.opacity(0.12), radius: 30, y: 14)
    }
}

extension View {
    func coachCard() -> some View {
        modifier(CoachCardModifier())
    }
}

struct ChipView: View {
    let title: String
    let tint: Color

    var body: some View {
        Text(title)
            .font(.caption.weight(.semibold))
            .foregroundStyle(tint)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                Capsule(style: .continuous)
                    .fill(tint.opacity(0.12))
            )
    }
}
