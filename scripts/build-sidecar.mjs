#!/usr/bin/env node
// Builds the OpenPath desktop sidecar payload WITHOUT touching package.json /
// the pnpm lockfile (so `pnpm install --frozen-lockfile` in CI keeps working).
//
// Produces (all gitignored; built fresh by CI and by local `pnpm sidecar`):
//   src-tauri/binaries/server-<triple>[.exe]   renamed Node LTS runtime
//   src-tauri/native/app/openpath/server/app.cjs  esbuild bundle of dist/server
//   src-tauri/native/app/dist/web/**           built SPA (server serves it)
//   src-tauri/native/app/better-sqlite3/**     runtime subset of the package
//
// Why a renamed Node runtime instead of `node --build-sea` or pkg:
//   * identical size (~the Node binary is the payload either way),
//   * no postject/Mach-O surgery — avoids the Tauri notarization bug (tauri#11992),
//   * better-sqlite3 v13 ships N-API prebuilds (ABI-stable), so any Node LTS works.
// Why not Bun: incomplete N-API (oven-sh/bun#19578) can break better-sqlite3.
//
// Usage:
//   node scripts/build-sidecar.mjs [--target <rust-triple>]
// (defaults to the host triple; CI passes the matrix target explicitly)

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const tauriDir = path.join(repoRoot, 'src-tauri')

const HOST_TRIPLES = {
  'x86_64-unknown-linux-gnu': 'linux-x64',
  'aarch64-unknown-linux-gnu': 'linux-arm64',
  'x86_64-pc-windows-msvc': 'win32-x64',
  'aarch64-pc-windows-msvc': 'win32-arm64',
  'x86_64-apple-darwin': 'darwin-x64',
  'aarch64-apple-darwin': 'darwin-arm64',
}
const triple = (() => {
  const i = process.argv.indexOf('--target')
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1]
  if (process.platform === 'win32') return 'x86_64-pc-windows-msvc'
  if (process.platform === 'darwin') return 'aarch64-apple-darwin'
  return 'x86_64-unknown-linux-gnu'
})()
const prebuildTag = HOST_TRIPLES[triple]
if (!prebuildTag) {
  console.error(`Unknown target triple: ${triple}`)
  process.exit(1)
}

const log = (...args) => console.log('[sidecar]', ...args)

// esbuild from PATH, or fetch on demand (npm i -g esbuild / npx --yes esbuild).
function resolveTool(name) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'pipe' })
    return name
  } catch {
    return null
  }
}
const esbuildBin = resolveTool('esbuild')

log(`target=${triple} node=${process.version} (${process.execPath})`)

// ---- 1. Bundle the server (CJS, single file, node builtins external) -------
const serverEntry = path.join(repoRoot, 'dist', 'server', 'index.js')
if (!fs.existsSync(serverEntry)) {
  console.error('dist/server/index.js not found — run `pnpm build` first.')
  process.exit(1)
}
const nativeApp = path.join(tauriDir, 'native', 'app')
// NOTE the 'openpath' nesting level: server/index.ts resolves the built SPA via
// path.join(__dirname, '..', '..', 'dist', 'web'), so the bundle must sit two
// levels below the folder that contains dist/web. Layout on disk:
//   native/app/openpath/server/app.cjs   <- __dirname = .../openpath/server
//   native/app/dist/web/**               <- ../../dist/web resolves here
const outCjs = path.join(nativeApp, 'openpath', 'server', 'app.cjs')
fs.mkdirSync(path.dirname(outCjs), { recursive: true })

// esbuild CLI resolution: prefer PATH, else fetch on demand (CI installs it globally).
const esbuildCmd = esbuildBin || (process.platform === 'win32' ? 'npx.cmd' : 'npx')
const esbuildPrefix = esbuildBin ? [] : ['--yes', 'esbuild@latest']
const esbuildArgs = [
  ...esbuildPrefix,
  serverEntry,
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--target=node26',
  `--alias:better-sqlite3=${path.join(repoRoot, 'scripts', 'sea', 'better-sqlite3-shim.cjs')}`,
  `--outfile=${outCjs}`,
  '--log-level=warning',
]
log('bundling server with esbuild…')
if (process.platform === 'win32') {
  // Windows needs a shell to spawn .cmd shims (esbuild/npx), and Node 26
  // deprecates args+shell together — so join into one quoted command line.
  const quote = (s) => (s.includes(' ') ? `"${s.replace(/"/g, '\\"')}"` : s)
  execFileSync([esbuildCmd, ...esbuildArgs].map(quote).join(' '), {
    stdio: 'inherit',
    cwd: repoRoot,
    shell: true,
  })
} else {
  execFileSync(esbuildCmd, esbuildArgs, { stdio: 'inherit', cwd: repoRoot })
}

// ---- copy helpers: overwrite, never delete --------------------------------
// fs.cpSync() unlinks each destination file before overwriting it, and some
// sandboxed environments intercept every unlink (routing it to a trash binary
// that then fails), which surfaces as a bogus EIO. copyFileSync truncates in
// place instead — same result, no unlink syscall. Nothing here deletes old
// files: stale files are left for the caller to wipe by hand after a target
// platform switch (CI always starts from a fresh checkout anyway).
function copyFileFresh(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}
function copyTreeFresh(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name)
    const d = path.join(destDir, entry.name)
    if (entry.isDirectory()) copyTreeFresh(s, d)
    else copyFileFresh(s, d)
  }
}

// ---- 2. Built SPA (server serves it from <bundle>/../../dist/web) ----------
const webSrc = path.join(repoRoot, 'dist', 'web')
if (!fs.existsSync(webSrc)) {
  console.error('dist/web not found — run `pnpm build` first.')
  process.exit(1)
}
copyTreeFresh(webSrc, path.join(nativeApp, 'dist', 'web'))

// ---- 3. better-sqlite3 runtime subset (package.json + lib + one prebuild) ---
// Version- and platform-gated: re-copied only when the installed version or
// the target triple changed, so rebuilds are stable no-op copies.
const pkgReal = fs.realpathSync(path.join(repoRoot, 'node_modules', 'better-sqlite3'))
const nativeDest = path.join(nativeApp, 'better-sqlite3')
const srcVersion = JSON.parse(
  fs.readFileSync(path.join(pkgReal, 'package.json'), 'utf8'),
).version
const destPkg = path.join(nativeDest, 'package.json')
const destVersion = fs.existsSync(destPkg)
  ? JSON.parse(fs.readFileSync(destPkg, 'utf8')).version
  : null
const destPrebuild = path.join(nativeDest, 'prebuilds', `${prebuildTag}.node`)
if (destVersion === srcVersion && fs.existsSync(destPrebuild)) {
  log(`sqlite    ${srcVersion} cached (${prebuildTag})`)
} else {
  copyFileFresh(path.join(pkgReal, 'package.json'), destPkg)
  copyTreeFresh(path.join(pkgReal, 'lib'), path.join(nativeDest, 'lib'))
  copyFileFresh(path.join(pkgReal, 'prebuilds', `${prebuildTag}.node`), destPrebuild)
  log(`sqlite    ${srcVersion} -> ${prebuildTag}`)
}

// ---- 4. The sidecar itself: the Node runtime, renamed per Tauri convention --
const binariesDir = path.join(tauriDir, 'binaries')
fs.mkdirSync(binariesDir, { recursive: true })
const exe = triple.includes('windows') ? '.exe' : ''
const sidecarPath = path.join(binariesDir, `server-${triple}${exe}`)
fs.copyFileSync(process.execPath, sidecarPath)
if (process.platform !== 'win32') fs.chmodSync(sidecarPath, 0o755)

// ---- 5. Report sizes (feeds the release-storage metrics) -------------------
const mb = (p) => (fs.existsSync(p) ? (dirSize(p) / 1e6).toFixed(1) + ' MB' : '—')
function dirSize(p) {
  const st = fs.statSync(p)
  if (!st.isDirectory()) return st.size
  return fs.readdirSync(p).reduce((n, f) => n + dirSize(path.join(p, f)), 0)
}
log(`sidecar   ${sidecarPath}  ${mb(sidecarPath)}`)
log(`bundle    ${outCjs}  ${mb(outCjs)}`)
log(`web       ${mb(path.join(nativeApp, 'dist', 'web'))}`)
log(`sqlite    ${mb(nativeDest)}`)
log(`TOTAL payload ≈ ${(dirSize(nativeApp) / 1e6).toFixed(1)} MB (+ shell 3-10 MB, minus installer compression)`)
log('done.')
