import { useCallback, useEffect, useState } from 'react'

const PHONE_SHORT_EDGE_MAX = 599

const isStandalone = () => (
  window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true
)

const isPhone = () => {
  const userAgent = navigator.userAgent || ''
  const mobileHint = navigator.userAgentData?.mobile
    ?? /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(userAgent)
  const shortestScreenEdge = Math.min(window.screen.width, window.screen.height)
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches

  // Chrome también marca como "mobile" varios perfiles de tableta emulados.
  // El lado corto separa teléfonos de tabletas incluso al girar la pantalla.
  return Boolean((mobileHint || coarsePointer) && shortestScreenEdge <= PHONE_SHORT_EDGE_MAX)
}

const isLandscape = () => window.matchMedia('(orientation: landscape)').matches

function usePhoneOrientationGuard() {
  const [blocked, setBlocked] = useState(() => isPhone() && isLandscape())

  const requestPortraitLock = useCallback(async () => {
    if (!isPhone() || !isStandalone() || !window.screen.orientation?.lock) return false

    try {
      await window.screen.orientation.lock('portrait')
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const syncOrientation = () => {
      const nextBlocked = isPhone() && isLandscape()
      setBlocked(nextBlocked)
      document.documentElement.classList.toggle('is-phone-orientation-blocked', nextBlocked)
      if (isPhone()) void requestPortraitLock()
    }

    const retryLock = () => {
      if (isPhone()) void requestPortraitLock()
    }

    syncOrientation()
    window.addEventListener('resize', syncOrientation)
    window.addEventListener('orientationchange', syncOrientation)
    window.addEventListener('pointerdown', retryLock, true)
    window.screen.orientation?.addEventListener?.('change', syncOrientation)

    return () => {
      window.removeEventListener('resize', syncOrientation)
      window.removeEventListener('orientationchange', syncOrientation)
      window.removeEventListener('pointerdown', retryLock, true)
      window.screen.orientation?.removeEventListener?.('change', syncOrientation)
      document.documentElement.classList.remove('is-phone-orientation-blocked')
    }
  }, [requestPortraitLock])

  return { blocked, requestPortraitLock }
}

export default usePhoneOrientationGuard
