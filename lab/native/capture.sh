#!/bin/zsh
# capture.sh <background.png> <out.png> [dark]: renders Apple's glass and saves the content area in sRGB.
set -e
DIR=${0:a:h}
pkill -x GlassRef 2>/dev/null || true
GLASSREF_BG="$1" GLASSREF_DARK=${3:+1} "$DIR/GlassRef" > /dev/null 2>&1 &
sleep 2.5
WID=$(swift "$DIR/winid.swift" 2>/dev/null | head -1)
screencapture -x -o -l "$WID" /tmp/claude-501/glassref-raw.png
pkill -x GlassRef || true
sips -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" /tmp/claude-501/glassref-raw.png --out /tmp/claude-501/glassref-srgb.png > /dev/null
H=$(sips -g pixelHeight /tmp/claude-501/glassref-srgb.png | awk '/pixelHeight/{print $2}')
sips -c 800 1600 --cropOffset $((H-800)) 0 /tmp/claude-501/glassref-srgb.png --out "$2" > /dev/null
echo "saved $2"
