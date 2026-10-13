#!/usr/bin/env bash
#
# OpenPath one-line installer.
#
#   curl -fsSL https://raw.githubusercontent.com/Markgatcha/openpath/main/scripts/install.sh | bash
#
# Works on macOS, Linux, and Windows (Git Bash / WSL). It makes sure Node.js
# 20.19+ is present, enables pnpm via Corepack, installs dependencies, and
# builds the app. Everything stays on your machine — no accounts, no cloud.

set -euo pipefail

MIN_NODE_MAJOR=20
MIN_NODE_MINOR=19
REPO_URL="https://github.com/Markgatcha/openpath.git"
INSTALL_DIR="${OPENPATH_DIR:-openpath}"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
info() { printf '\033[36m▸ %s\033[0m\n' "$1"; }
warn() { printf '\033[33m! %s\033[0m\n' "$1"; }
die() {
  printf '\033[31m✗ %s\033[0m\n' "$1" >&2
  exit 1
}

have() { command -v "$1" >/dev/null 2>&1; }

node_ok() {
  have node || return 1
  local version major minor
  version="$(node -v | sed 's/^v//')"
  major="${version%%.*}"
  minor="${version#*.}"
  minor="${minor%%.*}"
  [ "$major" -gt "$MIN_NODE_MAJOR" ] || { [ "$major" -eq "$MIN_NODE_MAJOR" ] && [ "$minor" -ge "$MIN_NODE_MINOR" ]; }
}

install_node_linux() {
  if have apt-get; then
    info "Installing Node.js 22 via apt (NodeSource)…"
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif have dnf; then
    info "Installing Node.js 22 via dnf…"
    sudo dnf install -y nodejs npm
  elif have pacman; then
    info "Installing Node.js via pacman…"
    sudo pacman -Sy --noconfirm nodejs npm
  else
    return 1
  fi
}

install_node_mac() {
  if have brew; then
    info "Installing Node.js 22 via Homebrew…"
    brew install node@22
    brew link --overwrite --force node@22 || true
  else
    return 1
  fi
}

main() {
  bold "🧭 OpenPath installer"
  echo

  if node_ok; then
    info "Node.js $(node -v) found — good to go."
  else
    warn "Node.js >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR} is required but not found."
    local uname_s
    uname_s="$(uname -s 2>/dev/null || echo Windows)"
    case "$uname_s" in
      Linux*) install_node_linux || die "Could not install Node.js automatically — see https://nodejs.org for manual installs." ;;
      Darwin*) install_node_mac || die "Could not install Node.js automatically — see https://nodejs.org for manual installs." ;;
      *)
        die "Windows without Git Bash? Run this in Git Bash, WSL, or install Node.js from https://nodejs.org first." ;;
    esac
    node_ok || die "Node.js still too old after install (need >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR})."
    info "Node.js $(node -v) installed."
  fi

  # Corepack ships with Node; it gives us pnpm without a global install.
  if ! have corepack; then
    die "corepack not found — it ships with Node.js 16.9+. Reinstall Node.js from https://nodejs.org."
  fi
  info "Enabling pnpm via Corepack…"
  corepack enable pnpm || sudo corepack enable pnpm || true
  have pnpm || corepack prepare pnpm@latest --activate

  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Existing checkout found — updating…"
    git -C "$INSTALL_DIR" pull --ff-only || warn "Pull failed; continuing with the current checkout."
  elif [ -d "$INSTALL_DIR" ]; then
    info "Directory '$INSTALL_DIR' exists but is not a git checkout — using it as-is."
  else
    info "Cloning OpenPath…"
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi

  cd "$INSTALL_DIR"

  info "Installing dependencies (this compiles the SQLite binding once)…"
  pnpm install

  info "Building API + web app…"
  pnpm build

  echo
  bold "✅ OpenPath is ready!"
  echo
  cat <<'SUMMARY'
  Start it:
    cd openpath && pnpm start        # → http://localhost:8787
  (or develop with hot reload: pnpm dev → web on :5173, API on :8787)

  Demo accounts (seeded on first boot):
    🧑‍🏫 Teacher  ada.lovelace@openpath.dev   / teach1234
    🧑‍🎓 Student  grace.hopper@openpath.dev   / learn1234
    🧑‍🎓 Student  linus.torvalds@openpath.dev / learn1234
    🧑‍👧 Parent   mary.jackson@openpath.dev   / parent1234

  Everything lives in ./data/openpath.db on this machine.
  Docs: https://github.com/Markgatcha/openpath#-quickstart
SUMMARY
}

main "$@"
