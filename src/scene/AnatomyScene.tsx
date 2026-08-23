import { Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { ComponentProps, useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { LayerState, LoadState, Structure } from '../types'

interface Props {
  structures: Structure[]
  layers: LayerState
  selectedId: string | null
  showNames: boolean
  isolateId: string | null
  searchMatches: string[]
  focusRequest: { id: string | null; nonce: number }
  onSelect: (id: string | null) => void
  onLoadState: (state: LoadState) => void
}

const assetBase = import.meta.env.BASE_URL
const resolveAsset = (path: string) => `${assetBase}${path.replace(/^\//, '')}`
const draco = new DRACOLoader().setDecoderPath(resolveAsset('/draco/'))
const loader = new GLTFLoader().setDRACOLoader(draco)
const modelCache = new Map<string, Promise<THREE.Group>>()

type LoadPhase = 'loading' | 'ready' | 'failed'
type LoadReport = { id: string; generation: number; phase: LoadPhase }

function loadModel(path: string) {
  const url = resolveAsset(path)
  let request = modelCache.get(url)
  if (!request) {
    request = new Promise((resolve, reject) => loader.load(url, gltf => resolve(gltf.scene), undefined, reject))
    modelCache.set(url, request)
    // A transient failure must not poison the page-lifetime cache. A later
    // mount can start a fresh request while successful decoded scenes remain cached.
    void request.catch(() => {
      if (modelCache.get(url) === request) modelCache.delete(url)
    })
  }
  return request
}

function StructureModel({ item, opacity, selected, matched, showLabel, generation, onSelect, onLoadReport }: {
  item: Structure; opacity: number; selected: boolean; matched: boolean; showLabel: boolean; generation: number
  onSelect: (id: string) => void; onLoadReport: (report: LoadReport) => void
}) {
  const group = useRef<THREE.Group>(null)
  const phase = useRef<LoadPhase>('loading')
  const generationRef = useRef(generation)
  generationRef.current = generation
  const [object, setObject] = useState<THREE.Group | null>(null)
  const [labelPoint, setLabelPoint] = useState<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    let live = true
    phase.current = 'loading'
    setObject(null)
    onLoadReport({ id: item.id, generation: generationRef.current, phase: 'loading' })
    loadModel(item.filePath).then(source => {
      if (!live) return
      const clone = source.clone(true)
      clone.traverse(child => {
        if (child instanceof THREE.Mesh) {
          // Object3D.clone intentionally shares immutable BufferGeometry with
          // the cached source. Materials remain independent because selection,
          // highlighting and opacity mutate them per mounted structure.
          child.material = Array.isArray(child.material)
            ? child.material.map(material => material.clone())
            : child.material.clone()
          child.castShadow = true; child.receiveShadow = true
        }
      })
      const bounds = new THREE.Box3().setFromObject(clone)
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      setLabelPoint([center.x, center.y + size.y * .18, center.z])
      setObject(clone)
    }).catch(err => {
      if (!live) return
      phase.current = 'failed'
      onLoadReport({ id: item.id, generation: generationRef.current, phase: 'failed' })
      console.error(`Could not load ${item.filePath}`, err)
    })
    return () => { live = false }
  }, [item.filePath, item.id, onLoadReport])

  // Report ready only after React has committed the replacement clone. Reusing
  // a cached source therefore cannot make progress complete before it is shown.
  useEffect(() => {
    if (!object) return
    phase.current = 'ready'
    onLoadReport({ id: item.id, generation, phase: 'ready' })
  }, [object, item.id, generation, onLoadReport])

  // Structures that stay mounted across a visible-set change register their
  // actual current phase in the new generation without loading or cloning again.
  useEffect(() => {
    onLoadReport({ id: item.id, generation, phase: phase.current })
  }, [item.id, generation, onLoadReport])

  useEffect(() => {
    object?.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach(material => {
        // Opacity only participates in Three.js blending when transparent is
        // enabled. Keep it enabled even at 100% so moving a layer slider does
        // not require changing the material's render-program classification.
        material.transparent = true
        material.opacity = THREE.MathUtils.clamp(opacity, 0, 1)
        material.depthWrite = opacity >= .98
        material.needsUpdate = true

        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.set(item.defaultColor)
          material.roughness = selected ? .35 : .7
          material.metalness = 0
          material.emissive.set(selected ? '#d9a865' : matched ? '#447c73' : '#000000')
          material.emissiveIntensity = selected ? .45 : matched ? .32 : 0
        }
      })
    })
  }, [object, opacity, selected, matched, item.defaultColor])

  if (!object) return null
  const click = (e: ThreeEvent<PointerEvent>) => {
    if (!(e.object instanceof THREE.Mesh)) return
    e.stopPropagation(); onSelect(item.id)
  }
  return <group ref={group} name={`structure:${item.id}`} onPointerDown={click}>
    <primitive object={object} />
    {showLabel && <group position={labelPoint}>
      <Line points={[[0, 0, 0], [.28, .22, 0]]} color="#d7b77b" lineWidth={1} transparent opacity={.85} />
      <Html position={[.28, .22, 0]} center distanceFactor={7} zIndexRange={[20, 0]}>
        <div className="anatomy-label"><span />{item.displayName}</div>
      </Html>
    </group>}
  </group>
}

function CameraController({ request, readyVersion }: { request: Props['focusRequest']; readyVersion: number }) {
  const { camera, scene } = useThree()
  const controls = useRef<any>(null)
  const destination = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)

  useEffect(() => {
    if (!controls.current) return
    if (!request.id) {
      destination.current = { position: new THREE.Vector3(4.5, 2.35, 7.2), target: new THREE.Vector3(0, 1.55, 0) }
      return
    }
    const object = scene.getObjectByName(`structure:${request.id}`)
    if (!object) return
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z, .25)
    const direction = camera.position.clone().sub(controls.current.target).normalize()
    destination.current = { position: center.clone().add(direction.multiplyScalar(Math.max(radius * 3.2, 1.2))), target: center }
  }, [request, readyVersion, camera, scene])

  useFrame(() => {
    if (!destination.current || !controls.current) return
    camera.position.lerp(destination.current.position, .075)
    controls.current.target.lerp(destination.current.target, .09)
    controls.current.update()
    if (camera.position.distanceTo(destination.current.position) < .015) destination.current = null
  })

  return <OrbitControls ref={controls} makeDefault target={[0, 1.55, 0]} enableDamping dampingFactor={.07}
    minDistance={.7} maxDistance={14} minPolarAngle={.12} maxPolarAngle={Math.PI - .12}
    touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} />
}

function SceneContents(props: Props) {
  const [statusVersion, setStatusVersion] = useState(0)
  // At exactly zero opacity, omit the structure from the scene graph rather
  // than merely drawing a transparent material. This guarantees that fully
  // hidden layers cannot participate in raycasting or affect depth/blending.
  const visible = props.structures.filter(item =>
    props.layers[item.system].visible &&
    props.layers[item.system].opacity * item.defaultOpacity > 0 &&
    (!props.isolateId || props.isolateId === item.id)
  )
  const visibleKey = visible.map(item => item.id).join('|')
  const tracking = useRef<{ key: string; generation: number; statuses: Map<string, LoadPhase> }>({
    key: visibleKey, generation: 0, statuses: new Map()
  })
  const queuedReports = useRef<LoadReport[]>([])
  const reportFrame = useRef<number | null>(null)

  // Start every changed visible set with a unique generation and fresh status.
  // Still-mounted children re-register their phase; newly mounted children
  // register loading. The monotonic ID rejects late reports if a set is hidden
  // and then restored before its previous frame-batch has flushed.
  if (tracking.current.key !== visibleKey) {
    tracking.current = {
      key: visibleKey,
      generation: tracking.current.generation + 1,
      statuses: new Map()
    }
  }
  const generation = tracking.current.generation

  const reportLoad = useCallback((report: LoadReport) => {
    queuedReports.current.push(report)
    if (reportFrame.current !== null) return
    reportFrame.current = requestAnimationFrame(() => {
      reportFrame.current = null
      const reports = queuedReports.current
      queuedReports.current = []
      let changed = false
      for (const next of reports) {
        if (next.generation !== tracking.current.generation) continue
        if (tracking.current.statuses.get(next.id) === next.phase) continue
        tracking.current.statuses.set(next.id, next.phase)
        changed = true
      }
      if (changed) setStatusVersion(version => version + 1)
    })
  }, [])

  useEffect(() => () => {
    if (reportFrame.current !== null) cancelAnimationFrame(reportFrame.current)
    reportFrame.current = null
    queuedReports.current = []
  }, [])

  useEffect(() => {
    const statuses = tracking.current.statuses
    const loaded = visible.filter(item => statuses.get(item.id) === 'ready').length
    const failed = visible.filter(item => statuses.get(item.id) === 'failed').length
    const total = visible.length
    props.onLoadState({ loaded, failed, total, active: total > 0 && loaded + failed < total })
  }, [generation, statusVersion, props.onLoadState])

  return <>
    <color attach="background" args={['#111514']} />
    <fog attach="fog" args={['#111514', 8, 18]} />
    <ambientLight intensity={.72} />
    <hemisphereLight args={['#d9eee7', '#322b27', 1.25]} />
    <directionalLight position={[4, 6, 5]} intensity={2.2} color="#fff4dc" castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[-4, 3, 2]} intensity={1.3} color="#7aa89e" />
    <spotLight position={[0, 5, -4]} intensity={1.5} color="#d9c5ae" angle={.55} penumbra={1} />

    <group>
      {visible.map(item => <StructureModel key={item.id} item={item} opacity={props.layers[item.system].opacity * item.defaultOpacity}
        selected={props.selectedId === item.id} matched={props.searchMatches.includes(item.id)} generation={generation}
        showLabel={props.showNames && props.selectedId === item.id} onSelect={props.onSelect} onLoadReport={reportLoad} />)}
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.18, 0]} receiveShadow>
      <circleGeometry args={[5.5, 64]} /><meshStandardMaterial color="#161b19" roughness={.94} transparent opacity={.78} />
    </mesh>
    <gridHelper args={[10, 20, '#29312f', '#202624']} position={[0, -.17, 0]} />
    <CameraController request={props.focusRequest} readyVersion={statusVersion} />
  </>
}

export default function AnatomyScene(props: Props) {
  return <Canvas shadows dpr={[1, 1.8]} camera={{ position: [4.5, 2.35, 7.2], fov: 38, near: .05, far: 100 }}
    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
    onPointerMissed={() => props.onSelect(null)}>
    <SceneContents {...props} />
  </Canvas>
}
