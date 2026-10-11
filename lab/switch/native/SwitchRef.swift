// Reference switches: Apple's own Toggle over a striped backdrop, so the lens shows when it
// appears. Build: swiftc -parse-as-library -O SwitchRef.swift -o SwitchRef
// The window sits at a fixed spot (top left of the main screen) so drive.swift knows where
// the knobs are. Layout mirrored in ../index.html.
import SwiftUI
import AppKit

struct Stripes: View {
    var body: some View {
        Canvas { ctx, size in
            let cols: [Color] = [.red, .orange, .yellow, .green, .cyan, .blue, .purple]
            var x = 0.0, i = 0
            while x < size.width {
                ctx.fill(Path(CGRect(x: x, y: 0, width: 12, height: size.height)), with: .color(cols[i % cols.count]))
                x += 12; i += 1
            }
        }
    }
}

struct Stage: View {
    @State var a = false
    @State var b = true
    var body: some View {
        ZStack {
            Stripes()
            HStack(spacing: 80) {
                Toggle("", isOn: $a).labelsHidden().toggleStyle(.switch).controlSize(.extraLarge)
                Toggle("", isOn: $b).labelsHidden().toggleStyle(.switch).controlSize(.extraLarge)
            }
        }
        .frame(width: 400, height: 160)
        .onChange(of: a) { _, v in print("a", v, Date().timeIntervalSince1970); fflush(stdout) }
        .onChange(of: b) { _, v in print("b", v, Date().timeIntervalSince1970); fflush(stdout) }
    }
}

@main
struct SwitchRefApp: App {
    var body: some Scene {
        WindowGroup("SwitchRef") {
            Stage().onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    guard let w = NSApp.windows.first, let s = NSScreen.main else { return }
                    w.setFrameTopLeftPoint(NSPoint(x: s.visibleFrame.minX + 80, y: s.visibleFrame.maxY - 80))
                    w.level = .floating
                }
            }
        }.windowResizability(.contentSize)
    }
}
