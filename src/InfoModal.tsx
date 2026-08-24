import { useEffect } from 'react'
import { AlertTriangle, Database, X } from 'lucide-react'
import { datasetSummary, knownLimitations } from './data/known-limitations'

interface InfoModalProps {
  open: boolean
  onClose: () => void
}

function InfoModal({ open, onClose }: InfoModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return <div className="info-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="limitations-title" onMouseDown={event => event.stopPropagation()}>
      <button className="card-close" onClick={onClose} aria-label="Close known limitations"><X size={18} /></button>
      <span className="eyebrow">DATASET STATUS</span>
      <h2 id="limitations-title">Known limitations</h2>
      <p className="info-modal-intro">Anatomica is currently a working viewer shell with a deliberately small demonstration dataset.</p>

      <div className="dataset-summary" aria-label="Dataset summary">
        <Database size={19} />
        <div><b>{datasetSummary.includedStructures} demo structures</b><span>across {datasetSummary.intendedSystems} planned systems</span></div>
      </div>

      <ul className="limitations-list">
        {knownLimitations.map(limitation => <li key={limitation.title}>
          <AlertTriangle size={16} aria-hidden="true" />
          <div><h3>{limitation.title}</h3><p>{limitation.detail}</p></div>
        </li>)}
      </ul>
      <p className="source-note">{datasetSummary.sourceNote}</p>
    </section>
  </div>
}

export default InfoModal
