/** Register the production service worker after the first page has loaded. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL
    const workerUrl = `${baseUrl}sw.js`
    navigator.serviceWorker.register(workerUrl, { scope: baseUrl })
      .then(registration => {
        // Ask an already-installed worker to check for a new build. The
        // worker itself remains production-only; development never touches SW.
        void registration.update()
      })
      .catch(error => {
        // A PWA enhancement must not prevent the atlas from rendering if a
        // browser, host, or private mode disallows service workers.
        console.warn('ANATOMICA service worker registration failed', error)
      })
  }, { once: true })
}
