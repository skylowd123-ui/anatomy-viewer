import { Info } from 'lucide-react'

interface AboutProps {
  structures: number
  systems: number
  onShowLimitations: () => void
}

/**
 * Lightweight About section rendered inside the navigation panel.
 * No images, fonts, or libraries — text and links only. Counts are passed in
 * from the live manifest so they never go stale.
 */
function About({ structures, systems, onShowLimitations }: AboutProps) {
  return (
    <div className="static-page" role="region" aria-label="About Anatomica">
      <p className="static-lead">
        Anatomica is an interactive 3D human anatomy atlas built for hands-on anatomy study. It was
        created for Medical Laboratory Science and medical undergraduate coursework — explore, isolate,
        and quiz yourself on real anatomical structures right in the browser.
      </p>

      <div className="about-stats">
        <div><b>{structures.toLocaleString()}</b><span>structures</span></div>
        <div><b>{systems}</b><span>anatomical systems</span></div>
      </div>
      <p className="static-meta">Counts are computed from the live structure manifest, so they stay current as the atlas grows.</p>

      <h3>Data source &amp; license</h3>
      <p>
        Every mesh in the atlas is derived from{' '}
        <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noreferrer">BodyParts3D</a>,
        an open-source dataset published by the Database Center for Life Science (DBCLS), Japan:
      </p>
      <blockquote className="attribution-quote">
        &ldquo;BodyParts3D, &copy; The Database Center for Life Science, licensed under Creative Commons
        Attribution-ShareAlike 2.1 Japan.&rdquo;
      </blockquote>
      <p>
        Source meshes were converted to Draco-compressed glTF for this viewer; the converted derivatives
        are distributed under the same CC&nbsp;BY-SA&nbsp;2.1&nbsp;Japan license. Full attribution details,
        including source archives, are in{' '}
        <a href="https://github.com/skylowd123-ui/anatomy-viewer/blob/main/ATTRIBUTION.md" target="_blank" rel="noreferrer">ATTRIBUTION.md</a>.
      </p>

      <h3>Known gaps</h3>
      <p>
        Where the source dataset doesn&rsquo;t include a structure, Anatomica leaves it out rather than
        approximating it. Those gaps are documented in the Known Limitations panel — tap the{' '}
        <Info size={12} aria-hidden="true" /> button in the top bar, or{' '}
        <button type="button" className="inline-link" onClick={onShowLimitations}>open it now</button>.
      </p>
    </div>
  )
}

export default About
