// Plays every scenario on the iOS reference controls with real simulator touches, in the order
// of SCENARIOS in ../run-ios.sh. Each scenario relaunches the app, so the press marker starts
// white every time and the recording can be cut on its white-to-black changes.
import XCTest

final class Drive: XCTestCase {
    // scene, gesture, dx, dy, drag px: points from the centre of the stage.
    static let scenarios: [(String, String, Double, Double, Double)] = [
        ("switch", "tap", 0, 0, 0), ("switch", "hold", 0, 0, 0), ("switch", "drag", -12, 0, 30),
        ("slider", "tap", 80, 0, 0), ("slider", "hold", -48, 0, 0), ("slider", "drag", -48, 0, 100),
        ("segmented", "tap", 80, 0, 0), ("segmented", "drag", -80, 0, 160),
        ("button", "tap", 0, 0, 0), ("button", "hold", 0, 0, 0),
        ("prominent", "tap", 0, 0, 0), ("prominent", "hold", 0, 0, 0),
        ("menu", "tap", 0, 0, 0),
    ]

    func testAll() {
        for (scene, gesture, dx, dy, drag) in Self.scenarios {
            let app = XCUIApplication()
            app.launchEnvironment["FEEL_SCENE"] = scene
            app.launch()
            Thread.sleep(forTimeInterval: 1.2)
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let frame = app.frame
            let p = origin.withOffset(CGVector(dx: frame.width / 2 + dx, dy: frame.height / 2 + dy))
            switch gesture {
            case "tap": p.press(forDuration: 0.06)
            case "hold": p.press(forDuration: 0.9)
            default: p.press(forDuration: 0.05, thenDragTo: p.withOffset(CGVector(dx: drag, dy: 0)), withVelocity: .default, thenHoldForDuration: 0.2)
            }
            Thread.sleep(forTimeInterval: 1.8)
            app.terminate()
        }
    }
}
