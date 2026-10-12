// Reference controls on iOS, the platform the components copy. Same scenes as
// ../native/FeelRef.swift: a 400 x 160 pt striped stage in the middle of the screen.
// Build and run: ./build.sh, then FEEL_SCENE comes in as SIMCTL_CHILD_FEEL_SCENE.
import SwiftUI
import UIKit

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
        case "slider": Slider(value: $value).frame(width: 240)
        case "segmented":
            Picker("", selection: $pick) { ForEach(["Day", "Week", "Month"], id: \.self) { Text($0) } }
                .pickerStyle(.segmented).frame(width: 240)
        case "button": Button("Cancel") {}.buttonStyle(.glass).controlSize(.large)
        case "prominent": Button("Done") {}.buttonStyle(.glassProminent).controlSize(.large)
        case "menu":
            Menu { Button("Share") {}; Button("Duplicate") {}; Divider(); Button("Delete", role: .destructive) {} } label: {
                Image(systemName: "ellipsis").frame(width: 24, height: 24)
            }.buttonStyle(.glass).buttonBorderShape(.circle).controlSize(.large)
        default: Toggle("", isOn: $on).labelsHidden()
        }
    }
}

/// Press marker: a black square in the top left corner of the screen from the first touch,
/// so the recording can be aligned on the press. Watches the window without taking touches.
final class Watch: UIView {
    var onTouch: () -> Void = {}
    override func didMoveToWindow() {
        guard let w = window else { return }
        let g = UILongPressGestureRecognizer(target: self, action: #selector(fired))
        g.minimumPressDuration = 0; g.cancelsTouchesInView = false; g.delaysTouchesBegan = false; g.delegate = self
        w.addGestureRecognizer(g)
    }
    @objc func fired(_ g: UIGestureRecognizer) { if g.state == .began { onTouch() } }
}
extension Watch: UIGestureRecognizerDelegate {
    func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith o: UIGestureRecognizer) -> Bool { true }
}
struct WatchView: UIViewRepresentable {
    var onTouch: () -> Void
    func makeUIView(context: Context) -> Watch { let v = Watch(); v.onTouch = onTouch; v.isUserInteractionEnabled = false; return v }
    func updateUIView(_ v: Watch, context: Context) {}
}

struct Stage: View {
    @State var pressed = false
    var body: some View {
        ZStack(alignment: .topLeading) {
            Color(white: 0.13)
            ZStack { Stripes(); Control() }.frame(width: 400, height: 160)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            Rectangle().fill(pressed ? Color.black : Color.white).frame(width: 12, height: 12)
            WatchView { pressed = true }.frame(width: 1, height: 1)
        }
        .ignoresSafeArea()
    }
}

@main
struct FeelRefiOSApp: App {
    var body: some Scene { WindowGroup { Stage() } }
}
