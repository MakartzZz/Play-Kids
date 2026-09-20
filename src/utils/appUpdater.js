import { registerSW } from 'virtual:pwa-register'

const UPDATE_CHECK_TIMEOUT = 8000

let finishStartupCheck = () => {}

const startupUpdateCheck = new Promise((resolve) => {
  let finished = false

  finishStartupCheck = () => {
    if (finished) return
    finished = true
    resolve()
  }
})

const waitForWorker = (worker) => new Promise((resolve) => {
  if (!worker || worker.state === 'activated' || worker.state === 'redundant') {
    resolve()
    return
  }

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    window.clearTimeout(timeout)
    worker.removeEventListener('statechange', handleStateChange)
    resolve()
  }
  const handleStateChange = () => {
    if (worker.state === 'activated' || worker.state === 'redundant') finish()
  }
  const timeout = window.setTimeout(finish, UPDATE_CHECK_TIMEOUT)

  worker.addEventListener('statechange', handleStateChange)
})

if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
  finishStartupCheck()
} else {
  registerSW({
    immediate: true,
    onRegisteredSW: async (serviceWorkerUrl, registration) => {
      if (!registration || !navigator.serviceWorker.controller || !navigator.onLine) {
        finishStartupCheck()
        return
      }

      try {
        const response = await fetch(serviceWorkerUrl, {
          cache: 'no-store',
          headers: {
            cache: 'no-store',
            'cache-control': 'no-cache',
          },
        })

        if (response.status === 200) {
          await registration.update()
          await waitForWorker(registration.installing || registration.waiting)
        }
      } catch {
        // A network failure must never prevent the installed app from opening.
      } finally {
        finishStartupCheck()
      }
    },
    onRegisterError: finishStartupCheck,
  })

  window.setTimeout(finishStartupCheck, UPDATE_CHECK_TIMEOUT)
}

export const checkForAppUpdate = () => startupUpdateCheck
