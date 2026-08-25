import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'anatomica-theme'
const THEME_COLOR_META: Record<Theme, string> = { dark: '#111514', light: '#f1efe9' }

/** Initial theme: explicit user choice (localStorage) wins, then the OS
 *  preference. Mirrored by the inline script in index.html so the first
 *  paint already has the right palette (no flash of the wrong theme). */
export function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* storage unavailable — fall through to system preference */ }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR_META[theme])
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [manualChoice, setManualChoice] = useState<boolean>(() => {
    try { return window.localStorage.getItem(THEME_STORAGE_KEY) !== null } catch { return false }
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Until the user makes an explicit choice, keep tracking live changes to
  // the system preference (e.g. the OS flips light/dark while the tab is open).
  useEffect(() => {
    if (manualChoice) return
    const query = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setTheme(query.matches ? 'light' : 'dark')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [manualChoice])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      try { window.localStorage.setItem(THEME_STORAGE_KEY, next) } catch { /* ignore */ }
      return next
    })
    setManualChoice(true)
  }, [])

  return { theme, toggleTheme }
}
