// drive.swift <tap|hold|drag> <a|b> [holdMs]: real mouse input on a SwitchRef knob.
// Needs Accessibility for the terminal, and the owner's go-ahead: it moves the real cursor.
// Prints the window rect first so the recorder can crop to it.
import CoreGraphics
import Foundation

let flags = CommandLine.arguments.filter { $0.hasPrefix("--") }, args = CommandLine.arguments.filter { !$0.hasPrefix("--") }
let mode = args.count > 1 ? args[1] : "tap", which = args.count > 2 ? args[2] : "a"
let holdMs = args.count > 3 ? Double(args[3])! : 900

let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]] ?? []
guard let w = list.first(where: { ($0[kCGWindowOwnerName as String] as? String) == "SwitchRef" }),
      let b = w[kCGWindowBounds as String] as? [String: Any] else { print("no window"); exit(1) }
let num = { (k: String) in (b[k] as! NSNumber).doubleValue }
let x = num("X"), y = num("Y"), width = num("Width"), height = num("Height")
print("rect \(Int(x)),\(Int(y)),\(Int(width)),\(Int(height))")
if flags.contains("--dry") { exit(0) }
// Content is 400 x 160 at the bottom of the window; toggles sit around the centre.
let cy = y + height - 80, cx = x + width / 2 + (which == "a" ? -80 : 80)

func post(_ t: CGEventType, _ p: CGPoint) {
    CGEvent(mouseEventSource: nil, mouseType: t, mouseCursorPosition: p, mouseButton: .left)?.post(tap: .cghidEventTap)
}
let p = CGPoint(x: cx, y: cy)
post(.mouseMoved, p); usleep(300_000)
post(.leftMouseDown, p)
switch mode {
case "tap": usleep(60_000)
case "drag":
    for i in 1...20 { usleep(16_000); post(.leftMouseDragged, CGPoint(x: cx + Double(i) * 1.5, y: cy)) }
    usleep(200_000)
default: usleep(useconds_t(holdMs * 1000))
}
post(.leftMouseUp, CGPoint(x: mode == "drag" ? cx + 30 : cx, y: cy))
