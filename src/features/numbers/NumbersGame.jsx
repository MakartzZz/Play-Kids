import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LobbyMascot from '../../components/LobbyMascot.jsx'
import LevelConfetti from '../../components/LevelConfetti.jsx'
import { HintIcon, HomeIcon, RestartIcon, SoundIcon } from '../../components/UiIcons.jsx'
import { playCorrect, playLevelComplete, playMiss } from '../../hooks/useInterfaceSounds.js'
import { isPageActive } from '../../utils/pageActivity.js'
import { getBufferedAudio } from '../../utils/audioPool.js'
import appleGroupSound from '../../assets/sounds/numbers/groups/apple.mp3'
import backpackGroupSound from '../../assets/sounds/numbers/groups/backpack.mp3'
import ballGroupSound from '../../assets/sounds/numbers/groups/ball.mp3'
import fireTruckGroupSound from '../../assets/sounds/numbers/groups/fire-truck.mp3'
import fishGroupSound from '../../assets/sounds/numbers/groups/fish.mp3'
import frogGroupSound from '../../assets/sounds/numbers/groups/frog.mp3'
import grapesGroupSound from '../../assets/sounds/numbers/groups/grapes.mp3'
import kiteGroupSound from '../../assets/sounds/numbers/groups/kite.mp3'
import leafGroupSound from '../../assets/sounds/numbers/groups/leaf.mp3'
import orangeGroupSound from '../../assets/sounds/numbers/groups/orange.mp3'
import numbersCorrectSound1 from '../../assets/sounds/numbers/feedback/correct-1.mp3'
import numbersCorrectSound2 from '../../assets/sounds/numbers/feedback/correct-2.mp3'
import numbersCorrectSound3 from '../../assets/sounds/numbers/feedback/correct-3.mp3'
import numbersErrorSound1 from '../../assets/sounds/numbers/feedback/error-1.mp3'
import numbersErrorSound2 from '../../assets/sounds/numbers/feedback/error-2.mp3'
import numbersErrorSound3 from '../../assets/sounds/numbers/feedback/error-3.mp3'
import numbersHintSound from '../../assets/sounds/numbers/hints/general.mp3'
import numberOneSound from '../../assets/sounds/numbers/targets/1.mp3'
import numberTwoSound from '../../assets/sounds/numbers/targets/2.mp3'
import numberThreeSound from '../../assets/sounds/numbers/targets/3.mp3'
import numberFourSound from '../../assets/sounds/numbers/targets/4.mp3'
import numberFiveSound from '../../assets/sounds/numbers/targets/5.mp3'
import './numbers.css'

const TOTAL_LEVELS = 5
const IDLE_HINT_DELAY = 40000
const INSTRUCTION = 'Cuenta los objetos y colócalos debajo del número correcto.'

const NUMBER_TARGET_SOUNDS = {
  1: numberOneSound,
  2: numberTwoSound,
  3: numberThreeSound,
  4: numberFourSound,
  5: numberFiveSound,
}

const GROUP_SOUND_BY_SPRITE = {
  apple: appleGroupSound,
  'fire-truck': fireTruckGroupSound,
  ball: ballGroupSound,
  backpack: backpackGroupSound,
  frog: frogGroupSound,
  leaf: leafGroupSound,
  grapes: grapesGroupSound,
  kite: kiteGroupSound,
  orange: orangeGroupSound,
  fish: fishGroupSound,
}

const CORRECT_NARRATION_SOUNDS = [numbersCorrectSound1, numbersCorrectSound2, numbersCorrectSound3]
const ERROR_NARRATION_SOUNDS = [numbersErrorSound1, numbersErrorSound2, numbersErrorSound3]

const LEVEL_SPRITES = [
  ['apple', 'ball', 'frog', 'grapes', 'orange'],
  ['fire-truck', 'backpack', 'leaf', 'kite', 'fish'],
  ['apple', 'backpack', 'frog', 'kite', 'orange'],
  ['fire-truck', 'ball', 'leaf', 'grapes', 'fish'],
  ['apple', 'ball', 'leaf', 'kite', 'orange'],
]

const SPRITE_NAMES = {
  apple: 'manzana',
  'fire-truck': 'camión de bomberos',
  ball: 'pelota',
  backpack: 'mochila',
  duck: 'patito',
  'toy-star': 'estrella',
  frog: 'rana',
  leaf: 'hoja',
  grapes: 'uvas',
  kite: 'cometa',
  fish: 'pez',
  orange: 'naranja',
  teddy: 'osito',
  acorn: 'bellota',
  flower: 'flor',
  cupcake: 'pastelito',
}

const shuffle = (items) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

function NumberObjects({ count, sprite, small = false }) {
  return (
    <span className={`number-objects ${small ? 'is-small' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i className={`number-sprite number-sprite--${sprite}`} key={index} />
      ))}
    </span>
  )
}

function NumbersGame({ game, muted, onToggleSound, onBack }) {
  const [levelIndex, setLevelIndex] = useState(0)
  const [placedCounts, setPlacedCounts] = useState([])
  const [selectedCount, setSelectedCount] = useState(null)
  const [drag, setDrag] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [completed, setCompleted] = useState(false)
  const nextLevelTimerRef = useRef(null)
  const idleHintTimerRef = useRef(null)
  const correctNarrationTimerRef = useRef(null)
  const errorNarrationTimerRef = useRef(null)
  const hintAudioRef = useRef(null)
  const targetAudioRefs = useRef({})
  const groupAudioRefs = useRef({})
  const correctAudioRefs = useRef([])
  const errorAudioRefs = useRef([])
  const activeNarrationAudioRef = useRef(null)
  const lastCorrectNarrationIndexRef = useRef(null)
  const lastErrorNarrationIndexRef = useRef(null)

  const groups = useMemo(() => shuffle(LEVEL_SPRITES[levelIndex].map((sprite, index) => ({
    count: index + 1,
    sprite,
    name: SPRITE_NAMES[sprite],
  }))), [levelIndex])

  useEffect(() => {
    const handlePlay = (event) => {
      activeNarrationAudioRef.current = event.currentTarget
      setIsSpeaking(true)
    }
    const handleFinish = (event) => {
      if (activeNarrationAudioRef.current !== event.currentTarget) return
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
    }
    const createNarrationAudio = (source) => {
      const audio = getBufferedAudio(source)
      audio.volume = 0.9
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('ended', handleFinish)
      audio.addEventListener('error', handleFinish)
      return audio
    }

    const hintAudio = createNarrationAudio(numbersHintSound)
    const targetAudios = Object.fromEntries(
      Object.entries(NUMBER_TARGET_SOUNDS)
        .map(([number, source]) => [number, createNarrationAudio(source)]),
    )
    const groupAudios = Object.fromEntries(
      Object.entries(GROUP_SOUND_BY_SPRITE)
        .map(([sprite, source]) => [sprite, createNarrationAudio(source)]),
    )
    const correctAudios = CORRECT_NARRATION_SOUNDS.map(createNarrationAudio)
    const errorAudios = ERROR_NARRATION_SOUNDS.map(createNarrationAudio)
    const allAudios = [
      hintAudio,
      ...Object.values(targetAudios),
      ...Object.values(groupAudios),
      ...correctAudios,
      ...errorAudios,
    ]
    hintAudioRef.current = hintAudio
    targetAudioRefs.current = targetAudios
    groupAudioRefs.current = groupAudios
    correctAudioRefs.current = correctAudios
    errorAudioRefs.current = errorAudios

    return () => {
      window.clearTimeout(nextLevelTimerRef.current)
      window.clearTimeout(idleHintTimerRef.current)
      window.clearTimeout(correctNarrationTimerRef.current)
      window.clearTimeout(errorNarrationTimerRef.current)
      allAudios.forEach((audio) => {
        audio.pause()
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('ended', handleFinish)
        audio.removeEventListener('error', handleFinish)
      })
      hintAudioRef.current = null
      targetAudioRefs.current = {}
      groupAudioRefs.current = {}
      correctAudioRefs.current = []
      errorAudioRefs.current = []
      activeNarrationAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!muted) return
    window.clearTimeout(correctNarrationTimerRef.current)
    window.clearTimeout(errorNarrationTimerRef.current)
    activeNarrationAudioRef.current?.pause()
    activeNarrationAudioRef.current = null
  }, [muted])

  const playNarration = useCallback((audio) => {
    if (muted || !audio) return

    if (activeNarrationAudioRef.current && activeNarrationAudioRef.current !== audio) {
      activeNarrationAudioRef.current.pause()
    }
    audio.pause()
    if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
    void audio.play().catch(() => {
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
      console.warn('No se pudo reproducir una narración de números.')
    })
  }, [muted])

  const playHint = useCallback(() => {
    if (completed) return
    playNarration(hintAudioRef.current)
  }, [completed, playNarration])

  const playNumberTarget = useCallback((number) => {
    playNarration(targetAudioRefs.current[number])
  }, [playNarration])

  const playGroupName = useCallback((sprite) => {
    playNarration(groupAudioRefs.current[sprite])
  }, [playNarration])

  const playRandomCorrectNarration = useCallback(() => {
    const audios = correctAudioRefs.current
    if (muted || audios.length === 0) return

    const previousIndex = lastCorrectNarrationIndexRef.current
    const availableIndexes = audios
      .map((_, index) => index)
      .filter((index) => index !== previousIndex)
    const nextIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
    lastCorrectNarrationIndexRef.current = nextIndex
    playNarration(audios[nextIndex])
  }, [muted, playNarration])

  const playRandomErrorNarration = useCallback(() => {
    const audios = errorAudioRefs.current
    if (muted || audios.length === 0) return

    const previousIndex = lastErrorNarrationIndexRef.current
    const availableIndexes = audios
      .map((_, index) => index)
      .filter((index) => index !== previousIndex)
    const nextIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
    lastErrorNarrationIndexRef.current = nextIndex
    playNarration(audios[nextIndex])
  }, [muted, playNarration])

  const restartIdleHintTimer = useCallback(() => {
    window.clearTimeout(idleHintTimerRef.current)
    if (completed || !isPageActive()) return
    idleHintTimerRef.current = window.setTimeout(() => {
      if (isPageActive()) playHint()
    }, IDLE_HINT_DELAY)
  }, [completed, playHint])

  useEffect(() => {
    const suspendIdleHintTimer = () => {
      window.clearTimeout(idleHintTimerRef.current)
      window.clearTimeout(correctNarrationTimerRef.current)
      window.clearTimeout(errorNarrationTimerRef.current)
      activeNarrationAudioRef.current?.pause()
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
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

  const advanceLevel = () => {
    if (levelIndex === TOTAL_LEVELS - 1) {
      setCompleted(true)
      return
    }
    setLevelIndex((current) => current + 1)
    setPlacedCounts([])
    setSelectedCount(null)
    setFeedback(null)
  }

  const placeGroup = (count, targetNumber) => {
    if (!count || placedCounts.includes(count)) return
    setSelectedCount(null)

    if (count !== targetNumber) {
      playMiss()
      window.clearTimeout(correctNarrationTimerRef.current)
      window.clearTimeout(errorNarrationTimerRef.current)
      errorNarrationTimerRef.current = window.setTimeout(playRandomErrorNarration, 450)
      setFeedback({ title: 'Inténtalo otra vez', message: 'Cuenta cada objeto con calma.' })
      return
    }

    const nextPlaced = [...placedCounts, count]
    setPlacedCounts(nextPlaced)
    playCorrect()
    window.clearTimeout(correctNarrationTimerRef.current)
    window.clearTimeout(errorNarrationTimerRef.current)
    setFeedback({ title: '¡Muy bien!', message: `${count} ${count === 1 ? 'objeto' : 'objetos'} van con el número ${count}.` })

    if (nextPlaced.length === 5) {
      playLevelComplete()
      nextLevelTimerRef.current = window.setTimeout(advanceLevel, 1100)
    } else {
      correctNarrationTimerRef.current = window.setTimeout(playRandomCorrectNarration, 450)
    }
  }

  const handlePointerDown = (event, count) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({
      count,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: 0,
      y: 0,
      moved: false,
    })
  }

  const handlePointerMove = (event, count) => {
    if (drag?.count !== count || drag.pointerId !== event.pointerId) return
    const x = event.clientX - drag.startX
    const y = event.clientY - drag.startY
    setDrag((current) => current ? { ...current, x, y, moved: current.moved || Math.hypot(x, y) > 8 } : current)
  }

  const handlePointerUp = (event, count) => {
    if (drag?.count !== count) return
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-number-target]')
    if (target) {
      placeGroup(count, Number(target.dataset.numberTarget))
    } else if (!drag.moved) {
      const willSelect = selectedCount !== count
      setSelectedCount(willSelect ? count : null)
      if (willSelect) {
        const group = groups.find((item) => item.count === count)
        if (group) playGroupName(group.sprite)
      }
    }
    setDrag(null)
  }

  const restart = () => {
    window.clearTimeout(nextLevelTimerRef.current)
    setLevelIndex(0)
    setPlacedCounts([])
    setSelectedCount(null)
    setDrag(null)
    setFeedback(null)
    setCompleted(false)
  }

  return (
    <main className="numbers-game">
      <header className="numbers-header">
        <div className="numbers-status">
          <img src={game.icon} alt="" />
          <span>
            <strong>Números</strong>
            <span className="numbers-progress" aria-label={`Nivel ${levelIndex + 1} de ${TOTAL_LEVELS}`}>
              {Array.from({ length: TOTAL_LEVELS }, (_, index) => <i className={index <= levelIndex ? 'is-filled' : ''} key={index} />)}
            </span>
          </span>
        </div>
        <div className="numbers-header__actions">
          <button
            type="button"
            className="round-button"
            onClick={() => {
              activeNarrationAudioRef.current?.pause()
              activeNarrationAudioRef.current = null
              setIsSpeaking(false)
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

      <section className="numbers-stage">
        <div className="numbers-guide">
          <LobbyMascot className="numbers-guide__mascot" talking={isSpeaking} />
          <div>
            <h1>{feedback?.title ?? '¡Contemos juntos!'}</h1>
            <p>{feedback?.message ?? INSTRUCTION}</p>
          </div>
          <button type="button" className="numbers-guide__sound" onClick={playHint} aria-label="Escuchar una pista">
            <HintIcon />
          </button>
        </div>

        <div className="numbers-targets" aria-label="Números del uno al cinco">
          {Array.from({ length: 5 }, (_, index) => {
            const number = index + 1
            const group = groups.find((item) => item.count === number)
            const isPlaced = placedCounts.includes(number)
            return (
              <button
                type="button"
                className={`numbers-target numbers-target--${number} ${selectedCount ? 'is-ready' : ''}`}
                data-number-target={number}
                onClick={() => {
                  if (selectedCount) placeGroup(selectedCount, number)
                  else playNumberTarget(number)
                }}
                aria-label={`Número ${number}`}
                key={number}
              >
                <strong>{number}</strong>
                <span className="numbers-target__drop">
                  {isPlaced && <NumberObjects count={number} sprite={group.sprite} small />}
                </span>
              </button>
            )
          })}
        </div>

        <div className="numbers-tray" aria-label="Grupos de objetos para contar">
          {groups.map((group) => {
            if (placedCounts.includes(group.count)) return null
            const isDragging = drag?.count === group.count
            return (
              <button
                type="button"
                className={`numbers-group ${selectedCount === group.count ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
                key={group.count}
                onPointerDown={(event) => handlePointerDown(event, group.count)}
                onPointerMove={(event) => handlePointerMove(event, group.count)}
                onPointerUp={(event) => handlePointerUp(event, group.count)}
                onPointerCancel={() => setDrag(null)}
                style={isDragging ? { '--drag-x': `${drag.x}px`, '--drag-y': `${drag.y}px` } : undefined}
                aria-label={`${group.count} ${group.name}${group.count === 1 ? '' : 's'}`}
                aria-pressed={selectedCount === group.count}
              >
                <NumberObjects count={group.count} sprite={group.sprite} />
              </button>
            )
          })}
        </div>
      </section>

      {placedCounts.length === 5 && <LevelConfetti />}

      {completed && (
        <div className="numbers-complete" role="dialog" aria-modal="true" aria-labelledby="numbers-complete-title">
          <div>
            <h2 id="numbers-complete-title">¡Lo lograste!</h2>
            <p>Relacionaste todos los números con sus cantidades.</p>
            <div className="numbers-complete__actions">
              <button type="button" onClick={restart} aria-label="Jugar otra vez"><RestartIcon /></button>
              <button type="button" className="is-secondary" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default NumbersGame
