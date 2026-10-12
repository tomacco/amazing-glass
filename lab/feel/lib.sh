# Shared by run.sh (macOS reference) and run-ios.sh (iOS reference).
tiles() { [[ $1 == hold ]] && echo 40 || echo 24 }
# sheet <frames dir> <first unit> <units per 50 ms> <count> <out.png>: nearest earlier frame per tile.
sheet() {
  local dir=$1 first=$2 step=$3 count=$4 out=$5 list=$(mktemp) i want best f n
  local files=(${(f)"$(ls $dir/*.png | sort)"})
  for i in $(seq 0 $((count-1))); do
    want=$((first + i*step)); best=$files[1]
    for f in $files; do n=$((10#$(basename $f .png))); (( n <= want )) && best=$f; done
    echo "file '$best'" >> $list
  done
  ffmpeg -v error -y -f concat -safe 0 -i $list -vf "crop=400:160:200:80,tile=8x$(( (count+7)/8 )):padding=4:color=white" -frames:v 1 $out
  rm -f $list
}
# pressed <frames dir>: name (as a number) of the first frame whose top left marker is black.
pressed() {
  local f
  for f in $(ls $1/*.png | sort); do
    local y=$(ffmpeg -v error -i $f -vf "crop=12:12:2:2,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - | sed -n 's/.*YAVG=//p')
    if (( ${y%.*} < 60 )); then echo $((10#$(basename $f .png))); return; fi
  done
  echo 0
}
