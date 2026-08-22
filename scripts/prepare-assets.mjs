import fs from 'node:fs/promises'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

const root = process.cwd()

// GLTFExporter uses browser FileReader APIs. This small Node polyfill keeps asset
// generation cross-platform and runs automatically after npm install.
if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    result = null; onloadend = null; onerror = null
    readAsArrayBuffer(blob) { blob.arrayBuffer().then(v => { this.result = v; this.onloadend?.() }).catch(e => this.onerror?.(e)) }
    readAsDataURL(blob) { blob.arrayBuffer().then(v => { this.result = `data:${blob.type};base64,${Buffer.from(v).toString('base64')}`; this.onloadend?.() }).catch(e => this.onerror?.(e)) }
  }
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true })
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name), dst = path.join(to, entry.name)
    if (entry.isDirectory()) await copyDir(src, dst); else await fs.copyFile(src, dst)
  }
}

const dracoSource = path.join(root, 'node_modules/three/examples/jsm/libs/draco')
await copyDir(dracoSource, path.join(root, 'public/draco'))

const mat = color => new THREE.MeshStandardMaterial({ color, roughness: .72 })
const mesh = (geometry, color, position, scale = [1,1,1], rotation = [0,0,0]) => {
  const m = new THREE.Mesh(geometry, mat(color)); m.position.set(...position); m.scale.set(...scale); m.rotation.set(...rotation); return m
}

function skull() {
  const g = new THREE.Group(); g.name = 'Skull_placeholder'
  g.add(mesh(new THREE.SphereGeometry(.34, 40, 28), '#e8dfc8', [0, 3.08, 0], [1, 1.08, .9]))
  g.add(mesh(new THREE.SphereGeometry(.23, 32, 20), '#e8dfc8', [0, 2.87, .035], [.92,.7,.78]))
  g.add(mesh(new THREE.BoxGeometry(.27,.15,.22,3,2,2), '#e8dfc8', [0,2.72,.02], [1,1,1], [.08,0,0]))
  // subtle mastoid forms add a more anatomical silhouette
  g.add(mesh(new THREE.SphereGeometry(.07,18,12), '#e8dfc8', [-.27,2.88,0], [1,.8,.8]))
  g.add(mesh(new THREE.SphereGeometry(.07,18,12), '#e8dfc8', [.27,2.88,0], [1,.8,.8]))
  return g
}
function femur() {
  const g = new THREE.Group(); g.name = 'Left_femur_placeholder'
  const shaft = mesh(new THREE.CylinderGeometry(.075,.09,1.25,24), '#e4dac0', [-.20,.70,0], [1,1,1], [0,0,-.055]); g.add(shaft)
  g.add(mesh(new THREE.SphereGeometry(.14,28,18), '#e4dac0', [-.13,1.38,0], [1,1,.96]))
  g.add(mesh(new THREE.CylinderGeometry(.065,.07,.18,20), '#e4dac0', [-.20,1.27,0], [1,1,1], [0,0,-.5]))
  g.add(mesh(new THREE.SphereGeometry(.105,24,16), '#e4dac0', [-.28,.06,.02], [1,.75,1]))
  g.add(mesh(new THREE.SphereGeometry(.105,24,16), '#e4dac0', [-.12,.06,.02], [1,.75,1]))
  return g
}
function heart() {
  const g = new THREE.Group(); g.name='Heart_placeholder'
  g.add(mesh(new THREE.SphereGeometry(.24,36,24), '#a83e43', [0,1.94,.03], [1,.98,.82], [0,0,-.18]))
  g.add(mesh(new THREE.SphereGeometry(.20,32,22), '#a83e43', [.11,2.02,.01], [.9,.9,.78]))
  g.add(mesh(new THREE.ConeGeometry(.23,.48,36), '#a83e43', [-.015,1.72,.03], [1,1,.83], [0,0,.08]))
  g.add(mesh(new THREE.TorusGeometry(.105,.035,12,28,Math.PI*1.45), '#a83e43', [-.03,2.22,0], [1,1,1], [Math.PI/2,0,.5]))
  return g
}
function lung() {
  const g = new THREE.Group(); g.name='Right_lung_placeholder'
  g.add(mesh(new THREE.SphereGeometry(.28,36,26), '#cf7c78', [.28,2.08,0], [.72,1.35,.66], [0,0,-.06]))
  g.add(mesh(new THREE.SphereGeometry(.26,34,24), '#cf7c78', [.30,1.75,0], [.78,1.12,.7], [0,0,.04]))
  g.add(mesh(new THREE.CylinderGeometry(.035,.045,.42,16), '#cf7c78', [.08,2.29,0], [1,1,1], [0,0,-.35]))
  return g
}

async function exportGLB(group, relativePath) {
  const exporter = new GLTFExporter()
  const data = await exporter.parseAsync(group, { binary: true, onlyVisible: true })
  const file = path.join(root, 'public', relativePath)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, Buffer.from(data))
  console.log(`created ${relativePath}`)
}

await Promise.all([
  exportGLB(skull(), 'models/skeletal/skull.glb'),
  exportGLB(femur(), 'models/skeletal/left_femur.glb'),
  exportGLB(heart(), 'models/circulatory/heart.glb'),
  exportGLB(lung(), 'models/respiratory/right_lung.glb')
])
console.log('Anatomy placeholder assets and Draco decoders are ready.')
