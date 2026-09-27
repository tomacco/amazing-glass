# The lab

How the `regular` and `clear` presets were measured. You need macOS with the Swift
command-line tools (no Xcode), Chrome, Bun and Node.

1. Build the reference app: `swiftc -parse-as-library -O native/GlassRef.swift -o native/GlassRef`
2. Give your terminal Screen Recording permission (System Settings, Privacy & Security).
3. Capture Apple's glass over each scene:
   `native/capture.sh "$PWD/scenes/bg-chart.png" "$PWD/ref/ref-chart.png"` (same for `dusk`).
4. From the repo root: `bun run build lib`, then `bun run dev` in another terminal.
5. Score the current presets: `REPEAT=1 node lab/fit.mjs chart,dusk regular 0`
6. Fit: `node lab/fit.mjs chart,dusk regular 8`. Results land in `lab/fit-regular.json`.

`index.html` mirrors the geometry in `native/GlassRef.swift` exactly. Change one, change both.
The score is the mean absolute difference per colour channel (0 to 255) over each glass shape
plus a 10 px margin. Transitions are disabled on the page, because a fading tint made repeated
measurements disagree the first time round.

`ref/` holds our captures from macOS 27, so step 5 works without steps 1 to 3.
