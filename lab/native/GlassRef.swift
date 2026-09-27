// Reference renderer: Apple's own Liquid Glass over a known background image, captured
// and diffed against the web engine. Usage: GLASSREF_BG=<background.png> [GLASSREF_DARK=1] GlassRef
// (Environment, not arguments: AppKit treats an argument as a document to open and then
// shows no default window.)
import SwiftUI
import AppKit

let env = ProcessInfo.processInfo.environment
let bgPath = env["GLASSREF_BG"] ?? ""
let dark = env["GLASSREF_DARK"] == "1"

struct Stage: View {
    var body: some View {
        ZStack {
            if let img = NSImage(contentsOfFile: bgPath) {
                Image(nsImage: img).resizable().frame(width: 800, height: 400)
            }
            // Geometry mirrored exactly in match/index.html.
            HStack(spacing: 40) {
                Color.clear.frame(width: 220, height: 64).glassEffect(.regular, in: .capsule)
                Color.clear.frame(width: 220, height: 64).glassEffect(.clear, in: .capsule)
                Color.clear.frame(width: 90, height: 90).glassEffect(.clear, in: .circle)
            }
            .offset(y: -40)
            HStack(spacing: 40) {
                Color.clear.frame(width: 300, height: 110).glassEffect(.regular, in: .rect(cornerRadius: 34))
                Color.clear.frame(width: 300, height: 110).glassEffect(.clear, in: .rect(cornerRadius: 34))
            }
            .offset(y: 110)
        }
        .frame(width: 800, height: 400)
        .preferredColorScheme(dark ? .dark : .light)
    }
}

@main
struct GlassRefApp: App {
    var body: some Scene {
        WindowGroup("GlassRef") { Stage() }.windowResizability(.contentSize)
    }
}
