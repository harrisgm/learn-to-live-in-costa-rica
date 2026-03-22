#!/usr/bin/env swift

import AppKit
import Foundation

enum BrandAssetError: Error {
    case couldNotCreateBitmap
}

struct IconOutput {
    let filename: String
    let points: CGFloat
    let scale: CGFloat

    var pixelSize: CGFloat {
        points * scale
    }
}

let iconOutputs: [IconOutput] = [
    .init(filename: "iphone-notification-20@2x.png", points: 20, scale: 2),
    .init(filename: "iphone-notification-20@3x.png", points: 20, scale: 3),
    .init(filename: "iphone-settings-29@2x.png", points: 29, scale: 2),
    .init(filename: "iphone-settings-29@3x.png", points: 29, scale: 3),
    .init(filename: "iphone-spotlight-40@2x.png", points: 40, scale: 2),
    .init(filename: "iphone-spotlight-40@3x.png", points: 40, scale: 3),
    .init(filename: "iphone-app-60@2x.png", points: 60, scale: 2),
    .init(filename: "iphone-app-60@3x.png", points: 60, scale: 3),
    .init(filename: "ipad-notification-20.png", points: 20, scale: 1),
    .init(filename: "ipad-notification-20@2x.png", points: 20, scale: 2),
    .init(filename: "ipad-settings-29.png", points: 29, scale: 1),
    .init(filename: "ipad-settings-29@2x.png", points: 29, scale: 2),
    .init(filename: "ipad-spotlight-40.png", points: 40, scale: 1),
    .init(filename: "ipad-spotlight-40@2x.png", points: 40, scale: 2),
    .init(filename: "ipad-app-76.png", points: 76, scale: 1),
    .init(filename: "ipad-app-76@2x.png", points: 76, scale: 2),
    .init(filename: "ipad-pro-83.5@2x.png", points: 83.5, scale: 2),
    .init(filename: "ios-marketing-1024.png", points: 1024, scale: 1),
    .init(filename: "mac-16.png", points: 16, scale: 1),
    .init(filename: "mac-16@2x.png", points: 16, scale: 2),
    .init(filename: "mac-32.png", points: 32, scale: 1),
    .init(filename: "mac-32@2x.png", points: 32, scale: 2),
    .init(filename: "mac-128.png", points: 128, scale: 1),
    .init(filename: "mac-128@2x.png", points: 128, scale: 2),
    .init(filename: "mac-256.png", points: 256, scale: 1),
    .init(filename: "mac-256@2x.png", points: 256, scale: 2),
    .init(filename: "mac-512.png", points: 512, scale: 1),
    .init(filename: "mac-512@2x.png", points: 512, scale: 2)
]

let launchBrandContents = """
{
  "images" : [
    {
      "filename" : "launch-brand.png",
      "idiom" : "universal",
      "scale" : "1x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
"""

let deepTeal = NSColor(calibratedRed: 0.07, green: 0.22, blue: 0.24, alpha: 1)
let seaTeal = NSColor(calibratedRed: 0.16, green: 0.47, blue: 0.44, alpha: 1)
let seaFoam = NSColor(calibratedRed: 0.42, green: 0.72, blue: 0.63, alpha: 1)
let sand = NSColor(calibratedRed: 0.95, green: 0.92, blue: 0.84, alpha: 1)
let terracotta = NSColor(calibratedRed: 0.87, green: 0.43, blue: 0.29, alpha: 1)
let sunrise = NSColor(calibratedRed: 0.99, green: 0.74, blue: 0.32, alpha: 1)
let surf = NSColor(calibratedRed: 0.31, green: 0.64, blue: 0.71, alpha: 1)

let scriptURL = URL(fileURLWithPath: CommandLine.arguments[0]).standardizedFileURL
let repoRoot = scriptURL.deletingLastPathComponent().deletingLastPathComponent()
let resourcesURL = repoRoot
    .appendingPathComponent("app/apple/CostaRicaSpanishCoach/Shared/Resources")
let iconSetURL = resourcesURL
    .appendingPathComponent("Assets.xcassets/AppIcon.appiconset")
let launchBrandSetURL = resourcesURL
    .appendingPathComponent("Assets.xcassets/LaunchBrand.imageset")

let fileManager = FileManager.default
try fileManager.createDirectory(at: launchBrandSetURL, withIntermediateDirectories: true)
try launchBrandContents.write(
    to: launchBrandSetURL.appendingPathComponent("Contents.json"),
    atomically: true,
    encoding: .utf8
)

func drawRoundedBackground(in rect: NSRect) {
    let inset = rect.width * 0.04
    let tileRect = rect.insetBy(dx: inset, dy: inset)
    let tilePath = NSBezierPath(
        roundedRect: tileRect,
        xRadius: rect.width * 0.23,
        yRadius: rect.width * 0.23
    )

    let gradient = NSGradient(colors: [deepTeal, seaTeal, seaFoam])!
    gradient.draw(in: tilePath, angle: -65)

    let surfPath = NSBezierPath()
    surfPath.move(to: CGPoint(x: tileRect.minX, y: tileRect.minY + tileRect.height * 0.23))
    surfPath.curve(
        to: CGPoint(x: tileRect.maxX, y: tileRect.minY + tileRect.height * 0.29),
        controlPoint1: CGPoint(x: tileRect.minX + tileRect.width * 0.22, y: tileRect.minY + tileRect.height * 0.15),
        controlPoint2: CGPoint(x: tileRect.minX + tileRect.width * 0.68, y: tileRect.minY + tileRect.height * 0.36)
    )
    surfPath.line(to: CGPoint(x: tileRect.maxX, y: tileRect.minY))
    surfPath.line(to: CGPoint(x: tileRect.minX, y: tileRect.minY))
    surfPath.close()
    surf.withAlphaComponent(0.28).setFill()
    surfPath.fill()

    let glowRect = NSRect(
        x: tileRect.minX + tileRect.width * 0.58,
        y: tileRect.minY + tileRect.height * 0.61,
        width: tileRect.width * 0.22,
        height: tileRect.width * 0.22
    )
    sunrise.setFill()
    NSBezierPath(ovalIn: glowRect).fill()
}

func drawBubbleMark(in rect: NSRect) {
    let tileRect = rect.insetBy(dx: rect.width * 0.1, dy: rect.height * 0.1)
    let bubbleRect = NSRect(
        x: tileRect.minX + tileRect.width * 0.14,
        y: tileRect.minY + tileRect.height * 0.24,
        width: tileRect.width * 0.7,
        height: tileRect.height * 0.5
    )

    let bubbleShadow = NSShadow()
    bubbleShadow.shadowColor = NSColor.black.withAlphaComponent(0.16)
    bubbleShadow.shadowBlurRadius = rect.width * 0.035
    bubbleShadow.shadowOffset = NSSize(width: 0, height: -rect.width * 0.01)
    bubbleShadow.set()

    sand.setFill()
    let bubblePath = NSBezierPath(
        roundedRect: bubbleRect,
        xRadius: bubbleRect.width * 0.19,
        yRadius: bubbleRect.width * 0.19
    )
    bubblePath.fill()

    let tailPath = NSBezierPath()
    tailPath.move(to: CGPoint(x: bubbleRect.minX + bubbleRect.width * 0.17, y: bubbleRect.minY))
    tailPath.line(to: CGPoint(x: bubbleRect.minX + bubbleRect.width * 0.29, y: bubbleRect.minY))
    tailPath.line(to: CGPoint(x: bubbleRect.minX + bubbleRect.width * 0.21, y: bubbleRect.minY - bubbleRect.height * 0.17))
    tailPath.close()
    tailPath.fill()

    NSGraphicsContext.current?.saveGraphicsState()
    let symbolOrigin = CGPoint(x: bubbleRect.minX + bubbleRect.width * 0.23, y: bubbleRect.minY + bubbleRect.height * 0.22)
    terracotta.setStroke()
    terracotta.setFill()

    let roofPath = NSBezierPath()
    roofPath.lineWidth = rect.width * 0.05
    roofPath.lineCapStyle = .round
    roofPath.move(to: CGPoint(x: symbolOrigin.x, y: symbolOrigin.y + bubbleRect.height * 0.26))
    roofPath.line(to: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.19, y: symbolOrigin.y + bubbleRect.height * 0.42))
    roofPath.line(to: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.38, y: symbolOrigin.y + bubbleRect.height * 0.26))
    roofPath.stroke()

    let wallPath = NSBezierPath(roundedRect: NSRect(
        x: symbolOrigin.x + bubbleRect.width * 0.08,
        y: symbolOrigin.y,
        width: bubbleRect.width * 0.22,
        height: bubbleRect.height * 0.24
    ), xRadius: rect.width * 0.02, yRadius: rect.width * 0.02)
    terracotta.withAlphaComponent(0.95).setFill()
    wallPath.fill()

    let doorway = NSBezierPath(roundedRect: NSRect(
        x: symbolOrigin.x + bubbleRect.width * 0.15,
        y: symbolOrigin.y,
        width: bubbleRect.width * 0.07,
        height: bubbleRect.height * 0.16
    ), xRadius: rect.width * 0.01, yRadius: rect.width * 0.01)
    deepTeal.withAlphaComponent(0.92).setFill()
    doorway.fill()

    let conversationArc = NSBezierPath()
    conversationArc.lineWidth = rect.width * 0.038
    conversationArc.lineCapStyle = .round
    conversationArc.move(to: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.47, y: symbolOrigin.y + bubbleRect.height * 0.12))
    conversationArc.curve(
        to: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.66, y: symbolOrigin.y + bubbleRect.height * 0.38),
        controlPoint1: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.58, y: symbolOrigin.y + bubbleRect.height * 0.13),
        controlPoint2: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.69, y: symbolOrigin.y + bubbleRect.height * 0.27)
    )
    conversationArc.curve(
        to: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.47, y: symbolOrigin.y + bubbleRect.height * 0.54),
        controlPoint1: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.63, y: symbolOrigin.y + bubbleRect.height * 0.48),
        controlPoint2: CGPoint(x: symbolOrigin.x + bubbleRect.width * 0.52, y: symbolOrigin.y + bubbleRect.height * 0.56)
    )
    sunrise.setStroke()
    conversationArc.stroke()

    let replyDot = NSBezierPath(ovalIn: NSRect(
        x: symbolOrigin.x + bubbleRect.width * 0.56,
        y: symbolOrigin.y + bubbleRect.height * 0.18,
        width: bubbleRect.width * 0.08,
        height: bubbleRect.width * 0.08
    ))
    sunrise.setFill()
    replyDot.fill()
    NSGraphicsContext.current?.restoreGraphicsState()
}

func makeIconImage(size: CGFloat) -> NSImage {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()

    let canvas = NSRect(x: 0, y: 0, width: size, height: size)
    drawRoundedBackground(in: canvas)
    drawBubbleMark(in: canvas)

    image.unlockFocus()
    return image
}

func writePNG(_ image: NSImage, to url: URL) throws {
    guard
        let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff),
        let png = bitmap.representation(using: .png, properties: [:])
    else {
        throw BrandAssetError.couldNotCreateBitmap
    }

    try png.write(to: url)
}

for output in iconOutputs {
    let image = makeIconImage(size: output.pixelSize)
    try writePNG(image, to: iconSetURL.appendingPathComponent(output.filename))
}

let launchBrandImage = makeIconImage(size: 1024)
try writePNG(
    launchBrandImage,
    to: launchBrandSetURL.appendingPathComponent("launch-brand.png")
)

print("Generated Apple brand assets in:")
print("  \(iconSetURL.path)")
print("  \(launchBrandSetURL.path)")
