import { useCallback, useEffect, useRef, useState } from 'react'
import LevelConfetti from '../../components/LevelConfetti.jsx'
import LevelTransition from '../../components/LevelTransition.jsx'
import LobbyMascot from '../../components/LobbyMascot.jsx'
import { HintIcon, HomeIcon, RestartIcon, SoundIcon } from '../../components/UiIcons.jsx'
import { setAudioVolume } from '../../utils/audioSettings.js'
import { getBufferedAudio, rewindBufferedAudio } from '../../utils/audioPool.js'
import { playLevelComplete } from '../../hooks/useInterfaceSounds.js'
import balloonSprites from '../../assets/balloons/balloon-sprites.webp'
import {
  balloonCompleteAudios,
  balloonCountAudios,
  balloonErrorAudios,
  balloonGameCompleteAudio,
  balloonGameCompleteEffect,
  balloonHintAudio,
  balloonPopEffects,
  balloonPromptAudios,
  balloonWrongEffect,
} from './balloonsAudio.js'
import './balloons.css'

const LEVELS = [
  { count: 5, color: 'red', label: 'rojos', colorName: 'rojo', distractors: ['blue', 'yellow'], speed: 13.5 },
  { count: 6, color: 'blue', label: 'azules', colorName: 'azul', distractors: ['red', 'green'], speed: 13 },
  { count: 7, color: 'yellow', label: 'amarillos', colorName: 'amarillo', distractors: ['orange', 'purple'], speed: 12.5 },
  { count: 8, color: 'green', label: 'verdes', colorName: 'verde', distractors: ['red', 'blue', 'purple'], speed: 12 },
  { count: 9, color: 'purple', label: 'morados', colorName: 'morado', distractors: ['yellow', 'green', 'orange'], speed: 11.5 },
  { count: 10, color: 'orange', label: 'anaranjados', colorName: 'anaranjado', distractors: ['red', 'blue', 'yellow', 'green'], speed: 11 },
]

let balloonId = 0
const BALLOON_EDGE_GAP = 12

const choose = (items) => items[Math.floor(Math.random() * items.length)]

const createBalloon = (level, delay = 0, forcedColor = null) => {
  const color = forcedColor ?? (Math.random() < 0.62 ? level.color : choose(level.distractors))
  balloonId += 1
  return {
    id: balloonId,
    color,
    x: 4 + Math.random() * 84,
    size: 78 + Math.round(Math.random() * 30),
    duration: level.speed + Math.random() * 3,
    delay,
    drift: -42 + Math.round(Math.random() * 84),
    tilt: -7 + Math.round(Math.random() * 14),
    state: 'floating',
  }
}

const createOpeningBalloons = (level) => {
  const colors = [level.color, choose(level.distractors), level.color, choose(level.distractors), level.color, choose(level.distractors)]
  return colors.map((color, index) => createBalloon(level, -(index * 1.45), color))
}

function BalloonImage({ color, className = '', style }) {
  return (
    <i
      className={`balloon-image balloon-image--${color} ${className}`}
      style={{ backgroundImage: `url(${balloonSprites})`, ...style }}
      aria-hidden="true"
    />
  )
}

function BalloonsGame({ game, muted, onToggleSound, onBack }) {
  const [levelIndex, setLevelIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [balloons, setBalloons] = useState(() => createOpeningBalloons(LEVELS[0]))
  const [phase, setPhase] = useState('playing')
  const [feedback, setFeedback] = useState(null)
  const [hinted, setHinted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false)
  const lockedRef = useRef(false)
  const advanceTimerRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const lockTimerRef = useRef(null)
  const hintTimerRef = useRef(null)
  const promptTimerRef = useRef(null)
  const activeNarrationRef = useRef(null)
  const activeNarrationCleanupRef = useRef(null)
  const promptAudioRefs = useRef([])
  const countAudioRefs = useRef({})
  const hintAudioRef = useRef(null)
  const errorAudioRefs = useRef([])
  const completeAudioRefs = useRef([])
  const gameCompleteAudioRef = useRef(null)
  const lastErrorIndexRef = useRef(null)
  const errorNarrationLockedRef = useRef(false)
  const errorNarrationTimerRef = useRef(null)
  const soundOrderTimerRef = useRef(null)
  const activeEffectsRef = useRef(new Set())
  const level = LEVELS[levelIndex]

  const clearTimers = useCallback(() => {
    window.clearTimeout(advanceTimerRef.current)
    window.clearTimeout(feedbackTimerRef.current)
    window.clearTimeout(lockTimerRef.current)
    window.clearTimeout(hintTimerRef.current)
    window.clearTimeout(promptTimerRef.current)
    window.clearTimeout(errorNarrationTimerRef.current)
    window.clearTimeout(soundOrderTimerRef.current)
  }, [])

  const stopNarration = useCallback(() => {
    activeNarrationCleanupRef.current?.()
    activeNarrationCleanupRef.current = null
    activeNarrationRef.current?.pause()
    activeNarrationRef.current = null
    setIsSpeaking(false)
  }, [])

  const stopEffects = useCallback(() => {
    activeEffectsRef.current.forEach((audio) => audio.pause())
    activeEffectsRef.current.clear()
  }, [])

  const playEffect = useCallback((source, { varied = false, volume = 0.78 } = {}) => {
    if (muted || !source) return Promise.resolve(false)
    const audio = getBufferedAudio(source)
    rewindBufferedAudio(audio)
    setAudioVolume(audio, 'effects', varied ? volume * (0.9 + Math.random() * 0.16) : volume, false)
    if (varied) {
      audio.playbackRate = 0.9 + Math.random() * 0.2
      if ('preservesPitch' in audio) audio.preservesPitch = false
    }
    const release = () => {
      activeEffectsRef.current.delete(audio)
      audio.removeEventListener('ended', release)
      audio.removeEventListener('error', release)
    }
    audio.addEventListener('ended', release)
    audio.addEventListener('error', release)
    activeEffectsRef.current.add(audio)
    return audio.play()
      .then(() => true)
      .catch(() => {
        release()
        return false
      })
  }, [muted])

  const playNarration = useCallback((audio, onFinished) => {
    if (muted || !audio) {
      onFinished?.()
      return
    }

    stopNarration()
    const finish = () => {
      audio.removeEventListener('ended', finish)
      audio.removeEventListener('error', finish)
      if (activeNarrationRef.current === audio) {
        activeNarrationRef.current = null
        activeNarrationCleanupRef.current = null
        setIsSpeaking(false)
      }
      onFinished?.()
    }

    audio.pause()
    if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
    audio.addEventListener('ended', finish)
    audio.addEventListener('error', finish)
    activeNarrationRef.current = audio
    activeNarrationCleanupRef.current = () => {
      audio.removeEventListener('ended', finish)
      audio.removeEventListener('error', finish)
    }
    setIsSpeaking(true)
    void audio.play().catch(() => {
      audio.load()
      finish()
    })
  }, [muted, stopNarration])

  useEffect(() => {
    const createAudio = (source) => {
      const audio = new Audio(source)
      audio.preload = 'auto'
      setAudioVolume(audio, 'voices', 0.9)
      audio.load()
      return audio
    }
    promptAudioRefs.current = balloonPromptAudios.map(createAudio)
    countAudioRefs.current = Object.fromEntries(
      Object.entries(balloonCountAudios).map(([number, source]) => [number, createAudio(source)]),
    )
    hintAudioRef.current = createAudio(balloonHintAudio)
    errorAudioRefs.current = balloonErrorAudios.map(createAudio)
    completeAudioRefs.current = balloonCompleteAudios.map(createAudio)
    gameCompleteAudioRef.current = createAudio(balloonGameCompleteAudio)
    const allAudios = [
      ...promptAudioRefs.current,
      ...Object.values(countAudioRefs.current),
      hintAudioRef.current,
      ...errorAudioRefs.current,
      ...completeAudioRefs.current,
      gameCompleteAudioRef.current,
    ]

    return () => {
      activeNarrationCleanupRef.current?.()
      allAudios.forEach((audio) => audio.pause())
      activeNarrationRef.current = null
      activeNarrationCleanupRef.current = null
    }
  }, [])

  const showHint = useCallback(() => {
    if (phase !== 'playing') return
    setHinted(true)
    setFeedback(`Busca los globos ${level.label}.`)
    playNarration(hintAudioRef.current)
    window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => {
      setHinted(false)
      setFeedback(null)
    }, 2600)
  }, [level.label, phase, playNarration])

  const restartHintTimer = useCallback(() => {
    window.clearTimeout(hintTimerRef.current)
    if (phase !== 'playing') return
    hintTimerRef.current = window.setTimeout(showHint, 18000)
  }, [phase, showHint])

  useEffect(() => {
    if (phase !== 'playing' || isLevelTransitioning) return undefined
    const spawnTimer = window.setInterval(() => {
      setBalloons((current) => current.length >= 7 ? current : [...current, createBalloon(level)])
    }, 850)
    return () => window.clearInterval(spawnTimer)
  }, [isLevelTransitioning, level, phase])

  useEffect(() => {
    window.clearTimeout(promptTimerRef.current)
    if (phase !== 'playing' || isLevelTransitioning) return undefined
    promptTimerRef.current = window.setTimeout(() => {
      playNarration(promptAudioRefs.current[levelIndex])
    }, 320)
    return () => window.clearTimeout(promptTimerRef.current)
  }, [isLevelTransitioning, levelIndex, phase, playNarration])

  useEffect(() => {
    const restart = () => restartHintTimer()
    restartHintTimer()
    window.addEventListener('pointerdown', restart, true)
    window.addEventListener('keydown', restart, true)
    return () => {
      window.clearTimeout(hintTimerRef.current)
      window.removeEventListener('pointerdown', restart, true)
      window.removeEventListener('keydown', restart, true)
    }
  }, [restartHintTimer])

  useEffect(() => () => {
    clearTimers()
    stopNarration()
    stopEffects()
  }, [clearTimers, stopEffects, stopNarration])

  const removeBalloon = (id) => {
    setBalloons((current) => current.filter((balloon) => balloon.id !== id))
  }

  const finishLevel = (nextProgress) => {
    window.clearTimeout(feedbackTimerRef.current)
    setPhase('level-complete')
    setFeedback(`¡Excelente! Contaste ${nextProgress} globos ${level.label}.`)
    playLevelComplete()
    const advance = () => {
      advanceTimerRef.current = window.setTimeout(() => {
        if (levelIndex === LEVELS.length - 1) {
          setPhase('complete')
          setFeedback(null)
          playEffect(balloonGameCompleteEffect, { volume: 0.62 })
          playNarration(gameCompleteAudioRef.current)
        } else {
          const nextLevelIndex = levelIndex + 1
          stopNarration()
          setIsLevelTransitioning(true)
          setLevelIndex(nextLevelIndex)
          setProgress(0)
          setFeedback(null)
          setHinted(false)
          lockedRef.current = false
          setBalloons(createOpeningBalloons(LEVELS[nextLevelIndex]))
          setPhase('playing')
        }
      }, muted ? 1500 : 650)
    }
    playNarration(countAudioRefs.current[nextProgress], () => {
      playNarration(completeAudioRefs.current[levelIndex], advance)
    })
  }

  const handleBalloon = (balloon) => {
    if (phase !== 'playing' || lockedRef.current || balloon.state !== 'floating') return

    if (balloon.color !== level.color) {
      playEffect(balloonWrongEffect, { volume: 0.72 })
      setBalloons((current) => current.map((item) => item.id === balloon.id ? { ...item, state: 'wrong' } : item))
      setFeedback(`Ese es de otro color. Busca los ${level.label}.`)
      window.clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = window.setTimeout(() => {
        setBalloons((current) => current.map((item) => item.id === balloon.id ? { ...item, state: 'floating' } : item))
        setFeedback(null)
      }, 720)
      if (!errorNarrationLockedRef.current) {
        const indexes = errorAudioRefs.current
          .map((_, index) => index)
          .filter((index) => index !== lastErrorIndexRef.current)
        const nextIndex = choose(indexes)
        lastErrorIndexRef.current = nextIndex
        errorNarrationLockedRef.current = true
        playNarration(errorAudioRefs.current[nextIndex])
        window.clearTimeout(errorNarrationTimerRef.current)
        errorNarrationTimerRef.current = window.setTimeout(() => {
          errorNarrationLockedRef.current = false
        }, 3000)
      }
      return
    }

    lockedRef.current = true
    setBalloons((current) => current.map((item) => item.id === balloon.id ? { ...item, state: 'popped' } : item))
    const nextProgress = progress + 1
    setProgress(nextProgress)
    setFeedback(`¡${nextProgress}!`)
    const popPlayback = playEffect(choose(balloonPopEffects), { varied: true, volume: 0.82 })
    window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 620)
    window.setTimeout(() => removeBalloon(balloon.id), 270)
    const continueAfterPop = () => {
      if (nextProgress === level.count) {
        finishLevel(nextProgress)
        return
      }

      window.clearTimeout(lockTimerRef.current)
      lockTimerRef.current = window.setTimeout(() => {
        lockedRef.current = false
      }, 2600)
      playNarration(countAudioRefs.current[nextProgress], () => {
        window.clearTimeout(lockTimerRef.current)
        lockTimerRef.current = window.setTimeout(() => {
          lockedRef.current = false
        }, muted ? 380 : 80)
      })
    }

    if (muted) {
      continueAfterPop()
    } else {
      void popPlayback.then(() => {
        window.clearTimeout(soundOrderTimerRef.current)
        soundOrderTimerRef.current = window.setTimeout(continueAfterPop, 70)
      })
    }
  }

  const restart = () => {
    clearTimers()
    setPhase('playing')
    setProgress(0)
    setFeedback(null)
    setHinted(false)
    setIsLevelTransitioning(false)
    lockedRef.current = false
    errorNarrationLockedRef.current = false
    stopNarration()
    setLevelIndex(0)
    setBalloons(createOpeningBalloons(LEVELS[0]))
  }

  return (
    <main className="balloons-game">
      <LevelTransition
        current={levelIndex + 1}
        total={LEVELS.length}
        onComplete={() => setIsLevelTransitioning(false)}
      />
      <header className="balloons-header">
        <div className="balloons-status">
          <img src={game.icon} alt="" />
          <span>
            <strong>Cuenta y explota</strong>
            <span className="balloons-levels" aria-label={`Nivel ${levelIndex + 1} de ${LEVELS.length}`}>
              {LEVELS.map((_, index) => <i className={index <= levelIndex ? 'is-filled' : ''} key={index} />)}
            </span>
          </span>
        </div>
        <div className="balloons-header__actions">
          <button
            type="button"
            className="round-button"
            onClick={() => {
              if (!muted) {
                stopNarration()
                stopEffects()
              }
              onToggleSound()
            }}
            aria-label={muted ? 'Activar sonidos' : 'Silenciar sonidos'}
          >
            <SoundIcon muted={muted} />
          </button>
          <button type="button" className="home-button" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
        </div>
      </header>

      <section className="balloons-goal" aria-live="polite">
        <LobbyMascot className="balloons-goal__mascot" talking={isSpeaking} />
        <div className="balloons-goal__mission">
          <span>Revienta</span>
          <strong>{level.count}</strong>
          <BalloonImage color={level.color} />
          <span>globos {level.label}</span>
        </div>
        <button type="button" className="balloons-hint" onClick={showHint} aria-label="Mostrar una pista"><HintIcon /></button>
      </section>

      <section className={`balloons-playfield ${phase !== 'playing' ? 'is-paused' : ''}`} aria-label={`Globos para contar. Busca los de color ${level.colorName}.`}>
        <div className="balloons-counter" aria-label={`${progress} de ${level.count} globos`}>
          {Array.from({ length: level.count }, (_, index) => (
            <BalloonImage color={level.color} className={index < progress ? 'is-counted' : ''} key={index} />
          ))}
        </div>

        {feedback && <div className={`balloons-feedback ${hinted ? 'is-hint' : ''}`}>{feedback}</div>}

        <div className="balloons-layer">
          {balloons.map((balloon) => (
            <button
              type="button"
              className={`balloon-button is-${balloon.state} ${hinted && balloon.color === level.color ? 'is-hinted' : ''}`}
              key={balloon.id}
              onClick={() => handleBalloon(balloon)}
              onAnimationEnd={(event) => {
                if (event.animationName === 'balloon-rise') removeBalloon(balloon.id)
              }}
              style={{
                '--balloon-x': `${balloon.x}%`,
                '--balloon-size': `${balloon.size}px`,
                '--balloon-left-limit': `${BALLOON_EDGE_GAP + Math.max(0, -balloon.drift)}px`,
                '--balloon-right-limit': `${BALLOON_EDGE_GAP + Math.max(0, balloon.drift)}px`,
                '--balloon-duration': `${balloon.duration}s`,
                '--balloon-delay': `${balloon.delay}s`,
                '--balloon-drift': `${balloon.drift}px`,
                '--balloon-tilt': `${balloon.tilt}deg`,
              }}
              aria-label={`Globo ${balloon.color === level.color ? level.colorName : 'de otro color'}`}
            >
              <BalloonImage color={balloon.color} />
            </button>
          ))}
        </div>

        {phase === 'level-complete' && <LevelConfetti />}
      </section>

      {phase === 'complete' && (
        <div className="balloons-complete" role="dialog" aria-modal="true" aria-labelledby="balloons-complete-title">
          <LevelConfetti />
          <div>
            <img src={game.icon} alt="" />
            <h2 id="balloons-complete-title">¡Fantástico!</h2>
            <p>Contaste globos del 5 al 10.</p>
            <div className="balloons-complete__actions">
              <button type="button" onClick={restart} aria-label="Jugar otra vez"><RestartIcon /></button>
              <button type="button" className="is-secondary" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default BalloonsGame
