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

$attempts = @(
  @("--headless=new", "--disable-gpu"),
  @("--headless=new", "--disable-gpu", "--disable-gpu-compositing", "--disable-accelerated-2d-canvas", "--disable-features=UseSkiaRenderer,VizDisplayCompositor"),
  @("--headless=new", "--use-gl=swiftshader", "--use-angle=swiftshader", "--disable-accelerated-2d-canvas"),
  @("--headless", "--disable-gpu", "--single-process", "--disable-dev-shm-usage")
)

foreach ($attempt in $attempts) {
  if (Test-Path $outputPath) {
    Remove-Item -LiteralPath $outputPath -Force
  }
  $profileDir = Join-Path ([System.IO.Path]::GetTempPath()) ("squad-room-browser-" + [System.Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $profileDir | Out-Null
  $args = @(
    $attempt
    "--no-first-run"
    "--no-default-browser-check"
    "--disable-extensions"
    "--user-data-dir=$profileDir"
    "--window-size=$Width,$Height"
    "--screenshot=$outputPath"
    $Url
  )
  $process = Start-Process -FilePath $browser -ArgumentList $args -PassThru -WindowStyle Hidden
  if (-not $process.WaitForExit(15000)) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  Remove-Item -LiteralPath $profileDir -Recurse -Force -ErrorAction SilentlyContinue
  if (Test-Path $outputPath) {
    break
  }
}

if (-not (Test-Path $outputPath)) {
  throw "Screenshot was not created: $outputPath"
}

Get-Item $outputPath | Select-Object FullName, Length, LastWriteTime
