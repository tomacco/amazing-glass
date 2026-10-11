// Reference controls: Apple's own SwiftUI controls over a striped backdrop, one scene at a
// time, so their motion can be recorded and compared with ours frame by frame.
// Build: swiftc -parse-as-library -O FeelRef.swift -o FeelRef
// Run:   FEEL_SCENE=slider ./FeelRef   (switch, slider, segmented, button, prominent, menu)
// The window sits at a fixed spot so drive.swift can find the control: the control is
// centred in a 400 x 160 content area. Mirrored in ../index.html.
import SwiftUI
import AppKit

let scene = ProcessInfo.processInfo.environment["FEEL_SCENE"] ?? "switch"

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

struct Control: View {
    @State var on = false
    @State var value = 0.3
    @State var pick = "Day"
    var body: some View {
        switch scene {
        case "slider":
            Slider(value: $value).frame(width: 240).controlSize(.extraLarge)
        case "segmented":
            Picker("", selection: $pick) { ForEach(["Day", "Week", "Month"], id: \.self) { Text($0) } }
                .pickerStyle(.segmented).labelsHidden().frame(width: 240).controlSize(.extraLarge)
        case "button":
            Button("Cancel") {}.buttonStyle(.glass).controlSize(.extraLarge)
        case "prominent":
            Button("Done") {}.buttonStyle(.glassProminent).controlSize(.extraLarge)
        case "menu":
            Menu("More") { Button("Share") {}; Button("Duplicate") {}; Divider(); Button("Delete", role: .destructive) {} }
                .menuStyle(.button).buttonStyle(.glass).fixedSize().controlSize(.extraLarge)
        default:
            Toggle("", isOn: $on).labelsHidden().toggleStyle(.switch).controlSize(.extraLarge)
        }
    }
}

/// The stage, plus a press marker: an 8 pt black square in the top left corner from the
/// moment the mouse goes down, so the recording can be aligned on the press exactly.
struct Stage: View {
    @State var pressed = false
    var body: some View {
        ZStack(alignment: .topLeading) {
            ZStack { Stripes(); Control() }
            Rectangle().fill(pressed ? Color.black : Color.white).frame(width: 8, height: 8)
        }
        .frame(width: 400, height: 160)
        .onAppear {
            NSEvent.addLocalMonitorForEvents(matching: .leftMouseDown) { e in pressed = true; return e }
        }
    }
}

@main
struct FeelRefApp: App {
    var body: some Scene {
        WindowGroup("FeelRef") {
            Stage()
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        guard let w = NSApp.windows.first, let s = NSScreen.main else { return }
                        w.setFrameTopLeftPoint(NSPoint(x: s.visibleFrame.minX + 80, y: s.visibleFrame.maxY - 80))
                        w.level = .floating
                        NSApp.activate(ignoringOtherApps: true); w.makeKeyAndOrderFront(nil)
                    }
                }
        }.windowResizability(.contentSize)
    }
}
