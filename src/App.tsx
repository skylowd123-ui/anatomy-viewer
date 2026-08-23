import { lazy, Suspense, useMemo, useState } from 'react'
import { Activity, Bone, ChevronDown, CircleDot, Eye, EyeOff, HeartPulse, Info, Layers3, LocateFixed, Menu, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Sparkles, X } from 'lucide-react'
import manifestData from './data/anatomy-manifest.json'
import { LayerState, LoadState, Structure, SYSTEMS, SystemId } from './types'

const AnatomyScene = lazy(() => import('./scene/AnatomyScene'))
const manifest = manifestData as Structure[]

const systemMeta: Record<SystemId, { label: string; color: string }> = {
  skeletal: { label: 'Skeletal', color: '#ddd2b7' }, muscular: { label: 'Muscular', color: '#a94e49' },
  circulatory: { label: 'Circulatory', color: '#c84c57' }, respiratory: { label: 'Respiratory', color: '#cf7c78' },
  digestive: { label: 'Digestive', color: '#b77a4f' }, nervous: { label: 'Nervous', color: '#e1b75c' },
  urinary: { label: 'Urinary', color: '#c99370' }, reproductive: { label: 'Reproductive', color: '#b98ba6' },
  lymphatic: { label: 'Lymphatic', color: '#91b77b' }, endocrine: { label: 'Endocrine', color: '#c29a65' }
}

const initialLayers = Object.fromEntries(SYSTEMS.map(id => [id, {
  visible: ['skeletal', 'circulatory', 'respiratory'].includes(id), opacity: 1
}])) as LayerState

function App() {
  const [layers, setLayers] = useState<LayerState>(initialLayers)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNames, setShowNames] = useState(false)
  const [query, setQuery] = useState('')
  const [isolateId, setIsolateId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [mobileSheet, setMobileSheet] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{ id: string | null; nonce: number }>({ id: null, nonce: 0 })
  const [loadState, setLoadState] = useState<LoadState>({ loaded: 0, failed: 0, total: 0, active: false })

  const selected = manifest.find(item => item.id === selectedId) ?? null
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? manifest.filter(item => item.displayName.toLowerCase().includes(q) || item.system.includes(q)) : []
  }, [query])

  const toggleLayer = (system: SystemId) => setLayers(prev => ({ ...prev, [system]: { ...prev[system], visible: !prev[system].visible } }))
  const setOpacity = (system: SystemId, opacity: number) => setLayers(prev => ({ ...prev, [system]: { ...prev[system], opacity } }))
  const select = (id: string | null) => { setSelectedId(id); if (!id) setIsolateId(null) }
  const focus = (id: string | null) => setFocusRequest({ id, nonce: Date.now() })

  const chooseSearchResult = (item: Structure) => {
    setLayers(prev => ({ ...prev, [item.system]: { ...prev[item.system], visible: true } }))
    setSelectedId(item.id)
    setFocusRequest({ id: item.id, nonce: Date.now() })
  }

  const handleQuery = (value: string) => {
    setQuery(value)
    const first = manifest.find(item => item.displayName.toLowerCase().includes(value.trim().toLowerCase()))
    if (value.trim() && first) {
      setLayers(prev => ({ ...prev, [first.system]: { ...prev[first.system], visible: true } }))
      setFocusRequest({ id: first.id, nonce: Date.now() })
    }
  }

  const resetAll = () => {
    setSelectedId(null); setIsolateId(null); setQuery('')
    setFocusRequest({ id: null, nonce: Date.now() })
  }

  return <main className="app-shell">
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={() => setMobileSheet(true)} aria-label="Open anatomy layers"><Menu /></button>
      <div className="brand"><span className="brand-mark"><Activity size={18} /></span><span>ANATOMICA</span><small>INTERACTIVE HUMAN ATLAS</small></div>
      <div className="search-wrap">
        <Search size={17} />
        <input value={query} onChange={e => handleQuery(e.target.value)} placeholder="Search structures…" aria-label="Search anatomy structures" />
        {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
        {query && <div className="search-results">
          {matches.length ? matches.map(item => <button key={item.id} onClick={() => chooseSearchResult(item)}>
            <span style={{ background: systemMeta[item.system].color }} /><b>{item.displayName}</b><small>{systemMeta[item.system].label}</small>
          </button>) : <p>No structures found</p>}
        </div>}
      </div>
      <div className="top-actions">
        <button className="quiet-button" onClick={() => focus(null)}><LocateFixed size={17} /> Reset view</button>
        <button className="icon-button" aria-label="About"><Info size={18} /></button>
      </div>
    </header>

    <section className="workspace">
      <aside className={`layer-panel ${panelOpen ? '' : 'collapsed'} ${mobileSheet ? 'mobile-open' : ''}`}>
        <div className="panel-heading">
          <div><span className="eyebrow">EXPLORE</span><h2>Anatomical systems</h2></div>
          <button className="icon-button mobile-close" onClick={() => setMobileSheet(false)}><X /></button>
        </div>
        <p className="panel-intro">Reveal layers and tune their visibility.</p>
        <div className="layer-list">
          {SYSTEMS.map(system => {
            const count = manifest.filter(s => s.system === system).length
            const state = layers[system]
            return <div className={`layer-row ${state.visible ? 'active' : ''}`} key={system}>
              <button className="layer-toggle" onClick={() => toggleLayer(system)} aria-pressed={state.visible}>
                <span className="system-dot" style={{ '--system-color': systemMeta[system].color } as React.CSSProperties}>{state.visible ? <Eye size={15} /> : <EyeOff size={15} />}</span>
                <span><b>{systemMeta[system].label}</b><small>{count ? `${count} ${count === 1 ? 'structure' : 'structures'}` : 'Awaiting models'}</small></span>
                <ChevronDown size={15} />
              </button>
              {state.visible && <div className="opacity-row"><span>Opacity</span><input type="range" min="0" max="1" step="0.01" value={state.opacity} onChange={e => setOpacity(system, Number(e.target.value))} /><output>{Math.round(state.opacity * 100)}%</output></div>}
            </div>
          })}
        </div>
        <div className="panel-footnote"><Sparkles size={14} /><span>Models load only when a system is revealed.</span></div>
      </aside>

      <button className="panel-collapse desktop-only" onClick={() => setPanelOpen(v => !v)} aria-label="Toggle layers panel">
        {panelOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </button>

      <div className="viewport">
        <Suspense fallback={<div className="scene-fallback"><span /><p>Preparing 3D workspace</p></div>}>
          <AnatomyScene structures={manifest} layers={layers} selectedId={selectedId} showNames={showNames}
            isolateId={isolateId} searchMatches={matches.map(m => m.id)} focusRequest={focusRequest}
            onSelect={select} onLoadState={setLoadState} />
        </Suspense>
        <div className="orientation"><span>A</span><i /><span>P</span></div>
        <div className="view-caption"><span className="live-dot" />ANTERIOR VIEW</div>
        {(loadState.active || loadState.failed > 0) && <div className={`loading-card ${loadState.failed ? 'has-errors' : ''}`} role="status" aria-live="polite">
          <div><CircleDot size={15} /><span>{loadState.active ? 'Streaming anatomy' : 'Anatomy loaded with errors'}</span><b>{loadState.loaded}/{loadState.total}</b></div>
          <progress value={loadState.loaded + loadState.failed} max={Math.max(1, loadState.total)} />
          {loadState.failed > 0 && <small>{loadState.failed} {loadState.failed === 1 ? 'structure' : 'structures'} failed to load</small>}
        </div>}

        <div className="name-key glass-card">
          <div><span className="key-icon"><Eye size={17} /></span><span><b>Show names on click</b><small>{showNames ? 'Labels and answers are visible' : 'Quiz mode — answers hidden'}</small></span></div>
          <button className={`switch ${showNames ? 'on' : ''}`} onClick={() => setShowNames(v => !v)} role="switch" aria-checked={showNames}><span /></button>
        </div>

        {selected && <div className="selection-card glass-card">
          <button className="card-close" onClick={() => select(null)}><X size={16} /></button>
          <span className="eyebrow">ACTIVE SELECTION</span>
          {showNames ? <><h3>{selected.displayName}</h3><p><span style={{ background: systemMeta[selected.system].color }} />{systemMeta[selected.system].label} system</p></> : <><h3>Structure selected</h3><p className="hidden-answer">Enable “Show names” to reveal the answer.</p></>}
          <div className="selection-actions">
            <button onClick={() => { setIsolateId(selected.id); focus(selected.id) }}><Layers3 size={16} /> Isolate</button>
            <button onClick={() => focus(selected.id)}><LocateFixed size={16} /> Focus</button>
          </div>
        </div>}
        {isolateId && <button className="isolate-banner" onClick={() => setIsolateId(null)}><Bone size={16} /> Isolate mode <span>Show all</span><X size={15} /></button>}

        <div className="scene-hint"><span><i className="mouse-icon" /> Drag to rotate</span><span>Scroll to zoom</span><span>Right-drag to pan</span></div>
        <button className="mobile-layer-button mobile-only" onClick={() => setMobileSheet(true)}><Layers3 size={18} /> Systems</button>
        <button className="reset-fab" onClick={resetAll} title="Reset scene"><RotateCcw size={18} /></button>
      </div>
    </section>
  </main>
}

export default App
