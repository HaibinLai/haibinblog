#!/bin/zsh
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd -P)"
repo_root="$(cd "$script_dir/../../.." && pwd -P)"
app_dir="${APP_DIR:-$HOME/Applications/Haibin Blog Publisher.app}"
node_path="$(command -v node)"

mkdir -p "$app_dir/Contents/MacOS" "$app_dir/Contents/Resources"
cp "$script_dir/Info.plist" "$app_dir/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :BlogRoot $repo_root" "$app_dir/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :NodeExecutable $node_path" "$app_dir/Contents/Info.plist"
iconset="$(mktemp -d)/BlogPublisher.iconset"
mkdir -p "$iconset"
for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$repo_root/public/images/logo.png" --out "$iconset/icon_${size}x${size}.png" >/dev/null
done
for size in 16 32 128 256 512; do
  doubled=$((size * 2))
  sips -z "$doubled" "$doubled" "$repo_root/public/images/logo.png" --out "$iconset/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$iconset" -o "$app_dir/Contents/Resources/BlogPublisher.icns"
rm -rf "${iconset:h}"
swiftc -O "$script_dir/BlogPublisherApp.swift" -o "$app_dir/Contents/MacOS/HaibinBlogPublisher"
codesign --force --sign - "$app_dir"
printf 'App ready: %s\n' "$app_dir"
