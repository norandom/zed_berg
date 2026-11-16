#!/bin/sh
# Install the Berg theme into Zed (Linux, macOS).
# Usage: ./install.sh
set -eu

src="$(cd "$(dirname "$0")" && pwd)"
themes="${XDG_CONFIG_HOME:-$HOME/.config}/zed/themes"

mkdir -p "$themes"
cp "$src/themes/berg.json" "$themes/berg.json"

echo "Installed Berg into $themes/berg.json"
echo "In Zed, open the theme selector (Cmd/Ctrl+K Cmd/Ctrl+T) and pick Berg."
