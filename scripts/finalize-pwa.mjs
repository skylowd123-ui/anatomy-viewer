import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const templatePath = path.join(root, 'public/sw.js')

async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name)
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(fullPath, relative))
    else if ((await stat(fullPath)).isFile()) files.push(relative)
  }
  return files
}

const files = (await walk(distDir)).sort()
const precacheFiles = files.filter(file => file !== 'sw.js' && !file.startsWith('models/'))
const precacheUrls = [
  './',
  ...precacheFiles.map(file => `./${file}`)
]
const uniqueUrls = [...new Set(precacheUrls)]

const revision = createHash('sha256')
for (const file of precacheFiles) {
  revision.update(file)
  revision.update(await readFile(path.join(distDir, file)))
}
const cacheVersion = `v${revision.digest('hex').slice(0, 12)}`

let serviceWorker = await readFile(templatePath, 'utf8')
serviceWorker = serviceWorker.replace(
  "const CACHE_VERSION = '__PWA_CACHE_VERSION__'",
  `const CACHE_VERSION = '${cacheVersion}'`
)

const marker = '  /* __PWA_PRECACHE_ENTRIES__ */'
const entries = uniqueUrls
  .filter(url => ![
    './',
    './index.html',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-512-maskable.png',
    './icons/apple-touch-icon.png'
  ].includes(url))
  .map(url => `  ${JSON.stringify(url)},`)
  .join('\n')
if (!serviceWorker.includes(marker)) throw new Error('PWA precache marker is missing from public/sw.js')
serviceWorker = serviceWorker.replace(marker, entries)
if (serviceWorker.includes('__PWA_')) throw new Error('PWA build placeholders were not fully replaced')

await writeFile(path.join(distDir, 'sw.js'), `${serviceWorker.trimEnd()}\n`)
console.log(`Finalized PWA service worker (${uniqueUrls.length} precached URLs, ${cacheVersion}).`)
