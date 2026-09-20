import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LobbyMascot from '../../components/LobbyMascot.jsx'
import LevelConfetti from '../../components/LevelConfetti.jsx'
import { HintIcon, HomeIcon, RestartIcon, SoundIcon } from '../../components/UiIcons.jsx'
import { playCorrect, playLevelComplete, playMiss } from '../../hooks/useInterfaceSounds.js'
import { isPageActive } from '../../utils/pageActivity.js'
import blueBoxSound from '../../assets/sounds/classification/boxes/blue.mp3'
import brownBoxSound from '../../assets/sounds/classification/boxes/brown.mp3'
import greenBoxSound from '../../assets/sounds/classification/boxes/green.mp3'
import orangeBoxSound from '../../assets/sounds/classification/boxes/orange.mp3'
import pinkBoxSound from '../../assets/sounds/classification/boxes/pink.mp3'
import purpleBoxSound from '../../assets/sounds/classification/boxes/purple.mp3'
import redBoxSound from '../../assets/sounds/classification/boxes/red.mp3'
import yellowBoxSound from '../../assets/sounds/classification/boxes/yellow.mp3'
import classificationCorrectSound1 from '../../assets/sounds/classification/feedback/correct-1.mp3'
import classificationCorrectSound2 from '../../assets/sounds/classification/feedback/correct-2.mp3'
import classificationCorrectSound3 from '../../assets/sounds/classification/feedback/correct-3.mp3'
import classificationErrorSound1 from '../../assets/sounds/classification/feedback/error-1.mp3'
import classificationErrorSound2 from '../../assets/sounds/classification/feedback/error-2.mp3'
import classificationErrorSound3 from '../../assets/sounds/classification/feedback/error-3.mp3'
import acornObjectSound from '../../assets/sounds/classification/objects/acorn.mp3'
import appleObjectSound from '../../assets/sounds/classification/objects/apple.mp3'
import backpackObjectSound from '../../assets/sounds/classification/objects/backpack.mp3'
import ballObjectSound from '../../assets/sounds/classification/objects/ball.mp3'
import cupcakeObjectSound from '../../assets/sounds/classification/objects/cupcake.mp3'
import duckObjectSound from '../../assets/sounds/classification/objects/duck.mp3'
import fireTruckObjectSound from '../../assets/sounds/classification/objects/fire-truck.mp3'
import fishObjectSound from '../../assets/sounds/classification/objects/fish.mp3'
import flowerObjectSound from '../../assets/sounds/classification/objects/flower.mp3'
import frogObjectSound from '../../assets/sounds/classification/objects/frog.mp3'
import grapesObjectSound from '../../assets/sounds/classification/objects/grapes.mp3'
import kiteObjectSound from '../../assets/sounds/classification/objects/kite.mp3'
import leafObjectSound from '../../assets/sounds/classification/objects/leaf.mp3'
import orangeObjectSound from '../../assets/sounds/classification/objects/orange.mp3'
import teddyObjectSound from '../../assets/sounds/classification/objects/teddy.mp3'
import toyStarObjectSound from '../../assets/sounds/classification/objects/toy-star.mp3'
import classificationHintSound from '../../assets/sounds/classification/hint.mp3'
import './classification.css'

const TOTAL_ROUNDS = 5
const IDLE_HINT_DELAY = 45000
const INSTRUCTION = 'Mira el color de cada figura y arrástrala al contenedor del mismo color.'

const BOX_SOUND_BY_COLOR = {
  red: redBoxSound,
  blue: blueBoxSound,
  yellow: yellowBoxSound,
  green: greenBoxSound,
  purple: purpleBoxSound,
  orange: orangeBoxSound,
  brown: brownBoxSound,
  pink: pinkBoxSound,
}

const OBJECT_SOUND_BY_SPRITE = {
  apple: appleObjectSound,
  'fire-truck': fireTruckObjectSound,
  ball: ballObjectSound,
  backpack: backpackObjectSound,
  duck: duckObjectSound,
  'toy-star': toyStarObjectSound,
  frog: frogObjectSound,
  leaf: leafObjectSound,
  grapes: grapesObjectSound,
  kite: kiteObjectSound,
  fish: fishObjectSound,
  orange: orangeObjectSound,
  teddy: teddyObjectSound,
  acorn: acornObjectSound,
  flower: flowerObjectSound,
  cupcake: cupcakeObjectSound,
}

const ERROR_NARRATION_SOUNDS = [
  classificationErrorSound1,
  classificationErrorSound2,
  classificationErrorSound3,
]

const CORRECT_NARRATION_SOUNDS = [
  classificationCorrectSound1,
  classificationCorrectSound2,
  classificationCorrectSound3,
]

const COLOR_INFO = {
  red: { label: 'Rojo' },
  blue: { label: 'Azul' },
  yellow: { label: 'Amarillo' },
  green: { label: 'Verde' },
  purple: { label: 'Morado' },
  orange: { label: 'Naranja' },
  brown: { label: 'Café' },
  pink: { label: 'Rosado' },
}

const OBJECT_LIBRARY = {
  red: [{ sprite: 'apple', name: 'manzana' }, { sprite: 'fire-truck', name: 'camión de bomberos' }],
  blue: [{ sprite: 'ball', name: 'pelota' }, { sprite: 'backpack', name: 'mochila' }],
  yellow: [{ sprite: 'duck', name: 'patito' }, { sprite: 'toy-star', name: 'estrella' }],
  green: [{ sprite: 'frog', name: 'rana' }, { sprite: 'leaf', name: 'hoja' }],
  purple: [{ sprite: 'grapes', name: 'uvas' }, { sprite: 'kite', name: 'cometa' }],
  orange: [{ sprite: 'fish', name: 'pez' }, { sprite: 'orange', name: 'naranja' }],
  brown: [{ sprite: 'teddy', name: 'osito' }, { sprite: 'acorn', name: 'bellota' }],
  pink: [{ sprite: 'flower', name: 'flor' }, { sprite: 'cupcake', name: 'pastelito' }],
}

const ROUND_COLORS = [
  ['red', 'blue', 'yellow'],
  ['green', 'purple', 'orange'],
  ['brown', 'pink', 'green'],
  ['orange', 'purple', 'brown'],
  ['pink', 'blue', 'yellow'],
]

const shuffled = (items) => {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

function ObjectSprite({ sprite, small = false }) {
  return <i className={`sorting-sprite sorting-sprite--${sprite} ${small ? 'is-small' : ''}`} />
}

function ClassificationGame({ game, muted, onToggleSound, onBack }) {
  const [round, setRound] = useState(1)
  const [placedIds, setPlacedIds] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [drag, setDrag] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeBoxColor, setActiveBoxColor] = useState(null)
  const [completed, setCompleted] = useState(false)
  const nextRoundTimerRef = useRef(null)
  const idleHintTimerRef = useRef(null)
  const errorNarrationTimerRef = useRef(null)
  const correctNarrationTimerRef = useRef(null)
  const hintAudioRef = useRef(null)
  const boxAudioRefs = useRef({})
  const objectAudioRefs = useRef({})
  const errorAudioRefs = useRef([])
  const correctAudioRefs = useRef([])
  const activeNarrationRef = useRef(null)
  const lastErrorNarrationIndexRef = useRef(null)
  const lastCorrectNarrationIndexRef = useRef(null)

  const objects = useMemo(() => {
    const colors = shuffled(ROUND_COLORS[round - 1])
    const colorSequence = [colors[0], colors[1], colors[2], colors[1], colors[2], colors[0]]

    return colorSequence.map((color, sequenceIndex) => {
      const variantIndex = sequenceIndex < 3 ? 0 : 1
      const object = OBJECT_LIBRARY[color][variantIndex]
      return { ...object, color, id: `${round}-${color}-${variantIndex}` }
    })
  }, [round])

  const roundColors = ROUND_COLORS[round - 1]

  useEffect(() => {
    const handlePlay = (event) => {
      activeNarrationRef.current = event.currentTarget
      setIsSpeaking(true)
    }
    const handleFinish = (event) => {
      if (activeNarrationRef.current !== event.currentTarget) return
      activeNarrationRef.current = null
      setIsSpeaking(false)
      setActiveBoxColor(null)
    }
    const createNarrationAudio = (source) => {
      const audio = new Audio(source)
      audio.preload = 'auto'
      audio.volume = 0.9
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('ended', handleFinish)
      audio.addEventListener('error', handleFinish)
      audio.load()
      return audio
    }

    const hintAudio = createNarrationAudio(classificationHintSound)
    const boxAudios = Object.fromEntries(
      Object.entries(BOX_SOUND_BY_COLOR).map(([color, source]) => [color, createNarrationAudio(source)]),
    )
    const objectAudios = Object.fromEntries(
      Object.entries(OBJECT_SOUND_BY_SPRITE).map(([sprite, source]) => [sprite, createNarrationAudio(source)]),
    )
    const errorAudios = ERROR_NARRATION_SOUNDS.map(createNarrationAudio)
    const correctAudios = CORRECT_NARRATION_SOUNDS.map(createNarrationAudio)
    const allAudios = [
      hintAudio,
      ...Object.values(boxAudios),
      ...Object.values(objectAudios),
      ...errorAudios,
      ...correctAudios,
    ]
    hintAudioRef.current = hintAudio
    boxAudioRefs.current = boxAudios
    objectAudioRefs.current = objectAudios
    errorAudioRefs.current = errorAudios
    correctAudioRefs.current = correctAudios

    return () => {
      window.clearTimeout(nextRoundTimerRef.current)
      window.clearTimeout(idleHintTimerRef.current)
      window.clearTimeout(errorNarrationTimerRef.current)
      window.clearTimeout(correctNarrationTimerRef.current)
      allAudios.forEach((audio) => {
        audio.pause()
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('ended', handleFinish)
        audio.removeEventListener('error', handleFinish)
      })
      hintAudioRef.current = null
      boxAudioRefs.current = {}
      objectAudioRefs.current = {}
      errorAudioRefs.current = []
      correctAudioRefs.current = []
      activeNarrationRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!muted) return
    window.clearTimeout(errorNarrationTimerRef.current)
    window.clearTimeout(correctNarrationTimerRef.current)
    activeNarrationRef.current?.pause()
    activeNarrationRef.current = null
  }, [muted])

  const playNarration = useCallback((audio, boxColor = null) => {
    if (muted || !audio) return

    if (activeNarrationRef.current && activeNarrationRef.current !== audio) {
      activeNarrationRef.current.pause()
    }
    audio.pause()
    if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
    setActiveBoxColor(boxColor)
    void audio.play().catch(() => {
      activeNarrationRef.current = null
      setIsSpeaking(false)
      setActiveBoxColor(null)
      audio.load()
      console.warn('No se pudo reproducir una narración de clasificación.')
    })
  }, [muted])

  const playHint = useCallback(() => {
    playNarration(hintAudioRef.current)
  }, [playNarration])

  const playBoxColor = useCallback((color) => {
    playNarration(boxAudioRefs.current[color], color)
  }, [playNarration])

  const playObjectName = useCallback((sprite) => {
    playNarration(objectAudioRefs.current[sprite])
  }, [playNarration])

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

  const playIdleAssistance = useCallback(() => {
    if (selectedId) {
      const selectedObject = objects.find((object) => object.id === selectedId)
      if (selectedObject) {
        playBoxColor(selectedObject.color)
        return
      }
    }

    playHint()
  }, [objects, playBoxColor, playHint, selectedId])

  const restartIdleHintTimer = useCallback(() => {
    window.clearTimeout(idleHintTimerRef.current)
    if (completed || !isPageActive()) return
    idleHintTimerRef.current = window.setTimeout(() => {
      if (isPageActive()) playIdleAssistance()
    }, IDLE_HINT_DELAY)
  }, [completed, playIdleAssistance])

  useEffect(() => {
    const suspendIdleHintTimer = () => {
      window.clearTimeout(idleHintTimerRef.current)
      window.clearTimeout(errorNarrationTimerRef.current)
      window.clearTimeout(correctNarrationTimerRef.current)
      activeNarrationRef.current?.pause()
      activeNarrationRef.current = null
      setIsSpeaking(false)
      setActiveBoxColor(null)
    }
    const handleVisibilityChange = () => {
      if (isPageActive()) restartIdleHintTimer()
      else suspendIdleHintTimer()
    }

    restartIdleHintTimer()
    window.addEventListener('focus', restartIdleHintTimer)
    window.addEventListener('blur', suspendIdleHintTimer)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      suspendIdleHintTimer()
      window.removeEventListener('focus', restartIdleHintTimer)
      window.removeEventListener('blur', suspendIdleHintTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [restartIdleHintTimer])

  const advanceRound = () => {
    if (round === TOTAL_ROUNDS) {
      setCompleted(true)
      return
    }

    setRound((current) => current + 1)
    setPlacedIds([])
    setSelectedId(null)
    setFeedback(null)
  }

  const placeObject = (objectId, binColor) => {
    const object = objects.find((item) => item.id === objectId)
    if (!object || placedIds.includes(objectId)) return

    setSelectedId(null)

    if (object.color !== binColor) {
      playMiss()
      window.clearTimeout(errorNarrationTimerRef.current)
      window.clearTimeout(correctNarrationTimerRef.current)
      errorNarrationTimerRef.current = window.setTimeout(playRandomErrorNarration, 450)
      setFeedback({ type: 'wrong', text: 'Prueba con otro color' })
      return
    }

    const nextPlacedIds = [...placedIds, objectId]
    setPlacedIds(nextPlacedIds)
    playCorrect()
    window.clearTimeout(errorNarrationTimerRef.current)
    window.clearTimeout(correctNarrationTimerRef.current)
    setFeedback({ type: 'correct', text: '¡Muy bien!' })

    if (nextPlacedIds.length === objects.length) {
      playLevelComplete()
      nextRoundTimerRef.current = window.setTimeout(advanceRound, 1100)
    } else {
      correctNarrationTimerRef.current = window.setTimeout(playRandomCorrectNarration, 450)
    }
  }

  const handlePointerDown = (event, objectId) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({
      id: objectId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      x: 0,
      y: 0,
      rotation: 0,
      moved: false,
    })
  }

  const handlePointerMove = (event, objectId) => {
    if (drag?.id !== objectId || drag.pointerId !== event.pointerId) return
    setDrag((current) => {
      if (!current || current.id !== objectId || current.pointerId !== event.pointerId) return current

      const now = performance.now()
      const x = event.clientX - current.startX
      const y = event.clientY - current.startY
      const elapsed = Math.max(now - current.lastTime, 8)
      const horizontalSpeed = (event.clientX - current.lastX) / elapsed
      const targetRotation = Math.max(-18, Math.min(18, horizontalSpeed * 24))
      const rotation = (current.rotation * .58) + (targetRotation * .42)

      return {
        ...current,
        x,
        y,
        rotation,
        lastX: event.clientX,
        lastTime: now,
        moved: current.moved || Math.hypot(x, y) > 8,
      }
    })
  }

  const handlePointerUp = (event, objectId) => {
    if (drag?.id !== objectId) return

    const bin = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-color-bin]')
    if (bin) {
      placeObject(objectId, bin.dataset.colorBin)
    } else if (!drag.moved) {
      const willSelect = selectedId !== objectId
      setSelectedId(willSelect ? objectId : null)
      if (willSelect) {
        const object = objects.find((item) => item.id === objectId)
        if (object) playObjectName(object.sprite)
      }
    }

    setDrag(null)
  }

  const restart = () => {
    window.clearTimeout(nextRoundTimerRef.current)
    setRound(1)
    setPlacedIds([])
    setSelectedId(null)
    setDrag(null)
    setFeedback(null)
    setCompleted(false)
  }

  return (
    <main
      className="classification-game"
      onKeyDownCapture={restartIdleHintTimer}
      onPointerDownCapture={restartIdleHintTimer}
    >
      <header className="classification-header">
        <div className="classification-status">
          <img src={game.icon} alt="" />
          <span>
            <strong>Clasificación</strong>
            <span className="round-progress" aria-label={`Ronda ${round} de ${TOTAL_ROUNDS}`}>
              {Array.from({ length: TOTAL_ROUNDS }, (_, index) => <i className={index < round ? 'is-filled' : ''} key={index} />)}
            </span>
          </span>
        </div>
        <div className="classification-header__actions">
          <button
            type="button"
            className="round-button"
            onClick={() => {
              activeNarrationRef.current?.pause()
              activeNarrationRef.current = null
              setIsSpeaking(false)
              setActiveBoxColor(null)
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

      <section className="classification-stage">
        <div className="classification-topline">
          <div className="classification-guide">
            <LobbyMascot className="classification-guide__mascot" talking={isSpeaking} />
            <div>
              <h1>{feedback?.text ?? '¡Vamos a clasificar!'}</h1>
              <p>
                {feedback?.type === 'correct' && 'La figura está en el contenedor correcto.'}
                {feedback?.type === 'wrong' && 'Mira su color e inténtalo en otro contenedor.'}
                {!feedback && INSTRUCTION}
              </p>
            </div>
            <button type="button" className="classification-guide__sound" onClick={playHint} aria-label="Escuchar una pista">
              <HintIcon />
            </button>
          </div>
        </div>

        <div className="sorting-bins" aria-label="Contenedores de colores">
          {roundColors.map((color) => {
            const info = COLOR_INFO[color]
            return (
            <button
              type="button"
              className={`sorting-bin sorting-bin--${color} ${selectedId ? 'is-ready' : ''} ${activeBoxColor === color ? 'is-speaking' : ''}`}
              data-color-bin={color}
              key={color}
              onClick={() => {
                if (selectedId) placeObject(selectedId, color)
                else playBoxColor(color)
              }}
              aria-label={`Contenedor ${info.label}`}
            >
              <strong>{info.label}</strong>
              <span className="sorting-bin__dropzone">
                {placedIds.map((id) => {
                  const item = objects.find((object) => object.id === id)
                  return item?.color === color ? <ObjectSprite sprite={item.sprite} small key={id} /> : null
                })}
              </span>
            </button>
            )
          })}
        </div>

        <div className="sorting-tray" aria-label="Figuras para clasificar">
          {objects.map((object) => {
            if (placedIds.includes(object.id)) return null
            const isDragging = drag?.id === object.id
            return (
              <button
                type="button"
                className={`sorting-object ${selectedId === object.id ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
                key={object.id}
                onPointerDown={(event) => handlePointerDown(event, object.id)}
                onPointerMove={(event) => handlePointerMove(event, object.id)}
                onPointerUp={(event) => handlePointerUp(event, object.id)}
                onPointerCancel={() => setDrag(null)}
                style={isDragging ? {
                  '--drag-x': `${drag.x}px`,
                  '--drag-y': `${drag.y}px`,
                  '--drag-rotation': `${drag.rotation}deg`,
                } : undefined}
                aria-label={`${object.name}, color ${COLOR_INFO[object.color].label}`}
                aria-pressed={selectedId === object.id}
              >
                <ObjectSprite sprite={object.sprite} />
              </button>
            )
          })}
        </div>

      </section>

      {placedIds.length === objects.length && <LevelConfetti />}

      {completed && (
        <div className="classification-complete" role="dialog" aria-modal="true" aria-labelledby="classification-complete-title">
          <div>
            <h2 id="classification-complete-title">¡Lo lograste!</h2>
            <p>Clasificaste correctamente todas las figuras.</p>
            <div className="classification-complete__actions">
              <button type="button" onClick={restart} aria-label="Jugar otra vez">
                <RestartIcon />
              </button>
              <button type="button" className="is-secondary" onClick={onBack} aria-label="Volver al lobby">
                <HomeIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default ClassificationGame
