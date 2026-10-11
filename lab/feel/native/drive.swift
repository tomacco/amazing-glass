// drive.swift <tap|hold|drag> <dx> <dy> [holdMs] [dragPx] [--dry] [--esc: press Escape after]
// Real mouse input on the FeelRef window, at (dx, dy) points from the centre of its 400 x 160
// content. Needs Accessibility for the terminal and the owner's go-ahead: it moves the real
// cursor. Prints the content rect (screen points) first, so the recorder can crop to it.
import CoreGraphics
import Foundation

let flags = CommandLine.arguments.filter { $0.hasPrefix("--") }
let args = CommandLine.arguments.filter { !$0.hasPrefix("--") }
let mode = args.count > 1 ? args[1] : "tap"
let dx = args.count > 2 ? Double(args[2])! : 0, dy = args.count > 3 ? Double(args[3])! : 0
let holdMs = args.count > 4 ? Double(args[4])! : 900
let dragPx = args.count > 5 ? Double(args[5])! : 30

let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]] ?? []
guard let w = list.first(where: { ($0[kCGWindowOwnerName as String] as? String) == "FeelRef" && ($0[kCGWindowLayer as String] as? Int) == 3 }),
      let b = w[kCGWindowBounds as String] as? [String: Any] else { print("no window"); exit(1) }
let num = { (k: String) in (b[k] as! NSNumber).doubleValue }
let x = num("X"), y = num("Y"), width = num("Width"), height = num("Height")
// Content is 400 x 160 at the bottom of the window, under the title bar.
let top = y + height - 160
print("rect \(Int(x)),\(Int(top)),400,160")
if flags.contains("--dry") { exit(0) }

func post(_ t: CGEventType, _ p: CGPoint) {
    CGEvent(mouseEventSource: nil, mouseType: t, mouseCursorPosition: p, mouseButton: .left)?.post(tap: .cghidEventTap)
}
let p = CGPoint(x: x + 200 + dx, y: top + 80 + dy)
post(.mouseMoved, p); usleep(300_000)
post(.leftMouseDown, p)
switch mode {
case "tap": usleep(60_000)
case "drag":
    for i in 1...20 { usleep(16_000); post(.leftMouseDragged, CGPoint(x: p.x + dragPx * Double(i) / 20, y: p.y)) }
    usleep(200_000)
default: usleep(useconds_t(holdMs * 1000))
}
post(.leftMouseUp, CGPoint(x: mode == "drag" ? p.x + dragPx : p.x, y: p.y))
if flags.contains("--esc") {
    usleep(1_200_000)
    for down in [true, false] { CGEvent(keyboardEventSource: nil, virtualKey: 53, keyDown: down)?.post(tap: .cghidEventTap) }
}
