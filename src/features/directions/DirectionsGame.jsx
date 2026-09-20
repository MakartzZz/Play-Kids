import { useCallback, useEffect, useRef, useState } from 'react'
import LobbyMascot from '../../components/LobbyMascot.jsx'
import LevelConfetti from '../../components/LevelConfetti.jsx'
import { HintIcon, HomeIcon, RestartIcon, SoundIcon } from '../../components/UiIcons.jsx'
import { isPageActive } from '../../utils/pageActivity.js'
import rabbitSprite from '../../assets/directions/rabbit.png'
import rabbitBlinkSprite from '../../assets/directions/rabbit-blink.png'
import burrowSprite from '../../assets/directions/burrow.png'
import rockSprite from '../../assets/directions/rock.png'
import bushSprite from '../../assets/directions/bush.png'
import movementArrow from '../../assets/directions/movement-arrow.png'
import downButtonSound from '../../assets/sounds/directions/buttons/down.mp3'
import leftButtonSound from '../../assets/sounds/directions/buttons/left.mp3'
import rightButtonSound from '../../assets/sounds/directions/buttons/right.mp3'
import upButtonSound from '../../assets/sounds/directions/buttons/up.mp3'
import jumpSoundOne from '../../assets/sounds/directions/effects/jump-1.mp3'
import jumpSoundTwo from '../../assets/sounds/directions/effects/jump-2.mp3'
import bushFeedbackSound from '../../assets/sounds/directions/feedback/bush.mp3'
import outsideFeedbackSound from '../../assets/sounds/directions/feedback/outside.mp3'
import rockFeedbackSound from '../../assets/sounds/directions/feedback/rock.mp3'
import downHintSound from '../../assets/sounds/directions/hints/down.mp3'
import leftHintSound from '../../assets/sounds/directions/hints/left.mp3'
import rightHintSound from '../../assets/sounds/directions/hints/right.mp3'
import upHintSound from '../../assets/sounds/directions/hints/up.mp3'
import { playLevelComplete, playMiss } from '../../hooks/useInterfaceSounds.js'
import './directions.css'

const TOTAL_LEVELS = 5
const BOARD_COLUMNS = 8
const BOARD_ROWS = 4
const IDLE_HINT_DELAY = 40000

const DIRECTION_SPRITES = {
  rabbit: rabbitSprite,
  burrow: burrowSprite,
  rock: rockSprite,
  bush: bushSprite,
}

const LEVELS = [
  {
    start: { x: 0, y: 1 }, goal: { x: 7, y: 2 },
    obstacles: [{ x: 2, y: 0, type: 'rock' }, { x: 5, y: 0, type: 'bush' }, { x: 3, y: 2, type: 'bush' }, { x: 5, y: 3, type: 'rock' }],
  },
  {
    start: { x: 7, y: 3 }, goal: { x: 0, y: 0 },
    obstacles: [{ x: 5, y: 0, type: 'rock' }, { x: 3, y: 1, type: 'bush' }, { x: 2, y: 2, type: 'rock' }, { x: 5, y: 2, type: 'bush' }],
  },
  {
    start: { x: 0, y: 3 }, goal: { x: 7, y: 0 },
    obstacles: [{ x: 1, y: 1, type: 'bush' }, { x: 3, y: 1, type: 'rock' }, { x: 5, y: 2, type: 'bush' }, { x: 6, y: 3, type: 'rock' }],
  },
  {
    start: { x: 3, y: 0 }, goal: { x: 6, y: 1 },
    obstacles: [{ x: 1, y: 0, type: 'rock' }, { x: 5, y: 0, type: 'bush' }, { x: 1, y: 2, type: 'bush' }, { x: 6, y: 2, type: 'rock' }],
  },
  {
    start: { x: 0, y: 0 }, goal: { x: 7, y: 3 },
    obstacles: [{ x: 2, y: 1, type: 'rock' }, { x: 4, y: 1, type: 'bush' }, { x: 1, y: 2, type: 'bush' }, { x: 5, y: 2, type: 'rock' }],
  },
]

const MOVEMENTS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const DIRECTION_HINT_SOUNDS = {
  up: upHintSound,
  down: downHintSound,
  left: leftHintSound,
  right: rightHintSound,
}

const DIRECTION_BUTTON_SOUNDS = {
  up: upButtonSound,
  down: downButtonSound,
  left: leftButtonSound,
  right: rightButtonSound,
}

const INVALID_MOVE_NARRATION_SOUNDS = {
  outside: [outsideFeedbackSound],
  rock: [rockFeedbackSound],
  bush: [bushFeedbackSound],
}

const DIRECTION_LABELS = { up: 'Arriba', down: 'Abajo', left: 'Izquierda', right: 'Derecha' }
const getCellStyle = ({ x, y }) => ({ '--cell-left': `${x * 12.5}%`, '--cell-top': `${y * 25}%` })

const getGuidePath = (start, goal, obstacles) => {
  const blocked = new Set(obstacles.map(({ x, y }) => `${x}-${y}`))
  const queue = [[start]]
  const visited = new Set([`${start.x}-${start.y}`])
  const steps = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }]

  while (queue.length) {
    const path = queue.shift()
    const current = path[path.length - 1]
    if (current.x === goal.x && current.y === goal.y) return path

    for (const step of steps) {
      const next = { x: current.x + step.x, y: current.y + step.y }
      const key = `${next.x}-${next.y}`
      const outside = next.x < 0 || next.x >= BOARD_COLUMNS || next.y < 0 || next.y >= BOARD_ROWS
      if (outside || blocked.has(key) || visited.has(key)) continue
      visited.add(key)
      queue.push([...path, next])
    }
  }

  return [start]
}

const getGuidePoints = (path) => path
  .map(({ x, y }) => `${((x + 0.5) / BOARD_COLUMNS) * 100},${((y + 0.5) / BOARD_ROWS) * 100}`)
  .join(' ')

const getNextPathDirection = (path) => {
  if (path.length < 2) return null
  const movementX = path[1].x - path[0].x
  const movementY = path[1].y - path[0].y

  return Object.entries(MOVEMENTS)
    .find(([, movement]) => movement.x === movementX && movement.y === movementY)?.[0] ?? null
}

const getTileType = (index) => {
  const x = index % BOARD_COLUMNS
  const y = Math.floor(index / BOARD_COLUMNS)

  if (y === 0 && x === 0) return 'top-left'
  if (y === 0 && x === BOARD_COLUMNS - 1) return 'top-right'
  if (y === BOARD_ROWS - 1 && x === 0) return 'bottom-left'
  if (y === BOARD_ROWS - 1 && x === BOARD_COLUMNS - 1) return 'bottom-right'
  if (y === 0) return 'top'
  if (y === BOARD_ROWS - 1) return 'bottom'
  if (x === 0) return 'left'
  if (x === BOARD_COLUMNS - 1) return 'right'
  return 'center'
}

function ArrowIcon({ direction }) {
  const rotations = { up: 0, right: 90, down: 180, left: -90 }
  return <img className="direction-button__arrow" src={movementArrow} alt="" aria-hidden="true" style={{ transform: `rotate(${rotations[direction]}deg)` }} />
}

function DirectionSprite({ type, className = '' }) {
  if (type === 'rabbit') {
    return (
      <span className={`direction-sprite direction-sprite--rabbit ${className}`} aria-hidden="true">
        <img className="direction-sprite__rabbit-open" src={rabbitSprite} alt="" />
        <img className="direction-sprite__rabbit-blink" src={rabbitBlinkSprite} alt="" />
      </span>
    )
  }

  return <img src={DIRECTION_SPRITES[type]} className={`direction-sprite direction-sprite--${type} ${className}`} alt="" aria-hidden="true" />
}

function DirectionsGame({ game, muted, onToggleSound, onBack }) {
  const [levelIndex, setLevelIndex] = useState(0)
  const [position, setPosition] = useState(LEVELS[0].start)
  const [feedback, setFeedback] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeHintDirection, setActiveHintDirection] = useState(null)
  const [levelSolved, setLevelSolved] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const nextLevelTimerRef = useRef(null)
  const idleHintTimerRef = useRef(null)
  const invalidNarrationTimerRef = useRef(null)
  const jumpSoundsRef = useRef([])
  const jumpVariantRef = useRef(0)
  const directionHintSoundsRef = useRef({})
  const directionButtonSoundsRef = useRef({})
  const invalidMoveAudioRefs = useRef({ outside: [], rock: [], bush: [] })
  const lastInvalidMoveIndexRef = useRef({ outside: null, rock: null, bush: null })
  const activeNarrationAudioRef = useRef(null)
  const level = LEVELS[levelIndex]
  const guidePath = getGuidePath(position, level.goal, level.obstacles)
  const guidePoints = getGuidePoints(guidePath)
  const nextPathDirection = getNextPathDirection(guidePath)

  useEffect(() => {
    const sounds = [jumpSoundOne, jumpSoundTwo].map((source) => {
      const audio = new Audio(source)
      audio.preload = 'auto'
      audio.volume = 0.62
      return audio
    })
    jumpSoundsRef.current = sounds

    const handleHintPlay = (event) => {
      activeNarrationAudioRef.current = event.currentTarget
      setIsSpeaking(true)
    }
    const handleHintFinish = (event) => {
      if (activeNarrationAudioRef.current !== event.currentTarget) return
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
      setActiveHintDirection(null)
    }
    const createNarrationAudio = (source) => {
      const audio = new Audio(source)
      audio.preload = 'auto'
      audio.volume = 0.9
      audio.addEventListener('play', handleHintPlay)
      audio.addEventListener('ended', handleHintFinish)
      audio.addEventListener('error', handleHintFinish)
      audio.load()
      return audio
    }
    const hintSounds = Object.fromEntries(
      Object.entries(DIRECTION_HINT_SOUNDS)
        .map(([direction, source]) => [direction, createNarrationAudio(source)]),
    )
    const buttonSounds = Object.fromEntries(
      Object.entries(DIRECTION_BUTTON_SOUNDS)
        .map(([direction, source]) => [direction, createNarrationAudio(source)]),
    )
    const invalidMoveSounds = Object.fromEntries(
      Object.entries(INVALID_MOVE_NARRATION_SOUNDS)
        .map(([reason, sources]) => [reason, sources.map(createNarrationAudio)]),
    )
    directionHintSoundsRef.current = hintSounds
    directionButtonSoundsRef.current = buttonSounds
    invalidMoveAudioRefs.current = invalidMoveSounds
    const narrationSounds = [
      ...Object.values(hintSounds),
      ...Object.values(buttonSounds),
      ...Object.values(invalidMoveSounds).flat(),
    ]

    return () => {
      sounds.forEach((audio) => {
        audio.pause()
        audio.currentTime = 0
      })
      narrationSounds.forEach((audio) => {
        audio.pause()
        audio.removeEventListener('play', handleHintPlay)
        audio.removeEventListener('ended', handleHintFinish)
        audio.removeEventListener('error', handleHintFinish)
      })
      directionHintSoundsRef.current = {}
      directionButtonSoundsRef.current = {}
      invalidMoveAudioRefs.current = { outside: [], rock: [], bush: [] }
      activeNarrationAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!muted) return
    jumpSoundsRef.current.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    activeNarrationAudioRef.current?.pause()
    activeNarrationAudioRef.current = null
    window.clearTimeout(invalidNarrationTimerRef.current)
  }, [muted])

  useEffect(() => () => {
    window.clearTimeout(nextLevelTimerRef.current)
    window.clearTimeout(idleHintTimerRef.current)
    window.clearTimeout(invalidNarrationTimerRef.current)
  }, [])

  const playDirectionHint = useCallback(() => {
    if (muted || levelSolved || completed || !nextPathDirection) return
    const audio = directionHintSoundsRef.current[nextPathDirection]
    if (!audio) return

    if (activeNarrationAudioRef.current && activeNarrationAudioRef.current !== audio) {
      activeNarrationAudioRef.current.pause()
    }
    audio.pause()
    if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
    setActiveHintDirection(nextPathDirection)
    void audio.play().catch(() => {
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
      setActiveHintDirection(null)
      audio.load()
      console.warn('No se pudo reproducir la pista de direcciones.')
    })
  }, [completed, levelSolved, muted, nextPathDirection])

  const playDirectionButtonAudio = useCallback((direction) => {
    if (muted) return
    const audio = directionButtonSoundsRef.current[direction]
    if (!audio) return

    if (activeNarrationAudioRef.current && activeNarrationAudioRef.current !== audio) {
      activeNarrationAudioRef.current.pause()
    }
    setActiveHintDirection(null)
    audio.pause()
    if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
    void audio.play().catch(() => {
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
      audio.load()
      console.warn('No se pudo reproducir el nombre de la dirección.')
    })
  }, [muted])

  const playInvalidMoveNarration = useCallback((reason) => {
    const audios = invalidMoveAudioRefs.current[reason] ?? []
    if (muted || audios.length === 0) return

    const previousIndex = lastInvalidMoveIndexRef.current[reason]
    const availableIndexes = audios
      .map((_, index) => index)
      .filter((index) => index !== previousIndex)
    const nextIndex = audios.length === 1
      ? 0
      : availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
    const audio = audios[nextIndex]
    lastInvalidMoveIndexRef.current[reason] = nextIndex

    if (activeNarrationAudioRef.current && activeNarrationAudioRef.current !== audio) {
      activeNarrationAudioRef.current.pause()
    }
    setActiveHintDirection(null)
    audio.pause()
    audio.load()
    void audio.play().catch(() => {
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
      audio.load()
      console.warn('No se pudo reproducir el mensaje de movimiento inválido.')
    })
  }, [muted])

  const restartIdleHintTimer = useCallback(() => {
    window.clearTimeout(idleHintTimerRef.current)
    if (levelSolved || completed || !isPageActive()) return
    idleHintTimerRef.current = window.setTimeout(() => {
      if (isPageActive()) playDirectionHint()
    }, IDLE_HINT_DELAY)
  }, [completed, levelSolved, playDirectionHint])

  useEffect(() => {
    const suspendIdleHintTimer = () => {
      window.clearTimeout(idleHintTimerRef.current)
      window.clearTimeout(invalidNarrationTimerRef.current)
      activeNarrationAudioRef.current?.pause()
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
      setActiveHintDirection(null)
    }
    const handleVisibilityChange = () => {
      if (isPageActive()) restartIdleHintTimer()
      else suspendIdleHintTimer()
    }

    restartIdleHintTimer()
    window.addEventListener('pointerdown', restartIdleHintTimer, true)
    window.addEventListener('keydown', restartIdleHintTimer, true)
    window.addEventListener('focus', restartIdleHintTimer)
    window.addEventListener('blur', suspendIdleHintTimer)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      suspendIdleHintTimer()
      window.removeEventListener('pointerdown', restartIdleHintTimer, true)
      window.removeEventListener('keydown', restartIdleHintTimer, true)
      window.removeEventListener('focus', restartIdleHintTimer)
      window.removeEventListener('blur', suspendIdleHintTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [restartIdleHintTimer])

  const moveRabbit = useCallback((direction) => {
    if (levelSolved || completed) return

    const movement = MOVEMENTS[direction]
    const next = { x: position.x + movement.x, y: position.y + movement.y }
    const outside = next.x < 0 || next.x >= BOARD_COLUMNS || next.y < 0 || next.y >= BOARD_ROWS
    const obstacle = level.obstacles.find((item) => item.x === next.x && item.y === next.y)

    if (outside) {
      playMiss()
      window.clearTimeout(invalidNarrationTimerRef.current)
      invalidNarrationTimerRef.current = window.setTimeout(
        () => playInvalidMoveNarration('outside'),
        450,
      )
      setFeedback({ title: '¡Por ahí no!', message: 'Prueba con otra dirección.' })
      return
    }

    if (obstacle) {
      playMiss()
      window.clearTimeout(invalidNarrationTimerRef.current)
      invalidNarrationTimerRef.current = window.setTimeout(
        () => playInvalidMoveNarration(obstacle.type),
        450,
      )
      setFeedback(obstacle.type === 'rock'
        ? { title: '¡Una roca gigante!', message: 'La roca bloquea el paso. Busca otro camino.' }
        : { title: '¡Un arbusto enredado!', message: 'El conejito no puede pasar. Prueba por otro lado.' })
      return
    }

    setPosition(next)
    window.clearTimeout(invalidNarrationTimerRef.current)
    setMoveCount((count) => count + 1)
    setFeedback(null)

    if (!muted && jumpSoundsRef.current.length) {
      const sound = jumpSoundsRef.current[jumpVariantRef.current]
      jumpVariantRef.current = (jumpVariantRef.current + 1) % jumpSoundsRef.current.length
      sound.pause()
      sound.currentTime = 0
      sound.play().catch(() => {})
    }
    playDirectionButtonAudio(direction)

    if (next.x === level.goal.x && next.y === level.goal.y) {
      playLevelComplete()
      setLevelSolved(true)
      setFeedback({ title: '¡Llegaste a la madriguera!', message: 'Muy bien, encontraste el camino.' })
      nextLevelTimerRef.current = window.setTimeout(() => {
        if (levelIndex === TOTAL_LEVELS - 1) {
          setCompleted(true)
          return
        }

        const nextLevelIndex = levelIndex + 1
        setLevelIndex(nextLevelIndex)
        setPosition(LEVELS[nextLevelIndex].start)
        setFeedback(null)
        setLevelSolved(false)
      }, 1100)
    }
  }, [completed, level, levelIndex, levelSolved, muted, playDirectionButtonAudio, playInvalidMoveNarration, position])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const keyDirections = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
      const direction = keyDirections[event.key]
      if (!direction) return
      event.preventDefault()
      moveRabbit(direction)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveRabbit])

  const restart = () => {
    window.clearTimeout(nextLevelTimerRef.current)
    setLevelIndex(0)
    setPosition(LEVELS[0].start)
    setFeedback(null)
    setLevelSolved(false)
    setCompleted(false)
    setMoveCount(0)
  }

  return (
    <main className="directions-game">
      <header className="directions-header">
        <div className="directions-status">
          <img src={game.icon} alt="" />
          <span>
            <strong>Direcciones</strong>
            <span className="directions-progress" aria-label={`Nivel ${levelIndex + 1} de ${TOTAL_LEVELS}`}>
              {Array.from({ length: TOTAL_LEVELS }, (_, index) => <i className={index <= levelIndex ? 'is-filled' : ''} key={index} />)}
            </span>
          </span>
        </div>
        <div className="directions-header__actions">
          <button
            type="button"
            className="round-button"
            onClick={() => {
              activeNarrationAudioRef.current?.pause()
              activeNarrationAudioRef.current = null
              setIsSpeaking(false)
              setActiveHintDirection(null)
              onToggleSound()
            }}
            aria-label={muted ? 'Activar sonidos' : 'Silenciar sonidos'}
          >
            <SoundIcon muted={muted} />
          </button>
          <button type="button" className="home-button" onClick={onBack} aria-label="Volver al lobby">
            <HomeIcon />
          </button>
        </div>
      </header>

      <section className="directions-stage">
        <div className="directions-guide">
          <LobbyMascot className="directions-guide__mascot" talking={isSpeaking} />
          <div>
            <h1>{feedback?.title ?? '¡Lleva al conejo hasta la madriguera!'}</h1>
            <p>{feedback?.message ?? 'Usa las flechas para moverte.'}</p>
          </div>
          <button type="button" className="directions-guide__sound" onClick={playDirectionHint} aria-label="Escuchar una pista">
            <HintIcon />
          </button>
        </div>

        <div className="directions-board" aria-label="Camino hacia la madriguera">
          {Array.from({ length: BOARD_COLUMNS * BOARD_ROWS }, (_, index) => (
            <i className={`directions-tile directions-tile--${getTileType(index)}`} key={index} />
          ))}
          <svg className="directions-guide-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="directions-path-arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L4,2 L0,4 Z" />
              </marker>
            </defs>
            <polyline className="directions-guide-path__halo" points={guidePoints} />
            <polyline className="directions-guide-path__line" points={guidePoints} markerEnd="url(#directions-path-arrow)" />
          </svg>
          {level.obstacles.map((obstacle) => (
            <span className="directions-position" style={getCellStyle(obstacle)} key={`${obstacle.x}-${obstacle.y}`}>
              <DirectionSprite type={obstacle.type} className="directions-board__piece" />
            </span>
          ))}
          <span className="directions-position" style={getCellStyle(level.goal)}>
            <DirectionSprite type="burrow" className="directions-board__piece directions-board__piece--burrow" />
          </span>
          <span
            className={`directions-position directions-position--rabbit${levelSolved ? ' is-entering-burrow' : ''}`}
            style={getCellStyle(position)}
            key={`rabbit-${levelIndex}`}
          >
            <DirectionSprite type="rabbit" className="directions-board__piece directions-board__piece--rabbit" key={moveCount} />
          </span>
        </div>

        <div className="directions-controls" aria-label="Controles de movimiento">
          {['up', 'down', 'left', 'right'].map((direction) => (
            <button
              type="button"
              className={`direction-button direction-button--${direction} ${activeHintDirection === direction ? 'is-hint-active' : ''}`}
              onClick={() => moveRabbit(direction)}
              aria-label={DIRECTION_LABELS[direction]}
              key={direction}
            >
              <ArrowIcon direction={direction} />
            </button>
          ))}
        </div>
      </section>

      {levelSolved && <LevelConfetti />}

      {completed && (
        <div className="directions-complete" role="dialog" aria-modal="true" aria-labelledby="directions-complete-title">
          <div>
            <h2 id="directions-complete-title">¡Llegaste!</h2>
            <p>Ayudaste al conejo a encontrar todos los caminos.</p>
            <div className="directions-complete__actions">
              <button type="button" onClick={restart} aria-label="Jugar otra vez"><RestartIcon /></button>
              <button type="button" className="is-home" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default DirectionsGame
