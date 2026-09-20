import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LobbyMascot from '../../components/LobbyMascot.jsx'
import LevelConfetti from '../../components/LevelConfetti.jsx'
import { HintIcon, HomeIcon, RestartIcon, SoundIcon } from '../../components/UiIcons.jsx'
import { playCorrect, playLevelComplete, playMiss } from '../../hooks/useInterfaceSounds.js'
import { isPageActive } from '../../utils/pageActivity.js'
import { getBufferedAudio } from '../../utils/audioPool.js'
import patternsErrorSound from '../../assets/sounds/patterns/feedback/error.mp3'
import patternsHintSound from '../../assets/sounds/patterns/hints/general.mp3'
import circleSound1 from '../../assets/sounds/patterns/shapes/circle-1.mp3'
import circleSound2 from '../../assets/sounds/patterns/shapes/circle-2.mp3'
import heartSound1 from '../../assets/sounds/patterns/shapes/heart-1.mp3'
import heartSound2 from '../../assets/sounds/patterns/shapes/heart-2.mp3'
import squareSound1 from '../../assets/sounds/patterns/shapes/square-1.mp3'
import squareSound2 from '../../assets/sounds/patterns/shapes/square-2.mp3'
import starSound1 from '../../assets/sounds/patterns/shapes/star-1.mp3'
import starSound2 from '../../assets/sounds/patterns/shapes/star-2.mp3'
import triangleSound1 from '../../assets/sounds/patterns/shapes/triangle-1.mp3'
import triangleSound2 from '../../assets/sounds/patterns/shapes/triangle-2.mp3'
import doYouKnowSound from '../../assets/sounds/patterns/prompts/do-you-know.mp3'
import starImage from '../../assets/patterns/star-red.png'
import circleImage from '../../assets/patterns/circle-blue.png'
import triangleImage from '../../assets/patterns/triangle-yellow.png'
import squareImage from '../../assets/patterns/square-green.png'
import heartImage from '../../assets/patterns/heart-purple.png'
import './patterns.css'

const INSTRUCTION = 'Observa la secuencia y elige la figura que continúa.'
const IDLE_HINT_DELAY = 40000

const SHAPE_SOUNDS = {
  circle: [circleSound1, circleSound2],
  heart: [heartSound1, heartSound2],
  square: [squareSound1, squareSound2],
  star: [starSound1, starSound2],
  triangle: [triangleSound1, triangleSound2],
}

const LEVELS = [
  {
    sequence: [['star', 'red'], ['circle', 'blue'], ['triangle', 'yellow'], ['star', 'red'], ['circle', 'blue']],
    answer: ['triangle', 'yellow'],
    choices: [['circle', 'blue'], ['triangle', 'yellow'], ['square', 'green'], ['heart', 'purple']],
  },
  {
    sequence: [['heart', 'purple'], ['square', 'green'], ['heart', 'purple'], ['square', 'green'], ['heart', 'purple']],
    answer: ['square', 'green'],
    choices: [['star', 'red'], ['heart', 'purple'], ['square', 'green'], ['circle', 'blue']],
  },
  {
    sequence: [['circle', 'blue'], ['circle', 'blue'], ['star', 'red'], ['circle', 'blue'], ['circle', 'blue']],
    answer: ['star', 'red'],
    choices: [['triangle', 'yellow'], ['circle', 'blue'], ['heart', 'purple'], ['star', 'red']],
  },
  {
    sequence: [['triangle', 'yellow'], ['square', 'green'], ['heart', 'purple'], ['triangle', 'yellow'], ['square', 'green']],
    answer: ['heart', 'purple'],
    choices: [['heart', 'purple'], ['circle', 'blue'], ['star', 'red'], ['square', 'green']],
  },
  {
    sequence: [['star', 'red'], ['star', 'red'], ['circle', 'blue'], ['star', 'red'], ['star', 'red']],
    answer: ['circle', 'blue'],
    choices: [['heart', 'purple'], ['square', 'green'], ['star', 'red'], ['circle', 'blue']],
  },
]

const SHAPE_IMAGES = {
  star: starImage,
  circle: circleImage,
  triangle: triangleImage,
  square: squareImage,
  heart: heartImage,
}

const shuffle = (items) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

const shapeKey = ([shape, color]) => `${shape}-${color}`

function PatternShape({ item, small = false }) {
  const [shape] = item
  return (
    <img
      className={`pattern-shape ${small ? 'is-small' : ''}`}
      src={SHAPE_IMAGES[shape]}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  )
}

function PatternsGame({ game, muted, onToggleSound, onBack }) {
  const [levels, setLevels] = useState(() => shuffle(LEVELS))
  const [levelIndex, setLevelIndex] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [solved, setSolved] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [readingPatternIndex, setReadingPatternIndex] = useState(-1)
  const timerRef = useRef(null)
  const idleHintTimerRef = useRef(null)
  const errorNarrationTimerRef = useRef(null)
  const hintAudioRef = useRef(null)
  const errorAudioRef = useRef(null)
  const shapeAudioRefs = useRef({})
  const doYouKnowAudioRef = useRef(null)
  const activeNarrationAudioRef = useRef(null)
  const cancelClipRef = useRef(null)
  const narrationRunRef = useRef(0)
  const lastShapeVariantRef = useRef({})
  const autoReadLevelRef = useRef(null)
  const level = levels[levelIndex]
  const choices = useMemo(() => shuffle(level.choices), [level])

  useEffect(() => {
    const createNarrationAudio = (source) => {
      const audio = getBufferedAudio(source)
      audio.volume = 0.9
      return audio
    }
    const hintAudio = createNarrationAudio(patternsHintSound)
    const errorAudio = createNarrationAudio(patternsErrorSound)
    const shapeAudios = Object.fromEntries(
      Object.entries(SHAPE_SOUNDS).map(([shape, sources]) => [
        shape,
        sources.map(createNarrationAudio),
      ]),
    )
    const doYouKnowAudio = createNarrationAudio(doYouKnowSound)
    const allAudios = [hintAudio, errorAudio, doYouKnowAudio, ...Object.values(shapeAudios).flat()]

    hintAudioRef.current = hintAudio
    errorAudioRef.current = errorAudio
    shapeAudioRefs.current = shapeAudios
    doYouKnowAudioRef.current = doYouKnowAudio

    return () => {
      window.clearTimeout(timerRef.current)
      window.clearTimeout(idleHintTimerRef.current)
      window.clearTimeout(errorNarrationTimerRef.current)
      narrationRunRef.current += 1
      cancelClipRef.current?.()
      allAudios.forEach((audio) => audio.pause())
      hintAudioRef.current = null
      errorAudioRef.current = null
      shapeAudioRefs.current = {}
      doYouKnowAudioRef.current = null
      activeNarrationAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!muted) return
    const activeAudio = activeNarrationAudioRef.current
    narrationRunRef.current += 1
    cancelClipRef.current?.()
    activeAudio?.pause()
    activeNarrationAudioRef.current = null
  }, [muted])

  const playClip = useCallback((audio) => new Promise((resolve) => {
    if (!audio) {
      resolve(false)
      return
    }

    let finished = false
    const finish = (played) => {
      if (finished) return
      finished = true
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      if (activeNarrationAudioRef.current === audio) activeNarrationAudioRef.current = null
      if (cancelClipRef.current === cancel) cancelClipRef.current = null
      resolve(played)
    }
    const handleEnded = () => finish(true)
    const handleError = () => finish(false)
    const cancel = () => finish(false)

    audio.pause()
    if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    activeNarrationAudioRef.current = audio
    cancelClipRef.current = cancel
    setIsSpeaking(true)
    void audio.play().catch(() => {
      finish(false)
    })
  }), [])

  const stopNarration = useCallback(() => {
    const activeAudio = activeNarrationAudioRef.current
    window.clearTimeout(errorNarrationTimerRef.current)
    narrationRunRef.current += 1
    cancelClipRef.current?.()
    activeAudio?.pause()
    activeNarrationAudioRef.current = null
    setIsSpeaking(false)
    setReadingPatternIndex(-1)
  }, [])

  const playSingleNarration = useCallback(async (audio) => {
    if (muted || !audio) return
    stopNarration()
    const run = narrationRunRef.current
    await playClip(audio)
    if (narrationRunRef.current === run) setIsSpeaking(false)
  }, [muted, playClip, stopNarration])

  const getNextShapeAudio = useCallback((shape) => {
    const audios = shapeAudioRefs.current[shape]
    if (!audios?.length) return null
    const previousIndex = lastShapeVariantRef.current[shape]
    const availableIndexes = audios
      .map((_, index) => index)
      .filter((index) => index !== previousIndex)
    const nextIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
    lastShapeVariantRef.current[shape] = nextIndex
    return audios[nextIndex]
  }, [])

  const playHint = useCallback(() => {
    if (completed) return
    void playSingleNarration(hintAudioRef.current)
  }, [completed, playSingleNarration])

  const playShapeName = useCallback((shape) => {
    void playSingleNarration(getNextShapeAudio(shape))
  }, [getNextShapeAudio, playSingleNarration])

  const readPattern = useCallback(async () => {
    if (muted || completed) return
    stopNarration()
    const run = narrationRunRef.current

    for (const [index, [shape]] of level.sequence.entries()) {
      if (narrationRunRef.current !== run) return
      setReadingPatternIndex(index)
      const played = await playClip(getNextShapeAudio(shape))
      if (!played || narrationRunRef.current !== run) {
        if (narrationRunRef.current === run) setReadingPatternIndex(-1)
        return
      }
    }

    await playClip(doYouKnowAudioRef.current)
    if (narrationRunRef.current === run) {
      setIsSpeaking(false)
      setReadingPatternIndex(-1)
    }
  }, [completed, getNextShapeAudio, level.sequence, muted, playClip, stopNarration])

  useEffect(() => {
    if (autoReadLevelRef.current === levelIndex) return undefined
    if (muted || completed || !isPageActive()) return undefined

    let startTimer
    const activeAudio = activeNarrationAudioRef.current
    const beginReading = () => {
      if (!isPageActive()) return
      startTimer = window.setTimeout(() => {
        autoReadLevelRef.current = levelIndex
        void readPattern()
      }, 0)
    }

    if (activeAudio && !activeAudio.paused) {
      activeAudio.addEventListener('ended', beginReading, { once: true })
      activeAudio.addEventListener('error', beginReading, { once: true })
    } else {
      beginReading()
    }

    return () => {
      window.clearTimeout(startTimer)
      activeAudio?.removeEventListener('ended', beginReading)
      activeAudio?.removeEventListener('error', beginReading)
    }
  }, [completed, levelIndex, muted, readPattern])

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
      stopNarration()
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
  }, [restartIdleHintTimer, stopNarration])

  const advanceLevel = () => {
    if (levelIndex === LEVELS.length - 1) {
      setCompleted(true)
      return
    }
    setLevelIndex((current) => current + 1)
    setFeedback(null)
    setSolved(false)
  }

  const choose = (choice) => {
    if (solved) return
    if (shapeKey(choice) !== shapeKey(level.answer)) {
      stopNarration()
      playMiss()
      errorNarrationTimerRef.current = window.setTimeout(() => {
        void playSingleNarration(errorAudioRef.current)
      }, 450)
      setFeedback({ title: 'Mira otra vez', message: 'Busca la figura que repite el orden.' })
      return
    }

    playShapeName(choice[0])
    setSolved(true)
    setFeedback({ title: '¡Muy bien!', message: 'Completaste correctamente el patrón.' })
    playCorrect()
    playLevelComplete()
    timerRef.current = window.setTimeout(advanceLevel, 1200)
  }

  const restart = () => {
    window.clearTimeout(timerRef.current)
    setLevels(shuffle(LEVELS))
    setLevelIndex(0)
    setFeedback(null)
    setSolved(false)
    setCompleted(false)
  }

  return (
    <main className="patterns-game">
      <header className="patterns-header">
        <div className="patterns-status">
          <img src={game.icon} alt="" />
          <span>
            <strong>Patrones</strong>
            <span className="patterns-progress" aria-label={`Nivel ${levelIndex + 1} de ${LEVELS.length}`}>
              {LEVELS.map((_, index) => <i className={index <= levelIndex ? 'is-filled' : ''} key={index} />)}
            </span>
          </span>
        </div>
        <div className="patterns-header__actions">
          <button
            type="button"
            className="round-button"
            onClick={() => {
              stopNarration()
              onToggleSound()
            }}
            aria-label={muted ? 'Activar sonidos' : 'Silenciar sonidos'}
          >
            <SoundIcon muted={muted} />
          </button>
          <button type="button" className="home-button" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
        </div>
      </header>

      <section className="patterns-stage">
        <div className="patterns-guide">
          <LobbyMascot className="patterns-guide__mascot" talking={isSpeaking} />
          <div>
            <h1>{feedback?.title ?? '¡Observa bien!'}</h1>
            <p>{feedback?.message ?? INSTRUCTION}</p>
          </div>
          <button type="button" className="patterns-guide__sound" onClick={playHint} aria-label="Escuchar una pista"><HintIcon /></button>
        </div>

        <div className="patterns-board">
          <div className="patterns-sequence-row">
            <button type="button" className="patterns-read-pattern" onClick={readPattern} aria-label="Escuchar el patrón">
              <SoundIcon />
            </button>
            <div className="patterns-sequence" aria-label="Secuencia de figuras">
              {level.sequence.map((item, index) => (
                <span
                  className={`patterns-sequence__tile ${index <= readingPatternIndex ? 'is-read' : ''} ${index === readingPatternIndex ? 'is-current' : ''}`}
                  key={`${shapeKey(item)}-${index}`}
                >
                  <PatternShape item={item} small />
                </span>
              ))}
              <span className={`patterns-sequence__tile is-answer ${solved ? 'is-solved' : ''}`}>
                {solved ? <PatternShape item={level.answer} small /> : <strong>?</strong>}
              </span>
            </div>
          </div>
        </div>

        <div className="patterns-options">
          <h2>Elige la pieza correcta</h2>
          <div>
            {choices.map((choice) => (
              <button
                type="button"
                className={solved && shapeKey(choice) === shapeKey(level.answer) ? 'is-correct' : ''}
                onClick={() => choose(choice)}
                aria-label={`Elegir ${choice[0]} ${choice[1]}`}
                key={shapeKey(choice)}
              >
                <PatternShape item={choice} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {solved && <LevelConfetti />}

      {completed && (
        <div className="patterns-complete" role="dialog" aria-modal="true" aria-labelledby="patterns-complete-title">
          <div>
            <h2 id="patterns-complete-title">¡Lo lograste!</h2>
            <p>Completaste todos los patrones.</p>
            <div className="patterns-complete__actions">
              <button type="button" onClick={restart} aria-label="Jugar otra vez"><RestartIcon /></button>
              <button type="button" className="is-secondary" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default PatternsGame
