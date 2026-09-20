import { useEffect, useState } from 'react'
import { minigames } from '../data/minigames.js'
import useLobbyNarration from '../hooks/useLobbyNarration.js'
import { isPageActive } from '../utils/pageActivity.js'
import LobbyMascot from './LobbyMascot.jsx'
import { SoundIcon } from './UiIcons.jsx'

const HELP_IDLE_DELAY = 15000
const HELP_ACTIVE_DURATION = 9000
const HELP_BETWEEN_DELAY = 5000

const lobbyCopyByEntry = {
  appStart: {
    eyebrow: '¡Hola! Qué alegría tenerte aquí.',
    title: '¿Qué te gustaría aprender hoy?',
    message: 'Elige una aventura y… ¡comencemos a jugar!',
  },
  gameReturn: {
    eyebrow: '¡Vamos por otra aventura!',
    title: 'Elige un juego',
    message: 'Y… ¡sigamos aprendiendo!',
  },
}

function GameLobby({
  entryType,
  isNarrating,
  muted,
  onGuideNarrationChange,
  onToggleSound,
  onSelectGame,
}) {
  const [activeGuideIndex, setActiveGuideIndex] = useState(null)

  useEffect(() => {
    let idleTimer
    let guideTimer
    let nextGuideIndex = 0

    const clearGuideTimers = () => {
      window.clearTimeout(idleTimer)
      window.clearTimeout(guideTimer)
    }

    const showNextGuide = () => {
      if (!isPageActive()) return
      setActiveGuideIndex(nextGuideIndex)

      guideTimer = window.setTimeout(() => {
        setActiveGuideIndex(null)
        nextGuideIndex = (nextGuideIndex + 1) % minigames.length
        guideTimer = window.setTimeout(showNextGuide, HELP_BETWEEN_DELAY)
      }, HELP_ACTIVE_DURATION)
    }

    const restartAfterInactivity = () => {
      clearGuideTimers()
      setActiveGuideIndex(null)
      nextGuideIndex = 0
      if (!isPageActive()) return
      idleTimer = window.setTimeout(showNextGuide, HELP_IDLE_DELAY)
    }
    const suspendGuides = () => {
      clearGuideTimers()
      setActiveGuideIndex(null)
    }
    const handleVisibilityChange = () => {
      if (isPageActive()) restartAfterInactivity()
      else suspendGuides()
    }

    restartAfterInactivity()
    window.addEventListener('pointerdown', restartAfterInactivity)
    window.addEventListener('keydown', restartAfterInactivity)
    window.addEventListener('focus', restartAfterInactivity)
    window.addEventListener('blur', suspendGuides)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearGuideTimers()
      window.removeEventListener('pointerdown', restartAfterInactivity)
      window.removeEventListener('keydown', restartAfterInactivity)
      window.removeEventListener('focus', restartAfterInactivity)
      window.removeEventListener('blur', suspendGuides)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const activeGuide = activeGuideIndex === null ? null : minigames[activeGuideIndex]
  const lobbyCopy = lobbyCopyByEntry[entryType] ?? lobbyCopyByEntry.gameReturn
  const isGuideNarrating = useLobbyNarration({
    cueId: activeGuide ? `guide-${activeGuide.id}` : 'guide-none',
    source: activeGuide?.guideAudio ?? null,
    shouldPlay: activeGuide !== null && !isNarrating && !muted,
    rememberPlayed: false,
  })

  useEffect(() => {
    onGuideNarrationChange(isGuideNarrating)
    return () => onGuideNarrationChange(false)
  }, [isGuideNarrating, onGuideNarrationChange])

  return (
    <main className="lobby">
      <header className="lobby-header">
        <button
          type="button"
          className="round-button round-button--sound"
          onClick={onToggleSound}
          aria-label={muted ? 'Activar sonidos' : 'Silenciar sonidos'}
          aria-pressed={muted}
        >
          <SoundIcon muted={muted} />
        </button>
      </header>

      <div className="lobby__sky" aria-hidden="true">
        <i className="cloud cloud--one" />
        <i className="cloud cloud--two" />
        <i className="sun" />
      </div>

      <section className="lobby__content">
        <div className="lobby-welcome">
          <LobbyMascot
            className="lobby-welcome__mascot"
            talking={isNarrating || isGuideNarrating}
          />
          <div className="lobby-welcome__copy" aria-live="polite">
            <span>{activeGuide ? 'Te recomiendo' : lobbyCopy.eyebrow}</span>
            <h1>{activeGuide?.guideTitle ?? lobbyCopy.title}</h1>
            <p>{activeGuide?.guideMessage ?? lobbyCopy.message}</p>
          </div>
        </div>

        <div className="game-grid" aria-label="Minijuegos disponibles">
          {minigames.map((game, index) => (
            <button
              type="button"
              className={`game-card ${activeGuideIndex === index ? 'is-guide-active' : ''}`}
              key={game.id}
              style={{ '--card-accent': game.accent, '--card-soft': game.softColor, '--card-delay': `${index * 70}ms` }}
              onClick={() => onSelectGame(game)}
            >
              <span className="game-card__icon" aria-hidden="true">
                <img src={game.icon} alt="" />
              </span>
              <span className="game-card__copy">
                <strong>{game.title}</strong>
                <small>{game.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

    </main>
  )
}

export default GameLobby
