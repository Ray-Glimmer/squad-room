param(
  [string]$Url = "https://ray-glimmer.github.io/squad-room_agents/",
  [string]$Output = "tmp-pages-screenshot.png",
  [int]$Width = 1440,
  [int]$Height = 1200
)

$ErrorActionPreference = "Stop"

$browserCandidates = @(
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  throw "No supported headless browser found. Install Microsoft Edge or Google Chrome."
}

$outputPath = if ([System.IO.Path]::IsPathRooted($Output)) {
  $Output
} else {
  Join-Path (Get-Location) $Output
}

if (Test-Path $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

& $browser `
  --headless=new `
  --disable-gpu `
  --no-first-run `
  --no-default-browser-check `
  "--window-size=$Width,$Height" `
  "--screenshot=$outputPath" `
  $Url | Out-Null

if (-not (Test-Path $outputPath)) {
  throw "Screenshot was not created: $outputPath"
}

Get-Item $outputPath | Select-Object FullName, Length, LastWriteTime
