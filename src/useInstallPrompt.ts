import { useCallback, useEffect, useState } from 'react'

interface InstallChoice {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<InstallChoice>
  prompt: () => Promise<void>
}

interface StandaloneNavigator extends Navigator {
  standalone?: boolean
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const displayMode = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  return Boolean(displayMode) || (window.navigator as StandaloneNavigator).standalone === true
}

/**
 * Holds the browser's deferred Add to Home Screen prompt until the user
 * chooses Install. Browsers that do not expose the event simply render no
 * install affordance; the manifest still enables their native install flow.
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandaloneDisplay())

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setPromptEvent(null)
      setInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent) return false
    const event = promptEvent
    setPromptEvent(null)
    await event.prompt()
    const choice = await event.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    return choice.outcome === 'accepted'
  }, [promptEvent])

  return { canInstall: Boolean(promptEvent) && !installed, install }
}
