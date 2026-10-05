import { useEffect, useRef } from 'react'
import { getBufferedAudio, releaseBufferedAudio, rewindBufferedAudio } from '../utils/audioPool.js'
import { setAudioVolume } from '../utils/audioSettings.js'
import './PhoneOrientationGuard.css'

const orientationAudioModules = import.meta.glob('../assets/sounds/rotate-phone.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})
const orientationAudioSource = Object.values(orientationAudioModules)[0] ?? null

function PhoneOrientationGuard({ active, muted, onRequestPortrait }) {
  const reminderTimerRef = useRef(null)

  useEffect(() => {
    window.clearTimeout(reminderTimerRef.current)
    if (!active || muted || !orientationAudioSource) return undefined

    const audio = getBufferedAudio(orientationAudioSource)
    setAudioVolume(audio, 'voices', 0.9)

    const playReminder = () => {
      if (document.hidden) return
      rewindBufferedAudio(audio)
      void audio.play().catch(() => {})
      reminderTimerRef.current = window.setTimeout(playReminder, 7000)
    }

    playReminder()
    return () => {
      window.clearTimeout(reminderTimerRef.current)
      audio.pause()
      releaseBufferedAudio(orientationAudioSource)
    }
  }, [active, muted])

  if (!active) return null

  return (
    <div
      className="phone-orientation-guard"
      role="status"
      aria-live="assertive"
      aria-label="Gira el celular y colócalo en posición vertical para seguir jugando."
      onPointerDown={() => { void onRequestPortrait() }}
    >
      <div className="phone-orientation-guard__decor" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="phone-orientation-guard__content">
        <div className="phone-orientation-guard__animation" aria-hidden="true">
          <div className="phone-orientation-guard__phone">
            <span className="phone-orientation-guard__speaker" />
            <span className="phone-orientation-guard__screen">
              <i /><i /><i />
            </span>
            <span className="phone-orientation-guard__home" />
          </div>
        </div>
        <h1>¡Gira el celular!</h1>
        <p>Ponlo de pie para seguir jugando.</p>
      </div>
    </div>
  )
}

export default PhoneOrientationGuard
