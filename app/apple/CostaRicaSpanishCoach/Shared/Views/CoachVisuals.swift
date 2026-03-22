import SwiftUI

enum CoachVisuals {
    static let shell = Color(red: 0.99, green: 0.96, blue: 0.92)
    static let sand = Color(red: 0.96, green: 0.91, blue: 0.82)
    static let terracotta = Color(red: 0.81, green: 0.40, blue: 0.24)
    static let sunrise = Color(red: 0.94, green: 0.62, blue: 0.31)
    static let coffee = Color(red: 0.29, green: 0.19, blue: 0.16)
    static let palm = Color(red: 0.17, green: 0.42, blue: 0.34)
    static let moss = Color(red: 0.26, green: 0.52, blue: 0.42)
    static let ocean = Color(red: 0.06, green: 0.41, blue: 0.48)
    static let mist = Color(red: 0.87, green: 0.92, blue: 0.93)

    static let pageGradient = LinearGradient(
        colors: [
            Color(red: 0.99, green: 0.96, blue: 0.92),
            Color(red: 0.96, green: 0.93, blue: 0.89),
            Color(red: 0.92, green: 0.91, blue: 0.90)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let heroGradient = LinearGradient(
        colors: [terracotta, sunrise, ocean],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let cardFill = LinearGradient(
        colors: [
            Color.white.opacity(0.78),
            Color.white.opacity(0.58)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

struct CoachBackdrop: View {
    var body: some View {
        ZStack {
            CoachVisuals.pageGradient

            Circle()
                .fill(CoachVisuals.sunrise.opacity(0.18))
                .frame(width: 320, height: 320)
                .blur(radius: 12)
                .offset(x: 220, y: -280)

            Circle()
                .fill(CoachVisuals.ocean.opacity(0.14))
                .frame(width: 280, height: 280)
                .blur(radius: 10)
                .offset(x: -240, y: 180)

            Circle()
                .fill(CoachVisuals.palm.opacity(0.1))
                .frame(width: 240, height: 240)
                .blur(radius: 14)
                .offset(x: 240, y: 220)
        }
        .ignoresSafeArea()
    }
}

struct CoachCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(22)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(CoachVisuals.cardFill)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(Color.white.opacity(0.55), lineWidth: 1)
            )
            .shadow(color: CoachVisuals.coffee.opacity(0.12), radius: 30, y: 14)
    }
}

extension View {
    func coachCard() -> some View {
        modifier(CoachCardModifier())
    }
}

struct BrandMarkView: View {
    var size: CGFloat = 72

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                .fill(CoachVisuals.heroGradient)

            RoundedRectangle(cornerRadius: size * 0.24, style: .continuous)
                .stroke(Color.white.opacity(0.25), lineWidth: 1)

            Circle()
                .fill(Color.white.opacity(0.22))
                .frame(width: size * 0.28, height: size * 0.28)
                .offset(x: -size * 0.18, y: -size * 0.14)

            VStack(spacing: 0) {
                Text("CR")
                    .font(.system(size: size * 0.36, weight: .black, design: .rounded))
                    .foregroundStyle(Color.white)

                Text("Coach")
                    .font(.system(size: size * 0.13, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.92))
                    .tracking(size * 0.01)
            }
        }
        .frame(width: size, height: size)
        .shadow(color: CoachVisuals.coffee.opacity(0.16), radius: 18, y: 10)
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

struct MetricTileView: View {
    let title: String
    let value: String
    let subtitle: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(tint.opacity(0.92))

            Text(value)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundStyle(CoachVisuals.coffee)

            Text(subtitle)
                .font(.footnote)
                .foregroundStyle(CoachVisuals.coffee.opacity(0.68))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white.opacity(0.68))
        )
    }
}

struct SectionIntroView: View {
    let eyebrow: String
    let title: String
    let bodyText: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow.uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(tint)
            Text(title)
                .font(.title3.weight(.bold))
                .foregroundStyle(CoachVisuals.coffee)
            Text(bodyText)
                .font(.subheadline)
                .foregroundStyle(CoachVisuals.coffee.opacity(0.72))
        }
    }
}

struct ChecklistStepView: View {
    let number: Int
    let title: String
    let bodyText: String
    let tint: Color

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle()
                    .fill(tint.opacity(0.16))
                Text("\(number)")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(tint)
            }
            .frame(width: 34, height: 34)

            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(CoachVisuals.coffee)
                Text(bodyText)
                    .font(.subheadline)
                    .foregroundStyle(CoachVisuals.coffee.opacity(0.72))
            }
        }
    }
}

struct CoachPrimaryButtonStyle: ButtonStyle {
    let tint: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(tint.opacity(configuration.isPressed ? 0.84 : 1))
            )
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.16), value: configuration.isPressed)
    }
}

struct CoachSecondaryButtonStyle: ButtonStyle {
    let tint: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .foregroundStyle(tint)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(tint.opacity(configuration.isPressed ? 0.18 : 0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(tint.opacity(0.12), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.16), value: configuration.isPressed)
    }
}

struct CoachLaunchOverlayView: View {
    var body: some View {
        ZStack {
            CoachBackdrop()

            VStack(spacing: 18) {
                BrandMarkView(size: 118)

                VStack(spacing: 8) {
                    Text("Costa Rica Coach")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(CoachVisuals.coffee)

                    Text("Shared Spanish practice for your move to Costa Rica.")
                        .font(.headline)
                        .foregroundStyle(CoachVisuals.coffee.opacity(0.75))
                }

                HStack {
                    ChipView(title: "Text + Voice Practice", tint: CoachVisuals.terracotta)
                    ChipView(title: "One Shared Household Server", tint: CoachVisuals.ocean)
                }
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 34, style: .continuous)
                    .fill(Color.white.opacity(0.78))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 34, style: .continuous)
                    .stroke(Color.white.opacity(0.55), lineWidth: 1)
            )
            .shadow(color: CoachVisuals.coffee.opacity(0.16), radius: 36, y: 18)
            .padding(32)
        }
    }
}
