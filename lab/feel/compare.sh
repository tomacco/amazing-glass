#!/bin/zsh
# compare.sh <before-port>: three-row sheets for the scenarios worth showing.
# Apple on top, ours before the fix in the middle (served from <before-port>), ours now below.
# Mouse rows compare with macOS (out/native), finger rows with iOS (out/ios/all.mov).
set -e
cd ${0:a:h}
source lib.sh
OUT=$PWD/out; PORT=${1:-5183}; mkdir -p $OUT/show
SPEC=("switch tap 0 0 900 0" "switch hold 0 0 900 0" "slider tap 80 0 900 0" "segmented tap 80 0 900 0" "menu tap 0 0 900 0")
IOS_ORDER=(switch-tap switch-hold switch-drag slider-tap slider-hold slider-drag segmented-tap segmented-drag button-tap button-hold prominent-tap prominent-hold menu-tap)
presses=(${(f)"$(awk '/pts_time/{split($0,a,"pts_time:"); t=a[2]} /YAVG/{split($0,b,"="); k=(b[2]<60); if(p==0 && k) print t; p=k}' $OUT/ios/marks.txt | awk 'NR%2==0')"})
row3() { ffmpeg -v error -y -i $1 -i $2 -i $3 -filter_complex "[0]pad=iw:ih+12:0:0:black[a];[1]pad=iw:ih+12:0:0:black[b];[a][b][2]vstack=3" $4; }
for sc in $SPEC; do
  p=(${=sc}); name=$p[1]-$p[2]; n=$(tiles $p[2])
  # Mouse: macOS reference.
  bun web.ts $p[1] $p[2] $p[3] $p[4] $p[5] $p[6] $OUT/before-mouse/$name $PORT >/dev/null
  pn=$(pressed $OUT/native/$name); pb=$(pressed $OUT/before-mouse/$name); pa=$(pressed $OUT/web/$name)
  sheet $OUT/native/$name $((pn - 6)) 3 $n /tmp/feel-a.png
  sheet $OUT/before-mouse/$name $((pb - 100)) 50 $n /tmp/feel-b.png
  sheet $OUT/web/$name $((pa - 100)) 50 $n /tmp/feel-c.png
  row3 /tmp/feel-a.png /tmp/feel-b.png /tmp/feel-c.png $OUT/show/mouse-$name.png
  # Finger: iOS reference.
  TOUCH=1 bun web.ts $p[1] $p[2] $p[3] $p[4] $p[5] $p[6] $OUT/before-touch/$name $PORT >/dev/null
  t=$presses[${IOS_ORDER[(i)$name]}]
  ffmpeg -v error -y -ss $((t - 0.1)) -i $OUT/ios/all.mov -t $((n * 0.05)) -vf "fps=20,crop=600:240:303:1191,scale=400:160,tile=8x$(( (n+7)/8 )):padding=4:color=white" -frames:v 1 /tmp/feel-a.png
  pb=$(pressed $OUT/before-touch/$name); pa=$(pressed $OUT/touch/$name)
  sheet $OUT/before-touch/$name $((pb - 100)) 50 $n /tmp/feel-b.png
  sheet $OUT/touch/$name $((pa - 100)) 50 $n /tmp/feel-c.png
  row3 /tmp/feel-a.png /tmp/feel-b.png /tmp/feel-c.png $OUT/show/touch-$name.png
  echo "$name done"
done
rm -f /tmp/feel-[abc].png
