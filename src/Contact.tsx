import { Mail } from 'lucide-react'

const CONTACT_EMAIL = 'sekeydzidepo7@gmail.com'
const FEEDBACK_SUBJECT = 'Anatomica Feedback'
const MAILTO_URL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}`

/**
 * Lightweight Contact section rendered inside the navigation panel.
 * There is no backend, so this is a plain mailto: link with a pre-filled
 * subject — no form service, no signup, no extra requests.
 */
function Contact() {
  return (
    <div className="static-page" role="region" aria-label="Contact">
      <p className="static-lead">
        Spotted a bug, an incorrect label, or a structure that&rsquo;s missing? Send it over —
        especially if you&rsquo;re a classmate using Anatomica for study, since you&rsquo;ll catch
        issues we might never see ourselves.
      </p>

      <a className="mailto-button" href={MAILTO_URL}>
        <Mail size={15} aria-hidden="true" /> Email feedback
      </a>
      <p className="static-meta">
        Opens your mail app addressed to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
        with the subject &ldquo;{FEEDBACK_SUBJECT}&rdquo;.
      </p>

      <h3>What helps most</h3>
      <ul>
        <li><b>Bugs</b> — what you did, what you expected, and what happened instead.</li>
        <li><b>Incorrect labels</b> — the structure shown and the correct name.</li>
        <li><b>Missing structures</b> — the structure, and which system it belongs to.</li>
      </ul>

      <p className="static-meta">Reports go straight to the maintainer&rsquo;s inbox — no forms, no signup.</p>
    </div>
  )
}

export default Contact
