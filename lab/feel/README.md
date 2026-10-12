# Feel

How our controls move, checked against Apple's own SwiftUI controls on this Mac. Same gesture,
same backdrop, frame by frame.

1. Build the reference app and the driver (Swift command-line tools):
   `swiftc -parse-as-library -O native/FeelRef.swift -o native/FeelRef` and
   `swiftc -O native/drive.swift -o native/drive`
2. Give the terminal Accessibility and Screen Recording permission. The driver moves the real
   cursor, so run it only with the owner's go-ahead; it says so out loud first.
3. From the repo root: `bun run build`, then `bun tools/serve.ts 5182`.
4. `lab/feel/run.sh [filter]` records every scenario on both, then writes
   `out/<control>-<gesture>.png`: Apple on top, ours below, 50 ms per tile from 100 ms before
   the press. `WEB_ONLY=1` reuses the native recordings and leaves the mouse alone.

Both sides paint a black square in the top left corner on mouse down; the sheets align on it.
Our frames come from Playwright screenshots at about 20 per second, so our side can look up to
one tile late.

`cost.ts` reads Chromium's own main-thread counters for one press, `frames.ts` measures frame
times in a visible Chromium with the GPU compositor.

The native controls are the macOS versions. Shapes differ from the iOS ones we copy (the macOS
slider thumb is round); timing and when the lens appears are what this compares.

## iOS

The components copy iOS, so iOS is the main reference; macOS is the reference for mouse input.
`ios/` holds the same scenes as a SwiftUI app plus an XCUITest target that plays the gestures
with real simulator touches, so nobody's mouse is needed.

1. `cd ios && xcodegen generate && xcodebuild build-for-testing -project FeelRef.xcodeproj
   -scheme FeelRef -destination 'id=<booted simulator>' -derivedDataPath build`
2. `lab/feel/run-ios.sh` records the simulator while the test runs, drives ours with touch
   events, and writes `out/ios-<control>-<gesture>.png`. `REUSE=1` keeps the last recording.

What the two references disagree on, and what the components do about it: on macOS a quick
click never shows the lens, on iOS a quick tap does. Our controls follow the pointer: a mouse
gets the macOS behaviour, a finger the iOS one (`lensDelay` in `src/elements/base.ts`).
