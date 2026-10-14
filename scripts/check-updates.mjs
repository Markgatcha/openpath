#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-updates.mjs — detect stale versions and tell the human to update.
//
// Reports, for this repo:
//   * Node: the version you're running vs the latest nodejs.org release line
//     vs what the CI workflows pin
//   * pnpm: installed vs latest on npm
//   * every dependency/devDependency: installed (node_modules) vs latest on npm
//
// Usage:
//   node scripts/check-updates.mjs           # human-readable report
//   node scripts/check-updates.mjs --quiet   # exit code only (for CI)
//
// Exit code 0 = everything current, 1 = at least one item is stale.
// Runs on any Node >= 20 (global fetch), zero dependencies.
// The scheduled .github/workflows/version-check.yml uses this to open an
// issue when something drifts — so "update me" is automatic, not manual.
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const quiet = process.argv.includes('--quiet')

const C = process.stdout.isTTY ? {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
} : { red: (s) => s, green: (s) => s, yellow: (s) => s, dim: (s) => s, bold: (s) => s }

function loadJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function installedVersion(pkg) {
  for (const dir of [path.join(repoRoot, 'node_modules'), path.join(repoRoot, 'node_modules', '.pnpm')]) {
    const p = path.join(dir, pkg, 'package.json')
    if (fs.existsSync(p)) return loadJSON(p)?.version ?? null
  }
  // pnpm store layout: .pnpm/<pkg>@<ver>/node_modules/<pkg>
  const pnpmDir = path.join(repoRoot, 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmDir)) {
    const hit = fs.readdirSync(pnpmDir).find((d) => d.startsWith(`${pkg.replace('/', '+')}@`))
    if (hit) return hit.slice(hit.lastIndexOf('@') + 1)
  }
  return null
}

async function latestVersion(pkg, attempt = 0) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()).version ?? null
  } catch {
    // The registry occasionally rate-limits bursts — back off and retry
    // twice so a transient 429 never masquerades as "no update available".
    if (attempt >= 2) return null
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    return latestVersion(pkg, attempt + 1)
  }
}

async function latestNode(attempt = 0) {
  try {
    const res = await fetch('https://nodejs.org/dist/index.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data[0]?.version?.replace(/^v/, '') ?? null
  } catch {
    if (attempt >= 2) return null
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    return latestNode(attempt + 1)
  }
}

// Map with a concurrency cap so we never hammer the registry.
async function mapLimit(items, limit, fn) {
  const out = []
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx], idx)
      }
    }),
  )
  return out
}

function pnpmVersion() {
  const attempts =
    process.platform === 'win32'
      ? [
          { cmd: 'pnpm.cmd', args: ['--version'], shell: true },
          { cmd: 'pnpm', args: ['--version'], shell: false },
        ]
      : [{ cmd: 'pnpm', args: ['--version'], shell: false }]
  for (const { cmd, args, shell } of attempts) {
    try {
      return execFileSync(cmd, args, { stdio: 'pipe', shell }).toString().trim()
    } catch { /* try next candidate */ }
  }
  return null
}

function ciNodeVersion() {
  const out = []
  for (const wf of ['ci.yml', 'release-desktop.yml', 'version-check.yml']) {
    const p = path.join(repoRoot, '.github', 'workflows', wf)
    if (!fs.existsSync(p)) continue
    const m = fs.readFileSync(p, 'utf8').match(/node-version:\s*['"]?([^'"\n]+)/)
    if (m) out.push(`${wf}: ${m[1].trim()}`)
  }
  return out
}

const rows = []
const stale = []

// ---- Node ------------------------------------------------------------------
const nodeLatest = await latestNode()
const nodeRunning = process.version.replace(/^v/, '')
const ciPins = ciNodeVersion()
const nodeStale = nodeLatest && nodeRunning !== nodeLatest
rows.push({
  group: 'node',
  name: 'node',
  installed: nodeRunning,
  latest: nodeLatest ?? '?',
  note: ciPins.length ? `CI pins: ${ciPins.join(', ')}` : '',
  stale: Boolean(nodeStale),
})
if (nodeStale) stale.push(`node ${nodeRunning} -> ${nodeLatest}`)

// ---- pnpm -------------------------------------------------------------------
const pnpmInstalled = pnpmVersion()
const pnpmLatest = await latestVersion('pnpm')
const pnpmStale = Boolean(pnpmInstalled && pnpmLatest && pnpmInstalled !== pnpmLatest)
rows.push({
  group: 'pnpm',
  name: 'pnpm',
  installed: pnpmInstalled ?? 'not on PATH',
  latest: pnpmLatest ?? '?',
  note: 'CI: pnpm/action-setup in the workflows',
  stale: pnpmStale,
})
if (pnpmStale) stale.push(`pnpm ${pnpmInstalled} -> ${pnpmLatest}`)

// ---- dependencies -----------------------------------------------------------
const pkg = loadJSON(path.join(repoRoot, 'package.json'))
if (!pkg) {
  console.error('package.json not found — run this from the repo root')
  process.exit(2)
}

const depEntries = []
for (const group of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(pkg[group] ?? {})) {
    depEntries.push({ group, name, range })
  }
}

const resolved = await mapLimit(depEntries, 6, async ({ group, name, range }) => {
  const [installed, latest] = await Promise.all([Promise.resolve(installedVersion(name)), latestVersion(name)])
  return { group, name, range, installed, latest }
})

for (const { group, name, range, installed, latest } of resolved) {
  const isStale = Boolean(installed && latest && installed !== latest)
  rows.push({
    group,
    name,
    installed: installed ?? `(not installed, range ${range})`,
    latest: latest ?? '?',
    note: `range ${range}`,
    stale: isStale,
  })
  if (isStale) stale.push(`${name} ${installed} -> ${latest}`)
}

// ---- report -----------------------------------------------------------------
if (!quiet) {
  const maxName = Math.max(...rows.map((r) => r.name.length))
  const maxInst = Math.max(...rows.map((r) => String(r.installed).length))
  for (const r of rows) {
    const tag = r.stale ? C.red('STALE') : C.green('  ok ')
    const line = `${tag} ${C.bold(r.name.padEnd(maxName))}  ${String(r.installed).padEnd(maxInst)}  ->  ${r.latest.padEnd(10)} ${C.dim(r.note)}`
    console.log(line)
  }
  if (stale.length) {
    console.log(`\n${C.bold(String(stale.length))} of ${rows.length} items are behind the latest release:`)
    for (const s of stale) console.log(C.yellow('  •'), s)
    console.log(`\nUpdate everything:  ${C.bold('pnpm up --latest && pnpm install')}`)
    console.log(`Then verify:        ${C.bold('pnpm typecheck && pnpm lint && pnpm build')}`)
  } else {
    console.log(`\n${C.green('Everything is on the latest version.')}`)
  }
}

process.exit(stale.length ? 1 : 0)
