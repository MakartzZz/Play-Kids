import { useCallback, useEffect, useRef, useState } from 'react'
import LobbyMascot from '../../components/LobbyMascot.jsx'
import LevelConfetti from '../../components/LevelConfetti.jsx'
import { HomeIcon, RestartIcon, SoundIcon } from '../../components/UiIcons.jsx'
import { playCorrect, playLevelComplete, playMiss } from '../../hooks/useInterfaceSounds.js'
import { isPageActive } from '../../utils/pageActivity.js'
import { getBufferedAudio } from '../../utils/audioPool.js'
import happyFace from '../../assets/emotions/happy.png'
import sadFace from '../../assets/emotions/sad.png'
import angryFace from '../../assets/emotions/angry.png'
import scaredFace from '../../assets/emotions/scared.png'
import surprisedFace from '../../assets/emotions/surprised.png'
import happySituation from '../../assets/emotions/situation-happy.png'
import sadSituation from '../../assets/emotions/situation-sad.png'
import angrySituation from '../../assets/emotions/situation-angry.png'
import scaredSituation from '../../assets/emotions/situation-scared.png'
import surprisedSituation from '../../assets/emotions/situation-surprised.png'
import happyStorySound from '../../assets/sounds/emotions/stories/happy.mp3'
import sadStorySound from '../../assets/sounds/emotions/stories/sad.mp3'
import angryStorySound from '../../assets/sounds/emotions/stories/angry.mp3'
import scaredStorySound from '../../assets/sounds/emotions/stories/scared.mp3'
import surprisedStorySound from '../../assets/sounds/emotions/stories/surprised.mp3'
import happyLabelSound from '../../assets/sounds/emotions/labels/happy.mp3'
import sadLabelSound from '../../assets/sounds/emotions/labels/sad.mp3'
import angryLabelSound from '../../assets/sounds/emotions/labels/angry.mp3'
import scaredLabelSound from '../../assets/sounds/emotions/labels/scared.mp3'
import surprisedLabelSound from '../../assets/sounds/emotions/labels/surprised.mp3'
import emotionsErrorSound from '../../assets/sounds/emotions/feedback/error.mp3'
import './emotions.css'

const EMOTION_LABEL_SOUNDS = {
  angry: angryLabelSound,
  happy: happyLabelSound,
  surprised: surprisedLabelSound,
  sad: sadLabelSound,
  scared: scaredLabelSound,
}

const IDLE_STORY_DELAY = 20000

const EMOTIONS = [
  { id: 'angry', label: 'Enojado', image: angryFace, accent: '#8f55df', soft: '#f7efff' },
  { id: 'happy', label: 'Feliz', image: happyFace, accent: '#45b94f', soft: '#effbef' },
  { id: 'surprised', label: 'Sorprendido', image: surprisedFace, accent: '#ed5f91', soft: '#fff0f6' },
  { id: 'sad', label: 'Triste', image: sadFace, accent: '#318be5', soft: '#eef7ff' },
  { id: 'scared', label: 'Asustado', image: scaredFace, accent: '#f18b1d', soft: '#fff7e9' },
]

const LEVELS = [
  {
    answer: 'happy',
    audio: happyStorySound,
    image: happySituation,
    situation: 'Nuestro amiguito terminó un dibujo muy bonito. La maestra vio el dibujo y felicitó su gran trabajo delante de toda la clase.',
    question: '¿Cómo crees que se siente?',
  },
  {
    answer: 'sad',
    audio: sadStorySound,
    image: sadSituation,
    situation: 'Nuestro amiguito disfrutaba de un delicioso helado, pero de pronto se le cayó al suelo y ya no puede comerlo.',
    question: '¿Cómo crees que se siente?',
  },
  {
    answer: 'angry',
    audio: angryStorySound,
    image: angrySituation,
    situation: 'Nuestro amiguito estaba jugando con su carrito cuando alguien lo tomó sin pedir permiso.',
    question: '¿Cómo crees que se siente?',
  },
  {
    answer: 'scared',
    audio: scaredStorySound,
    image: scaredSituation,
    situation: 'Mientras estaba en su habitación, sonó un trueno muy fuerte. Nuestro amiguito abrazó con fuerza a su osito.',
    question: '¿Cómo crees que se siente?',
  },
  {
    answer: 'surprised',
    audio: surprisedStorySound,
    image: surprisedSituation,
    situation: 'La familia de nuestro amiguito preparó una fiesta. De pronto aparecieron con un pastel y muchos regalos.',
    question: '¿Cómo crees que se siente?',
  },
]

function EmotionsGame({ game, muted, onToggleSound, onBack }) {
  const [levelIndex, setLevelIndex] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [solved, setSolved] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const timerRef = useRef(null)
  const idleStoryTimerRef = useRef(null)
  const feedbackNarrationTimerRef = useRef(null)
  const storyAudioRefs = useRef([])
  const emotionAudioRefs = useRef({})
  const errorAudioRef = useRef(null)
  const activeNarrationAudioRef = useRef(null)
  const autoPlayedLevelRef = useRef(null)
  const level = LEVELS[levelIndex]

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
    const storyAudios = LEVELS.map(({ audio: source }) => createNarrationAudio(source))
    const emotionAudios = Object.fromEntries(
      Object.entries(EMOTION_LABEL_SOUNDS)
        .map(([emotion, source]) => [emotion, createNarrationAudio(source)]),
    )
    const errorAudio = createNarrationAudio(emotionsErrorSound)
    const allAudios = [storyAudios, Object.values(emotionAudios), [errorAudio]].flat()
    storyAudioRefs.current = storyAudios
    emotionAudioRefs.current = emotionAudios
    errorAudioRef.current = errorAudio

    return () => {
      window.clearTimeout(timerRef.current)
      window.clearTimeout(idleStoryTimerRef.current)
      window.clearTimeout(feedbackNarrationTimerRef.current)
      allAudios.forEach((audio) => {
        audio.pause()
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('ended', handleFinish)
        audio.removeEventListener('error', handleFinish)
      })
      storyAudioRefs.current = []
      emotionAudioRefs.current = {}
      errorAudioRef.current = null
      activeNarrationAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!muted) return
    activeNarrationAudioRef.current?.pause()
    activeNarrationAudioRef.current = null
  }, [muted])

  useEffect(() => {
    if (solved || completed) return undefined
    const hintTimer = window.setTimeout(() => setShowHint(true), 60000)
    return () => window.clearTimeout(hintTimer)
  }, [levelIndex, solved, completed])

  const stopNarration = useCallback(() => {
    window.clearTimeout(feedbackNarrationTimerRef.current)
    activeNarrationAudioRef.current?.pause()
    activeNarrationAudioRef.current = null
    setIsSpeaking(false)
  }, [])

  const playNarration = useCallback((audio) => {
    if (muted || !audio) return
    stopNarration()
    audio.currentTime = 0
    void audio.play().catch(() => {
      activeNarrationAudioRef.current = null
      setIsSpeaking(false)
      console.warn('No se pudo reproducir una narración de emociones.')
    })
  }, [muted, stopNarration])

  const playStory = useCallback(() => {
    playNarration(storyAudioRefs.current[levelIndex])
  }, [levelIndex, playNarration])

  useEffect(() => {
    if (autoPlayedLevelRef.current === levelIndex) return undefined
    if (muted || completed || !isPageActive()) return undefined

    let startTimer
    const activeAudio = activeNarrationAudioRef.current
    const beginStory = () => {
      if (!isPageActive()) return
      startTimer = window.setTimeout(() => {
        autoPlayedLevelRef.current = levelIndex
        playStory()
      }, 0)
    }

    if (activeAudio && !activeAudio.paused) {
      activeAudio.addEventListener('ended', beginStory, { once: true })
      activeAudio.addEventListener('error', beginStory, { once: true })
    } else {
      beginStory()
    }

    return () => {
      window.clearTimeout(startTimer)
      activeAudio?.removeEventListener('ended', beginStory)
      activeAudio?.removeEventListener('error', beginStory)
    }
  }, [completed, levelIndex, muted, playStory])

  useEffect(() => {
    if (solved || completed) return undefined

    const scheduleIdleStory = () => {
      window.clearTimeout(idleStoryTimerRef.current)
      if (!isPageActive()) return
      idleStoryTimerRef.current = window.setTimeout(() => {
        if (!isPageActive()) return
        playStory()
        scheduleIdleStory()
      }, IDLE_STORY_DELAY)
    }
    const suspendIdleStory = () => {
      window.clearTimeout(idleStoryTimerRef.current)
      stopNarration()
    }
    const handleVisibilityChange = () => {
      if (isPageActive()) scheduleIdleStory()
      else suspendIdleStory()
    }

    scheduleIdleStory()
    window.addEventListener('pointerdown', scheduleIdleStory, true)
    window.addEventListener('keydown', scheduleIdleStory, true)
    window.addEventListener('focus', scheduleIdleStory)
    window.addEventListener('blur', suspendIdleStory)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      suspendIdleStory()
      window.removeEventListener('pointerdown', scheduleIdleStory, true)
      window.removeEventListener('keydown', scheduleIdleStory, true)
      window.removeEventListener('focus', scheduleIdleStory)
      window.removeEventListener('blur', suspendIdleStory)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [completed, playStory, solved, stopNarration])

  const advanceLevel = () => {
    if (levelIndex === LEVELS.length - 1) {
      setCompleted(true)
      return
    }
    setLevelIndex((current) => current + 1)
    setFeedback(null)
    setSolved(false)
    setShowHint(false)
  }

  const chooseEmotion = (emotion) => {
    if (solved) return
    stopNarration()
    if (emotion.id !== level.answer) {
      playMiss()
      feedbackNarrationTimerRef.current = window.setTimeout(() => {
        playNarration(errorAudioRef.current)
      }, 450)
      setFeedback({ title: 'Mira otra vez', message: 'Observa su cara y lo que pasó.' })
      return
    }

    setSolved(true)
    setShowHint(false)
    setFeedback({ title: '¡Muy bien!', message: `Nuestro amiguito se siente ${emotion.label.toLowerCase()}.` })
    playCorrect()
    playLevelComplete()
    feedbackNarrationTimerRef.current = window.setTimeout(() => {
      playNarration(emotionAudioRefs.current[emotion.id])
    }, 450)
    timerRef.current = window.setTimeout(advanceLevel, 1300)
  }

  const restart = () => {
    window.clearTimeout(timerRef.current)
    stopNarration()
    setLevelIndex(0)
    setFeedback(null)
    setSolved(false)
    setShowHint(false)
    setCompleted(false)
  }

  return (
    <main className="emotions-game">
      <header className="emotions-header">
        <div className="emotions-status">
          <img src={game.icon} alt="" />
          <span>
            <strong>Emociones</strong>
            <span className="emotions-progress" aria-label={`Nivel ${levelIndex + 1} de ${LEVELS.length}`}>
              {LEVELS.map((_, index) => <i className={index <= levelIndex ? 'is-filled' : ''} key={index} />)}
            </span>
          </span>
        </div>
        <div className="emotions-header__actions">
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

      <section className="emotions-stage">
        <div className="emotions-card-stack">
          <div className="emotions-guide">
            <LobbyMascot className="emotions-guide__mascot" talking={isSpeaking} />
            <div>
              <h1>{feedback?.title ?? level.question}</h1>
              <p>{feedback?.message ?? level.situation}</p>
            </div>
            <button
              type="button"
              className="emotions-guide__sound"
              onClick={playStory}
              aria-label="Escuchar la situación"
              key={`story-audio-${levelIndex}`}
            >
              <SoundIcon />
            </button>
          </div>

          <article className="emotion-situation">
            <img src={level.image} alt={level.situation} />
            <div className="emotion-situation__copy">
              <button type="button" onClick={playStory} aria-label="Repetir situación"><SoundIcon /></button>
              <strong>Situación</strong>
              <p>{level.situation}</p>
              <h2>{level.question}</h2>
            </div>
          </article>
        </div>

        <div className="emotion-choices" aria-label="Elige una emoción">
          {EMOTIONS.map((emotion) => (
            <button
              type="button"
              className={`${solved && emotion.id === level.answer ? 'is-correct' : ''} ${showHint && emotion.id === level.answer ? 'is-hint' : ''}`.trim()}
              style={{ '--emotion-accent': emotion.accent, '--emotion-soft': emotion.soft }}
              onClick={() => chooseEmotion(emotion)}
              aria-label={emotion.label}
              key={emotion.id}
            >
              <img src={emotion.image} alt="" />
              <strong>{emotion.label}</strong>
            </button>
          ))}
        </div>
      </section>

      {solved && <LevelConfetti />}

      {completed && (
        <div className="emotions-complete" role="dialog" aria-modal="true" aria-labelledby="emotions-complete-title">
          <div>
            <h2 id="emotions-complete-title">¡Lo lograste!</h2>
            <p>Reconociste todas las emociones.</p>
            <div className="emotions-complete__actions">
              <button type="button" onClick={restart} aria-label="Jugar otra vez"><RestartIcon /></button>
              <button type="button" className="is-secondary" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default EmotionsGame
