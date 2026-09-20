import { useEffect, useRef, useState } from 'react'
import { introMedia } from '../config/media.js'
import tapHandPressed from '../assets/ui/tap-hand-pressed.png'
import tapHandRaised from '../assets/ui/tap-hand-raised.png'
import { checkForAppUpdate } from '../utils/appUpdater.js'
import { getBufferedAudio } from '../utils/audioPool.js'
import { getLobbyResources, preloadResources } from '../utils/resourcePreloader.js'
import BrandLogo from './BrandLogo.jsx'
import IntroMascot from './IntroMascot.jsx'

const LOBBY_RESOURCES = getLobbyResources()

const isAppleTouchDevice = () => {
  const userAgent = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
  const isIPadDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isIOS || isIPadDesktopMode
}

function IntroScreen({ onComplete }) {
  const [phase, setPhase] = useState('loading')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingLabel, setLoadingLabel] = useState('Buscando actualizaciones...')
  const [requiresInteraction, setRequiresInteraction] = useState(false)
  const [ripple, setRipple] = useState(null)
  const audioRef = useRef(null)
  const startRef = useRef(null)
  const timersRef = useRef([])
  const hasStartedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
    }

    const finish = () => {
      setPhase('leaving')
      timersRef.current.push(window.setTimeout(onComplete, 480))
    }

    const begin = async ({ fromGesture = false } = {}) => {
      if (hasStartedRef.current) return

      if (isAppleTouchDevice() && !fromGesture) {
        setRequiresInteraction(true)
        return
      }

      if (introMedia.soundSource) {
        const audio = audioRef.current ?? getBufferedAudio(introMedia.soundSource)
        audioRef.current = audio
        audio.preload = 'auto'
        audio.volume = 0.35

        try {
          audio.currentTime = 0
          await audio.play()
        } catch {
          setRequiresInteraction(true)
          return
        }
      }

      hasStartedRef.current = true
      setRequiresInteraction(false)
      setPhase('playing')
      timersRef.current.push(window.setTimeout(() => setPhase('awake'), introMedia.spriteSwapDelay))

      const audioDuration = audioRef.current?.duration
      const duration = Number.isFinite(audioDuration) && audioDuration > 0
        ? Math.max(introMedia.minimumDuration, Math.ceil(audioDuration * 1000))
        : introMedia.fallbackDuration

      timersRef.current.push(window.setTimeout(finish, duration))
    }

    const initialize = async () => {
      await checkForAppUpdate()
      if (cancelled) return

      setLoadingLabel('Cargando aventuras...')
      await preloadResources(LOBBY_RESOURCES, (progress) => {
        if (!cancelled) setLoadingProgress(progress)
      })
      if (cancelled) return

      setPhase('waiting')
      void begin()
    }

    startRef.current = begin
    void initialize()

    return () => {
      cancelled = true
      clearTimers()
      hasStartedRef.current = false
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      startRef.current = null
    }
  }, [onComplete])

  const handlePointerDown = (event) => {
    if (!requiresInteraction) return

    const bounds = event.currentTarget.getBoundingClientRect()
    setRipple({
      id: Date.now(),
      x: `${event.clientX - bounds.left}px`,
      y: `${event.clientY - bounds.top}px`,
    })
    void startRef.current?.({ fromGesture: true })
  }

  const isAwake = phase === 'awake' || phase === 'leaving'

  return (
    <main
      className={`intro-screen intro-screen--${phase} ${requiresInteraction ? 'requires-interaction' : ''}`}
      onPointerDown={handlePointerDown}
      aria-label="Bienvenido a PlayKids"
    >
      <div className="intro-screen__bubbles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>

      <section className="intro-screen__content">
        <IntroMascot awake={isAwake} />
        <BrandLogo />
        <p>¡Juega, descubre y aprende!</p>
      </section>

      {phase === 'loading' && (
        <div className="intro-screen__loader" role="status" aria-live="polite">
          <span className="intro-screen__loader-dots" aria-hidden="true"><i /><i /><i /></span>
          <strong>{loadingLabel}</strong>
          <span className="intro-screen__progress" aria-hidden="true">
            <i style={{ width: `${loadingProgress}%` }} />
          </span>
          <small>{loadingProgress}%</small>
        </div>
      )}

      {requiresInteraction && (
        <div className="intro-screen__permission">
          <span className="intro-screen__tap-icon" aria-hidden="true">
            <img className="intro-screen__tap-frame intro-screen__tap-frame--raised" src={tapHandRaised} alt="" />
            <img className="intro-screen__tap-frame intro-screen__tap-frame--pressed" src={tapHandPressed} alt="" />
          </span>
          <strong>Presiona para continuar</strong>
        </div>
      )}

      {ripple && (
        <i
          className="intro-screen__ripple"
          key={ripple.id}
          style={{ '--tap-x': ripple.x, '--tap-y': ripple.y }}
          aria-hidden="true"
        />
      )}
    </main>
  )
}

export default IntroScreen
