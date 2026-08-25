import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Bone, BookOpen, ChevronDown, CircleDot, Eye, EyeOff, Info, Layers3, LocateFixed, Mail, Menu, Moon, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Sparkles, Sun, X } from 'lucide-react'
import manifestData from './data/anatomy-manifest.json'
import InfoModal from './InfoModal'
import { atlasStats } from './data/known-limitations'
import { LayerState, LoadState, PanelView, Structure, SYSTEMS, SystemId } from './types'
import { useTheme } from './useTheme'

const AnatomyScene = lazy(() => import('./scene/AnatomyScene'))
const About = lazy(() => import('./About'))
const Contact = lazy(() => import('./Contact'))
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
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const [isolateId, setIsolateId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [mobileSheet, setMobileSheet] = useState(false)
  const [panelView, setPanelView] = useState<PanelView | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{ id: string | null; nonce: number }>({ id: null, nonce: 0 })
  const [loadState, setLoadState] = useState<LoadState>({ loaded: 0, failed: 0, total: 0, active: false })
  const { theme, toggleTheme } = useTheme()

  const selected = manifest.find(item => item.id === selectedId) ?? null
  const stats = useMemo(() => atlasStats(manifest), [])

  // Debounce query for expensive scene work (highlighting). Dropdown filtering
  // stays instant using `query`, while `searchMatches` sent to the 3D scene is
  // debounced to avoid re-traversing materials on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 180)
    return () => window.clearTimeout(id)
  }, [query])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (!searchWrapRef.current?.contains(target)) {
        if (!query) setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [query])

  const instantMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? manifest.filter(item => item.displayName.toLowerCase().includes(q) || item.system.includes(q)) : []
  }, [query])

  const debouncedMatches = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return q ? manifest.filter(item => item.displayName.toLowerCase().includes(q) || item.system.includes(q)) : []
  }, [debouncedQuery])

  const matches = debouncedMatches

  const toggleLayer = (system: SystemId) => setLayers(prev => ({ ...prev, [system]: { ...prev[system], visible: !prev[system].visible } }))
  const setOpacity = (system: SystemId, opacity: number) => setLayers(prev => ({ ...prev, [system]: { ...prev[system], opacity } }))
  const select = (id: string | null) => { setSelectedId(id); if (!id) setIsolateId(null) }
  const focus = (id: string | null) => setFocusRequest({ id, nonce: Date.now() })

  const togglePanelView = (view: PanelView) => setPanelView(prev => (prev === view ? null : view))
  const openSystemsSheet = () => { setPanelView('systems'); setMobileSheet(true) }
  const openLimitations = () => { setPanelView('systems'); setMobileSheet(false); setInfoOpen(true) }

  const chooseSearchResult = (item: Structure) => {
    setLayers(prev => ({ ...prev, [item.system]: { ...prev[item.system], visible: true } }))
    setSelectedId(item.id)
    setFocusRequest({ id: item.id, nonce: Date.now() })
    setQuery(item.displayName)
    setDebouncedQuery(item.displayName)
    setSearchOpen(false)
  }

  const clearSearch = () => {
    setQuery('')
    setDebouncedQuery('')
    setSearchOpen(false)
    searchInputRef.current?.blur()
  }

  const resetAll = () => {
    setSelectedId(null); setIsolateId(null); setQuery(''); setDebouncedQuery(''); setSearchOpen(false)
    setFocusRequest({ id: null, nonce: Date.now() })
  }

  return <main className="app-shell">
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={() => setMobileSheet(true)} aria-label="Open navigation menu"><Menu /></button>
      <div className="brand"><span className="brand-mark"><Activity size={18} /></span><span>ANATOMICA</span><small>INTERACTIVE HUMAN ATLAS</small></div>
      <div ref={searchWrapRef} className={`search-wrap ${searchOpen ? 'open' : ''}`} onClick={() => { if (!searchOpen) setSearchOpen(true) }}>
        <Search size={17} className="search-icon" onClick={e => { e.stopPropagation(); setSearchOpen(o => !o); if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 0) }} />
        <input ref={searchInputRef} value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setSearchOpen(true)} onKeyDown={e => { if (e.key === 'Escape') clearSearch() }} placeholder="Search structures…" aria-label="Search anatomy structures" />
        {query && <button className="clear-search" onClick={e => { e.stopPropagation(); clearSearch() }} aria-label="Clear search"><X size={16} /></button>}
        {query.trim() && <div className="search-results">
          {instantMatches.length ? instantMatches.map(item => <button key={item.id} onClick={e => { e.stopPropagation(); chooseSearchResult(item) }} onTouchEnd={e => { e.preventDefault(); chooseSearchResult(item) }}>
            <span style={{ background: systemMeta[item.system].color }} /><b>{item.displayName}</b><small>{systemMeta[item.system].label}</small>
          </button>) : debouncedQuery.trim() ? <p>No structures found</p> : <p>Searching…</p>}
        </div>}
      </div>
      <div className="top-actions">
        <button className="quiet-button" onClick={() => focus(null)}><LocateFixed size={17} /> Reset view</button>
        <button className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-button" onClick={() => setInfoOpen(true)} aria-label="View known limitations" title="Known limitations"><Info size={18} /></button>
      </div>
    </header>

    <section className="workspace">
      <aside className={`layer-panel ${panelOpen ? '' : 'collapsed'} ${mobileSheet ? 'mobile-open' : ''}`} aria-label="Navigation">
        <div className="panel-heading">
          <div><span className="eyebrow">NAVIGATE</span><h2>Menu</h2></div>
          <button className="icon-button mobile-close" onClick={() => setMobileSheet(false)} aria-label="Close menu"><X /></button>
        </div>

        <nav className="panel-nav">
          <div className={`nav-item ${panelView === 'systems' ? 'open' : ''}`}>
            <button className="nav-toggle" onClick={() => togglePanelView('systems')} aria-expanded={panelView === 'systems'} aria-controls="nav-systems">
              <span className="system-dot" style={{ '--system-color': '#cfb373' } as React.CSSProperties}><Layers3 size={15} /></span>
              <span><b>Systems</b><small>{stats.structures.toLocaleString()} structures · {stats.systems} systems</small></span>
              <ChevronDown className="nav-chevron" size={15} />
            </button>
            {panelView === 'systems' && <div className="nav-body" id="nav-systems" role="region" aria-label="Anatomical systems">
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
            </div>}
          </div>

          <div className={`nav-item ${panelView === 'about' ? 'open' : ''}`}>
            <button className="nav-toggle" onClick={() => togglePanelView('about')} aria-expanded={panelView === 'about'} aria-controls="nav-about">
              <span className="system-dot" style={{ '--system-color': '#d6bb84' } as React.CSSProperties}><BookOpen size={15} /></span>
              <span><b>About</b><small>What Anatomica is, and its data</small></span>
              <ChevronDown className="nav-chevron" size={15} />
            </button>
            {panelView === 'about' && <div className="nav-body" id="nav-about">
              <Suspense fallback={null}><About structures={stats.structures} systems={stats.systems} onShowLimitations={openLimitations} /></Suspense>
            </div>}
          </div>

          <div className={`nav-item ${panelView === 'contact' ? 'open' : ''}`}>
            <button className="nav-toggle" onClick={() => togglePanelView('contact')} aria-expanded={panelView === 'contact'} aria-controls="nav-contact">
              <span className="system-dot" style={{ '--system-color': '#7fa8a0' } as React.CSSProperties}><Mail size={15} /></span>
              <span><b>Contact</b><small>Report bugs, labels, or gaps</small></span>
              <ChevronDown className="nav-chevron" size={15} />
            </button>
            {panelView === 'contact' && <div className="nav-body" id="nav-contact">
              <Suspense fallback={null}><Contact /></Suspense>
            </div>}
          </div>
        </nav>

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
        <button className="mobile-layer-button mobile-only" onClick={openSystemsSheet}><Layers3 size={18} /> Systems</button>
        <button className="reset-fab" onClick={resetAll} title="Reset scene"><RotateCcw size={18} /></button>
      </div>
    </section>
    <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} stats={stats} />
  </main>
}

export default App
