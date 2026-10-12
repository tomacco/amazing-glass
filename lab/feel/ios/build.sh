#!/bin/zsh
# Builds FeelRef.app for the iOS Simulator without an Xcode project.
set -e
cd ${0:a:h}
SDK=$(xcrun --sdk iphonesimulator --show-sdk-path)
rm -rf FeelRef.app && mkdir FeelRef.app
xcrun swiftc -parse-as-library -O -sdk $SDK -target arm64-apple-ios27.0-simulator FeelRefiOS.swift -o FeelRef.app/FeelRef
cp Info.plist FeelRef.app/
codesign -s - FeelRef.app >/dev/null 2>&1
echo built
