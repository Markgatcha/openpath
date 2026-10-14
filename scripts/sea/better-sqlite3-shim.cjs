'use strict'
// esbuild --alias shim for require('better-sqlite3') inside app.cjs.
//
// The sidecar payload ships the better-sqlite3 *runtime subset* (package.json,
// lib/, prebuilds/<platform>-<arch>.node) under <resource>/app/better-sqlite3.
// The Rust shell passes OPENPATH_NATIVE_DIR=<resource>/app at spawn time.
// lib/binding.js auto-loads the matching prebuild by process.platform/arch —
// N-API, so it is ABI-stable across Node versions.

const path = require('node:path')

function loadFrom(dir) {
  const pkg = path.join(dir, 'better-sqlite3', 'package.json')
  const main = require(pkg).main || 'lib/index.js'
  return require(path.join(dir, 'better-sqlite3', main))
}

let dir
try {
  dir = process.env.OPENPATH_NATIVE_DIR || path.dirname(process.execPath)
  module.exports = loadFrom(dir)
} catch {
  // Dev fallback: load from the repo's node_modules (pnpm symlink farm).
  const repoRoot = path.resolve(__dirname, '..', '..', '..')
  module.exports = createRequireLike(repoRoot)
}

function createRequireLike(root) {
  const { createRequire } = require('node:module')
  return createRequire(path.join(root, 'package.json'))('better-sqlite3')
}
