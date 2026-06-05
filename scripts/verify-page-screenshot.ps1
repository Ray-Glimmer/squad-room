param(
  [string]$Url = "https://ray-glimmer.github.io/squad-room_agents/",
  [string]$Output = "tmp-pages-screenshot.png",
  [int]$Width = 1440,
  [int]$Height = 1200,
  [string]$ExpectedText = "Squad Room",
  [switch]$SkipContentCheck,
  [switch]$VerboseBrowserLog
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

function ConvertTo-CommandLineArgument {
  param([Parameter(Mandatory = $true)][string]$Value)

  if ($Value -notmatch '[\s"]') {
    return $Value
  }
  return '"' + ($Value -replace '"', '\"') + '"'
}

function Start-BrowserProcess {
  param(
    [Parameter(Mandatory = $true)][string]$BrowserPath,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  $argumentText = ($Arguments | ForEach-Object { ConvertTo-CommandLineArgument $_ }) -join " "
  $processInfo = [System.Diagnostics.ProcessStartInfo]::new($BrowserPath, $argumentText)
  $processInfo.UseShellExecute = $false
  $processInfo.CreateNoWindow = $true
  $processInfo.RedirectStandardOutput = $true
  $processInfo.RedirectStandardError = $true
  return [System.Diagnostics.Process]::Start($processInfo)
}

function Invoke-BrowserProcess {
  param(
    [Parameter(Mandatory = $true)][string]$BrowserPath,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [int]$TimeoutMs = 20000
  )

  $process = Start-BrowserProcess -BrowserPath $BrowserPath -Arguments $Arguments
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  $timedOut = -not $process.WaitForExit($TimeoutMs)
  if ($timedOut) {
    $process.Kill()
  }
  $process.WaitForExit()

  return [PSCustomObject]@{
    ExitCode = if ($timedOut) { "timeout" } else { $process.ExitCode }
    Stdout = $stdoutTask.Result
    Stderr = $stderrTask.Result
    TimedOut = $timedOut
  }
}

function Assert-PageContent {
  param(
    [Parameter(Mandatory = $true)][string]$Dom,
    [Parameter(Mandatory = $true)][string]$ExpectedText,
    [Parameter(Mandatory = $true)][string]$OutputPath
  )

  $loadErrorPatterns = @(
    "ERR_NETWORK_ACCESS_DENIED",
    "ERR_CONNECTION",
    "ERR_NAME_NOT_RESOLVED",
    "ERR_INTERNET_DISCONNECTED",
    "ERR_FILE_NOT_FOUND",
    "This site can't be reached",
    "This page isn't working"
  )

  foreach ($pattern in $loadErrorPatterns) {
    if ($Dom -like "*$pattern*") {
      Remove-Item -LiteralPath $OutputPath -Force -ErrorAction SilentlyContinue
      throw "Screenshot captured a browser error page instead of the app: $pattern"
    }
  }

  if ($ExpectedText -and $Dom -notlike "*$ExpectedText*") {
    Remove-Item -LiteralPath $OutputPath -Force -ErrorAction SilentlyContinue
    throw "Screenshot content check failed. Expected text was not found: $ExpectedText"
  }
}

$outputPath = if ([System.IO.Path]::IsPathRooted($Output)) {
  $Output
} else {
  Join-Path (Get-Location) $Output
}

if (Test-Path $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

$outputDir = Split-Path -Parent $outputPath
if ($outputDir -and -not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$attempts = @(
  @("--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--disable-features=RendererCodeIntegrity"),
  @("--headless=new", "--disable-gpu", "--no-sandbox", "--disable-gpu-compositing", "--disable-accelerated-2d-canvas", "--disable-features=UseSkiaRenderer,VizDisplayCompositor,RendererCodeIntegrity"),
  @("--headless=new", "--no-sandbox", "--use-gl=swiftshader", "--use-angle=swiftshader", "--disable-accelerated-2d-canvas", "--disable-features=RendererCodeIntegrity"),
  @("--headless", "--disable-gpu", "--no-sandbox", "--single-process", "--disable-dev-shm-usage", "--disable-features=RendererCodeIntegrity")
)

$lastExitCode = $null
$lastBrowserOutput = ""

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

  $result = Invoke-BrowserProcess -BrowserPath $browser -Arguments $args
  $lastExitCode = $result.ExitCode
  $browserOutput = (($result.Stdout, $result.Stderr) -join "`n").Trim()
  if ($browserOutput) {
    $lastBrowserOutput = $browserOutput
  }

  Remove-Item -LiteralPath $profileDir -Recurse -Force -ErrorAction SilentlyContinue
  if (Test-Path $outputPath) {
    break
  }
}

if (-not (Test-Path $outputPath)) {
  $details = "Screenshot was not created: $outputPath. Last browser exit: $lastExitCode."
  if ($lastBrowserOutput) {
    $details += " Last browser output: $lastBrowserOutput"
  }
  throw $details
}

if (-not $SkipContentCheck) {
  $checkProfileDir = Join-Path ([System.IO.Path]::GetTempPath()) ("squad-room-browser-" + [System.Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $checkProfileDir | Out-Null
  $checkArgs = @(
    "--headless=new"
    "--disable-gpu"
    "--no-sandbox"
    "--disable-dev-shm-usage"
    "--disable-features=RendererCodeIntegrity"
    "--no-first-run"
    "--no-default-browser-check"
    "--disable-extensions"
    "--user-data-dir=$checkProfileDir"
    "--dump-dom"
    $Url
  )
  $checkResult = Invoke-BrowserProcess -BrowserPath $browser -Arguments $checkArgs
  $lastPageDom = $checkResult.Stdout.Trim()
  if ($checkResult.Stderr.Trim()) {
    $lastBrowserOutput = $checkResult.Stderr.Trim()
  }
  Remove-Item -LiteralPath $checkProfileDir -Recurse -Force -ErrorAction SilentlyContinue
  Assert-PageContent -Dom $lastPageDom -ExpectedText $ExpectedText -OutputPath $outputPath
}

if ($VerboseBrowserLog -and $lastBrowserOutput) {
  Write-Host $lastBrowserOutput
}

Get-Item $outputPath | Select-Object FullName, Length, LastWriteTime
