# OpenPath installer for native Windows PowerShell.
#
#   irm https://raw.githubusercontent.com/Markgatcha/openpath/main/scripts/install.ps1 | iex
#
# Installs Node.js 22 via winget if needed, enables pnpm through Corepack,
# clones the repo, installs dependencies, and builds the app.

$ErrorActionPreference = 'Stop'
$RepoUrl = 'https://github.com/Markgatcha/openpath.git'
$InstallDir = if ($env:OPENPATH_DIR) { $env:OPENPATH_DIR } else { 'openpath' }

function Info($message) { Write-Host "▸ $message" -ForegroundColor Cyan }
function Warn($message) { Write-Host "! $message" -ForegroundColor Yellow }
function Die($message) { Write-Host "✗ $message" -ForegroundColor Red; exit 1 }

function Test-NodeOk {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $false }
  $version = (node -v).TrimStart('v')
  $parts = $version.Split('.')
  [int]$parts[0] -gt 20 -or ([int]$parts[0] -eq 20 -and [int]$parts[1] -ge 19)
}

Write-Host ''
Write-Host '🧭 OpenPath installer' -ForegroundColor White
Write-Host ''

if (Test-NodeOk) {
  Info "Node.js $(node -v) found — good to go."
} else {
  Warn 'Node.js >= 20.19 is required but not found.'
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Info 'Installing Node.js 22 via winget…'
    winget install --id OpenJS.NodeJS.22 -e --accept-source-agreements --accept-package-agreements
    # Refresh PATH for this session.
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not (Test-NodeOk)) {
      Die 'Node.js was installed but this shell cannot see it yet — open a new terminal and re-run.'
    }
  } else {
    Die 'winget not available — install Node.js 22 from https://nodejs.org and re-run.'
  }
}

Info 'Enabling pnpm via Corepack…'
corepack enable pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  corepack prepare pnpm@latest --activate
}

if (Test-Path (Join-Path $InstallDir '.git')) {
  Info 'Existing checkout found — updating…'
  git -C $InstallDir pull --ff-only
} elseif (Test-Path $InstallDir) {
  Info "Directory '$InstallDir' exists but is not a git checkout — using it as-is."
} else {
  Info 'Cloning OpenPath…'
  git clone $RepoUrl $InstallDir
}

Set-Location $InstallDir

Info 'Installing dependencies (this compiles the SQLite binding once)…'
pnpm install

Info 'Building API + web app…'
pnpm build

Write-Host ''
Write-Host '✅ OpenPath is ready!' -ForegroundColor Green
Write-Host ''
@'
  Start it:
    cd openpath; pnpm start        # → http://localhost:8787
  (or develop with hot reload: pnpm dev → web on :5173, API on :8787)

  Demo accounts (seeded on first boot):
    Teacher  ada.lovelace@openpath.dev   / teach1234
    Student  grace.hopper@openpath.dev   / learn1234
    Student  linus.torvalds@openpath.dev / learn1234
    Parent   mary.jackson@openpath.dev   / parent1234

  Everything lives in .\data\openpath.db on this machine.
  Docs: https://github.com/Markgatcha/openpath#-quickstart
'@
