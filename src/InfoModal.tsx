import { useEffect } from 'react'
import { CircleMinus, X } from 'lucide-react'
import { atlasIntro, datasetGaps, datasetSummary } from './data/known-limitations'

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
      <p className="info-modal-intro">{atlasIntro}</p>

      {datasetGaps.map(category => <div key={category.title} style={{ marginTop: 18 }}>
        <span className="eyebrow">{category.title}</span>
        <ul className="limitations-list">
          {category.gaps.map(gap => <li key={gap}>
            <CircleMinus size={16} aria-hidden="true" />
            <p>{gap}</p>
          </li>)}
        </ul>
      </div>)}

      <p className="info-modal-intro" style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(218, 200, 154, 0.18)' }}>{datasetSummary.closingNote}</p>
    </section>
  </div>
}

export default InfoModal
