import { mkdir, writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'
import path from 'node:path'

const root = process.cwd()
const outputDir = path.join(root, 'public/icons')

// The icons are deliberately generated without a binary image dependency so
// `npm ci` and CI can reproduce them on any Node-supported platform. The mark
// echoes the viewer's activity/atlas branding and keeps the artwork inside the
// maskable safe zone.
const colors = {
  background: [17, 21, 20, 255],
  border: [211, 178, 116, 255],
  ivory: [244, 234, 210, 255],
  red: [200, 76, 87, 255]
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const payload = Buffer.concat([typeBuffer, data])
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(payload), 0)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  return Buffer.concat([length, payload, checksum])
}

function makePng(size, maskable) {
  const pixels = new Uint8Array(size * size * 4)
  const put = (x, y, color) => {
    const pixelX = Math.round(x), pixelY = Math.round(y)
    if (pixelX < 0 || pixelY < 0 || pixelX >= size || pixelY >= size) return
    const offset = (pixelY * size + pixelX) * 4
    pixels.set(color, offset)
  }
  const fill = color => {
    for (let offset = 0; offset < pixels.length; offset += 4) pixels.set(color, offset)
  }
  const line = (x1, y1, x2, y2, width, color) => {
    const minX = Math.floor(Math.min(x1, x2) - width), maxX = Math.ceil(Math.max(x1, x2) + width)
    const minY = Math.floor(Math.min(y1, y2) - width), maxY = Math.ceil(Math.max(y1, y2) + width)
    const dx = x2 - x1, dy = y2 - y1, lengthSquared = dx * dx + dy * dy
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared))
        const px = x1 + t * dx, py = y1 + t * dy
        if ((x - px) ** 2 + (y - py) ** 2 <= width ** 2) put(x, y, color)
      }
    }
  }
  const circle = (cx, cy, radius, color) => {
    const min = Math.floor(cx - radius), max = Math.ceil(cx + radius)
    for (let y = min; y <= max; y += 1) {
      for (let x = min; x <= max; x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) put(x, y, color)
      }
    }
  }
  const roundedRectStroke = (inset, radius, width, color) => {
    const distance = (x, y, left, top, right, bottom, cornerRadius) => {
      const halfWidth = (right - left) / 2
      const halfHeight = (bottom - top) / 2
      const qx = Math.abs(x - (left + right) / 2) - halfWidth + cornerRadius
      const qy = Math.abs(y - (top + bottom) / 2) - halfHeight + cornerRadius
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cornerRadius
    }
    const outerInset = inset - width / 2
    const innerInset = inset + width / 2
    const outerRadius = radius + width / 2
    const innerRadius = Math.max(0, radius - width / 2)
    for (let y = outerInset - width; y <= size - outerInset + width; y += 1) {
      for (let x = outerInset - width; x <= size - outerInset + width; x += 1) {
        const outerDistance = distance(x, y, outerInset, outerInset, size - outerInset, size - outerInset, outerRadius)
        const innerDistance = distance(x, y, innerInset, innerInset, size - innerInset, size - innerInset, innerRadius)
        if (outerDistance <= 0 && innerDistance >= 0) put(x, y, color)
      }
    }
  }

  fill(colors.background)
  const scale = size / 512
  const inset = (maskable ? 64 : 30) * scale
  roundedRectStroke(inset, 57 * scale, 8 * scale, colors.border)

  // A small head and a simplified rib/spine silhouette make the icon read as
  // anatomy at launcher size without relying on text that can be cropped.
  circle(256 * scale, 145 * scale, 39 * scale, colors.ivory)
  line(256 * scale, 194 * scale, 256 * scale, 365 * scale, 9 * scale, colors.ivory)
  line(256 * scale, 224 * scale, 193 * scale, 266 * scale, 8 * scale, colors.ivory)
  line(256 * scale, 224 * scale, 319 * scale, 266 * scale, 8 * scale, colors.ivory)
  line(256 * scale, 276 * scale, 199 * scale, 315 * scale, 7 * scale, colors.ivory)
  line(256 * scale, 276 * scale, 313 * scale, 315 * scale, 7 * scale, colors.ivory)
  line(256 * scale, 360 * scale, 211 * scale, 424 * scale, 9 * scale, colors.ivory)
  line(256 * scale, 360 * scale, 301 * scale, 424 * scale, 9 * scale, colors.ivory)
  circle(256 * scale, 256 * scale, 13 * scale, colors.red)
  line(227 * scale, 257 * scale, 243 * scale, 257 * scale, 5 * scale, colors.red)
  line(269 * scale, 257 * scale, 285 * scale, 257 * scale, 5 * scale, colors.red)

  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    Buffer.from(pixels.buffer, pixels.byteOffset + y * size * 4, size * 4).copy(raw, rowStart + 1)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // RGBA, eight bits per channel
  header[9] = 6
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

await mkdir(outputDir, { recursive: true })
await Promise.all([
  writeFile(path.join(outputDir, 'icon-192.png'), makePng(192, false)),
  writeFile(path.join(outputDir, 'icon-512.png'), makePng(512, false)),
  writeFile(path.join(outputDir, 'icon-512-maskable.png'), makePng(512, true)),
  writeFile(path.join(outputDir, 'apple-touch-icon.png'), makePng(180, false))
])
console.log('Generated ANATOMICA PWA icons (180, 192, and 512px).')
