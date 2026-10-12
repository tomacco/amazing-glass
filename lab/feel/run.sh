#!/bin/zsh
# run.sh [scenario-filter]   (WEB_ONLY=1 reuses the native recordings and skips the mouse): records each scenario on Apple's SwiftUI control (real mouse,
# needs the owner's go-ahead) and on ours (Playwright), then writes out/<scene>-<mode>.png:
# native frames on top, ours below, 50 ms per tile, from 100 ms before the press, cropped
# to the middle 200 x 80 points around the control.
set -e
cd ${0:a:h}
OUT=$PWD/out; mkdir -p $OUT/native $OUT/web
SCENARIOS=(
  "switch tap 0 0 900 0"      "switch hold 0 0 900 0"      "switch drag -12 0 0 30"
  "slider tap 80 0 900 0"     "slider hold -48 0 900 0"    "slider drag -48 0 0 100"
  "segmented tap 80 0 900 0"  "segmented drag -80 0 0 160"
  "button tap 0 0 900 0"      "button hold 0 0 900 0"
  "prominent tap 0 0 900 0"   "prominent hold 0 0 900 0"
  "menu tap 0 0 900 0"
)
source ${0:a:h}/lib.sh
[[ -z $WEB_ONLY ]] && say "Borrowing the mouse for a minute. Stand back, science."
for sc in $SCENARIOS; do
  parts=(${=sc}); scene=$parts[1] mode=$parts[2] dx=$parts[3] dy=$parts[4] hold=$parts[5] drag=$parts[6]
  [[ -n $1 && $sc != *$1* ]] && continue
  name=$scene-$mode
  if [[ -z $WEB_ONLY ]]; then
  pkill -x FeelRef || true
  FEEL_SCENE=$scene native/FeelRef >/dev/null 2>&1 &
  sleep 1.5
  rect=$(native/drive tap 0 0 --dry | sed -n 's/rect //p')
  secs=$([[ $mode == hold ]] && echo 4 || echo 3)
  rm -f $OUT/native/$name.mov
  screencapture -x -v -V $secs -R$rect $OUT/native/$name.mov &
  rec=$!
  sleep 0.6
  native/drive $mode $dx $dy $hold $drag $([[ $scene == menu ]] && echo --esc) >/dev/null
  wait $rec
  pkill -x FeelRef || true
  rm -rf $OUT/native/$name; mkdir -p $OUT/native/$name
  ffmpeg -v error -i $OUT/native/$name.mov -fps_mode passthrough -frame_pts 1 $OUT/native/$name/%06d.png
  fi
  bun web.ts $scene $mode $dx $dy $hold $drag $OUT/web/$name >/dev/null
  n=$(tiles $mode)
  # Align both on the press marker; native frames are in 1/60 s units, ours in ms.
  pn=$(pressed $OUT/native/$name); pw=$(pressed $OUT/web/$name)
  sheet $OUT/native/$name $((pn - 6)) 3 $n $OUT/native-$name.png
  sheet $OUT/web/$name $((pw - 100)) 50 $n $OUT/web-$name.png
  ffmpeg -v error -y -i $OUT/native-$name.png -i $OUT/web-$name.png -filter_complex "[0]pad=iw:ih+16:0:0:black[a];[a][1]vstack" $OUT/$name.png
  rm -f $OUT/native-$name.png $OUT/web-$name.png
  echo "$name done"
done
[[ -z $WEB_ONLY ]] && say "Mouse is yours again."; true
