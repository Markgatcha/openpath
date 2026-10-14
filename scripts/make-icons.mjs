#!/usr/bin/env node
// Zero-dependency icon generator for the Tauri shell.
// Draws the OpenPath mark (indigo rounded square + compass needle) and writes
// PNG / ICO / ICNS — no ImageMagick, no `tauri icon` download, nothing added to
// package.json. Re-run any time you want to tweak the mark.
//
//   node scripts/make-icons.mjs
//
// Outputs into src-tauri/icons/: 32x32.png, 128x128.png, 128x128@2x.png,
// icon.ico (16/32/48/256), icon.icns (128/256/512/1024).

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const outDir = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '..',
  'src-tauri',
  'icons',
)
fs.mkdirSync(outDir, { recursive: true })

// ---------------------------------------------------------------- PNG -------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
const encodePNG = (size, rgba) => {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// -------------------------------------------------------------- drawing -----
// Rounded-square indigo→violet gradient, compass needle (amber north half,
// white south half) with a soft hub. All analytic — no canvas needed.
const draw = (size) => {
  const rgba = Buffer.alloc(size * size * 4)
  const c = (size - 1) / 2
  const radius = size * 0.22
  const put = (x, y, r, g, b, a) => {
    const i = (y * size + x) * 4
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
    rgba[i + 3] = a
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // rounded-square alpha
      const dx = Math.abs(x - c) - (c - radius)
      const dy = Math.abs(y - c) - (c - radius)
      const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - radius
      const inSquare = Math.max(dx, dy) <= 0
      const edge = Math.max(0, Math.min(1, 0.5 - outside * (inSquare ? 1 : 1)))
      if (outside > 0.5 && !inSquare) { put(x, y, 0, 0, 0, 0); continue }
      const t = (x + y) / (2 * size) // diagonal gradient
      let r = Math.round(76 + t * 58), g = Math.round(58 + t * 34), b = Math.round(178 + t * 62)
      // needle: rotate the pixel by -45°, test a thin rhombus along the y' axis
      const px = (x - c) / c, py = (y - c) / c
      const ca = Math.SQRT1_2
      const u = px * ca + py * ca // along the needle
      const v = -px * ca + py * ca // across the needle
      const needle =
        Math.abs(u) < 0.62 && Math.abs(v) < 0.2 - Math.abs(u) * 0.18
      const hub = Math.hypot(px, py) < 0.1
      const ring = Math.abs(Math.hypot(px, py) - 0.62) < 0.03 && Math.abs(v) < 0.06 && u > 0
      if (needle || ring) {
        if (u < 0) { r = 235; g = 176; b = 68 }        // north: amber
        else { r = 244; g = 244; b = 250 }             // south: near-white
      }
      if (hub) { r = 24; g = 22; b = 46 }
      put(x, y, r, g, b, Math.round(255 * edge))
    }
  }
  return rgba
}

const write = (name, buf) => {
  fs.writeFileSync(path.join(outDir, name), buf)
  console.log(`✓ icons/${name} (${(buf.length / 1024).toFixed(1)} KB)`)
}

const png = (size) => encodePNG(size, draw(size))

write('32x32.png', png(32))
write('128x128.png', png(128))
write('128x128@2x.png', png(256))

// ---------------------------------------------------------------- ICO -------
const icoSizes = [16, 32, 48, 256]
const icoImages = icoSizes.map(png)
const ico = Buffer.concat([
  (() => {
    const h = Buffer.alloc(6)
    h.writeUInt16LE(0, 0)
    h.writeUInt16LE(1, 2)
    h.writeUInt16LE(icoImages.length, 4)
    return h
  })(),
  Buffer.concat(
    icoImages.map((img, i) => {
      const e = Buffer.alloc(16)
      e[0] = icoSizes[i] === 256 ? 0 : icoSizes[i]
      e[1] = icoSizes[i] === 256 ? 0 : icoSizes[i]
      e[2] = 0
      e[3] = 0
      e.writeUInt16LE(1, 4)
      e.writeUInt16LE(32, 6)
      e.writeUInt32BE(img.length, 8)
      e.writeUInt32BE(6 + 16 * icoImages.length, 12) // patched below
      return e
    }),
  ),
  ...icoImages,
])
// fix image offsets (after the header + dir entries)
let offset = 6 + 16 * icoImages.length
icoImages.forEach((img, i) => {
  ico.writeUInt32BE(offset, 6 + i * 16 + 12)
  offset += img.length
})
write('icon.ico', ico)

// ---------------------------------------------------------------- ICNS ------
const icnsTypes = [
  ['ic07', 128],
  ['ic08', 256],
  ['ic09', 512],
  ['ic10', 1024],
]
const entries = icnsTypes.map(([type, size]) => {
  const img = png(size)
  const h = Buffer.alloc(8)
  h.write(type, 0, 'ascii')
  h.writeUInt32BE(img.length + 8, 4)
  return Buffer.concat([h, img])
})
const total = 8 + entries.reduce((n, e) => n + e.length, 0)
const header = Buffer.alloc(8)
header.write('icns', 0, 'ascii')
header.writeUInt32BE(total, 4)
write('icon.icns', Buffer.concat([header, ...entries]))

console.log('Icons regenerated. (Re-run after brand tweaks; they are committed.)')
