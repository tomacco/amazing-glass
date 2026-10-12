#!/bin/zsh
# run-ios.sh: plays every scenario on Apple's iOS controls in the Simulator with XCUITest
# touches (no mouse), records the screen, and writes out/ios-<control>-<gesture>.png:
# iOS on top, ours below, 50 ms per tile from 100 ms before the press.
# Needs ios/build (cd ios && xcodegen generate && xcodebuild build-for-testing ...; see README).
# Our side is driven with touch events, since iOS is a finger.
set -e
cd ${0:a:h}
source lib.sh
OUT=$PWD/out; D=${SIM:-$(xcrun simctl list devices booted | grep -oE '[0-9A-F-]{36}' | head -1)}
# Gesture arguments for our side: dx dy holdMs dragPx, as in run.sh and ios/Drive.swift.
SPECS=("switch-tap 0 0 900 0" "switch-hold 0 0 900 0" "switch-drag -12 0 0 30" "slider-tap 80 0 900 0" "slider-hold -48 0 900 0" "slider-drag -48 0 0 100" "segmented-tap 80 0 900 0" "segmented-drag -80 0 0 160" "button-tap 0 0 900 0" "button-hold 0 0 900 0" "prominent-tap 0 0 900 0" "prominent-hold 0 0 900 0" "menu-tap 0 0 900 0")
SCENARIOS=(switch-tap switch-hold switch-drag slider-tap slider-hold slider-drag segmented-tap segmented-drag button-tap button-hold prominent-tap prominent-hold menu-tap)
if [[ -z $REUSE ]]; then
  rm -f $OUT/ios/all.mov; mkdir -p $OUT/ios
  xcrun simctl io $D recordVideo --codec=h264 --force $OUT/ios/all.mov >/dev/null 2>&1 & rec=$!
  sleep 2
  xcodebuild test-without-building -xctestrun ios/build/Build/Products/*.xctestrun -destination "id=$D" >/dev/null 2>&1
  kill -INT $rec; wait $rec || true
fi
# Every relaunch passes through a white launch screen, which reads as an extra marker change;
# the press is the second change of each pair.
ffmpeg -v error -i $OUT/ios/all.mov -vf "crop=24:24:6:6,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$OUT/ios/marks.txt" -f null - 2>/dev/null
presses=(${(f)"$(awk '/pts_time/{split($0,a,"pts_time:"); t=a[2]} /YAVG/{split($0,b,"="); k=(b[2]<60); if(p==0 && k) print t; p=k}' $OUT/ios/marks.txt | awk 'NR%2==0')"})
i=0
for name in $SCENARIOS; do
  i=$((i+1)); t=$presses[$i]; n=$(tiles ${name#*-})
  ffmpeg -v error -y -ss $((t - 0.1)) -i $OUT/ios/all.mov -t $((n * 0.05)) -vf "fps=20,crop=600:240:303:1191,scale=400:160,tile=8x$(( (n+7)/8 )):padding=4:color=white" -frames:v 1 $OUT/ios-top.png
  parts=(${(s:-:)name}); args=(${=${(M)SPECS:#$name *}#$name })
  TOUCH=1 bun web.ts $parts[1] $parts[2] $args $OUT/touch/$name >/dev/null
  pw=$(pressed $OUT/touch/$name)
  sheet $OUT/touch/$name $((pw - 100)) 50 $n $OUT/web-bottom.png
  ffmpeg -v error -y -i $OUT/ios-top.png -i $OUT/web-bottom.png -filter_complex "[0]pad=iw:ih+16:0:0:black[a];[a][1]vstack" $OUT/ios-$name.png
  echo "ios-$name done"
done
rm -f $OUT/ios-top.png $OUT/web-bottom.png
