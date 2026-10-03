import { useEffect, useRef, useState } from 'react'
import LobbyMascot from './LobbyMascot.jsx'
import './LevelTransition.css'

const TRANSITION_DURATION = 1250

function LevelTransition({ current, total, label = 'Nivel' }) {
  const previousRef = useRef(current)
  const [visibleLevel, setVisibleLevel] = useState(null)

  useEffect(() => {
    const previous = previousRef.current
    previousRef.current = current

    if (current <= previous) {
      setVisibleLevel(null)
      return undefined
    }

    setVisibleLevel(current)
    const timer = window.setTimeout(() => setVisibleLevel(null), TRANSITION_DURATION)
    return () => window.clearTimeout(timer)
  }, [current])

  if (visibleLevel === null) return null

  return (
    <div
      className="level-transition"
      role="status"
      aria-live="polite"
      aria-label={`${label} ${visibleLevel} de ${total}`}
    >
      <i className="level-transition__panel level-transition__panel--left" aria-hidden="true" />
      <i className="level-transition__panel level-transition__panel--right" aria-hidden="true" />
      <div className="level-transition__card">
        <i className="level-transition__spark level-transition__spark--one" aria-hidden="true">★</i>
        <i className="level-transition__spark level-transition__spark--two" aria-hidden="true">★</i>
        <LobbyMascot className="level-transition__mascot" />
        <span>¡Muy bien!</span>
        <strong>{label} {visibleLevel}</strong>
        <div className="level-transition__progress" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <i className={index < visibleLevel ? 'is-filled' : ''} key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LevelTransition
