# Install the Berg theme into Zed (Windows).
# Usage: .\install.ps1
$ErrorActionPreference = 'Stop'

$themes = Join-Path $env:APPDATA 'Zed\themes'
New-Item -ItemType Directory -Force -Path $themes | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'themes\berg.json') (Join-Path $themes 'berg.json') -Force

Write-Host "Installed Berg into $themes\berg.json"
Write-Host "In Zed, open the theme selector (Ctrl+K Ctrl+T) and pick Berg."
