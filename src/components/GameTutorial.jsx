import { useCallback, useEffect, useRef, useState } from 'react'
import LobbyMascot from './LobbyMascot.jsx'
import { HomeIcon, PlayIcon, SoundIcon } from './UiIcons.jsx'
import { isPageActive } from '../utils/pageActivity.js'
import objectSprites from '../assets/classification/object-sprites.png'
import rabbitImage from '../assets/directions/rabbit.png'
import burrowImage from '../assets/directions/burrow.png'
import movementArrow from '../assets/directions/movement-arrow.png'
import starImage from '../assets/patterns/star-red.png'
import circleImage from '../assets/patterns/circle-blue.png'
import happySituation from '../assets/emotions/situation-happy.png'
import happyFace from '../assets/emotions/happy.png'
import sadFace from '../assets/emotions/sad.png'
import surprisedFace from '../assets/emotions/surprised.png'
import classificationTutorialLandscape from '../assets/tutorials/classification-tutorial-landscape.png'
import classificationTutorialPortrait from '../assets/tutorials/classification-tutorial-portrait.png'
import './game-tutorial.css'

function ObjectSprite({ position = '0% 0%', className = '' }) {
  return (
    <i
      className={`game-tutorial__object ${className}`}
      style={{ backgroundImage: `url(${objectSprites})`, backgroundPosition: position }}
    />
  )
}

function ClassificationDemo() {
  return (
    <div className="tutorial-demo tutorial-demo--classification" aria-hidden="true">
      <div className="tutorial-demo__object-path">
        <ObjectSprite className="tutorial-demo__moving-object" />
        <i className="tutorial-demo__trail" />
      </div>
      <div className="tutorial-demo__color-box"><i /></div>
    </div>
  )
}

function DirectionsDemo() {
  return (
    <div className="tutorial-demo tutorial-demo--directions" aria-hidden="true">
      <div className="tutorial-demo__direction-button"><img src={movementArrow} alt="" /></div>
      <div className="tutorial-demo__path">
        <i /><i /><i /><i />
        <img className="tutorial-demo__rabbit" src={rabbitImage} alt="" />
        <img className="tutorial-demo__burrow" src={burrowImage} alt="" />
      </div>
    </div>
  )
}

function NumbersDemo() {
  return (
    <div className="tutorial-demo tutorial-demo--numbers" aria-hidden="true">
      <div className="tutorial-demo__object-group">
        <ObjectSprite /><ObjectSprite /><ObjectSprite />
      </div>
      <i className="tutorial-demo__number-trail" />
      <div className="tutorial-demo__number-target">3</div>
    </div>
  )
}

function PatternsDemo() {
  const sequence = [starImage, circleImage, starImage, circleImage]
  return (
    <div className="tutorial-demo tutorial-demo--patterns" aria-hidden="true">
      <div className="tutorial-demo__pattern-row">
        {sequence.map((source, index) => <span key={index}><img src={source} alt="" /></span>)}
        <span className="is-question">?</span>
      </div>
      <img className="tutorial-demo__pattern-answer" src={starImage} alt="" />
    </div>
  )
}

function EmotionsDemo() {
  return (
    <div className="tutorial-demo tutorial-demo--emotions" aria-hidden="true">
      <img className="tutorial-demo__situation" src={happySituation} alt="" />
      <div className="tutorial-demo__faces">
        <img src={sadFace} alt="" />
        <img className="is-answer" src={happyFace} alt="" />
        <img src={surprisedFace} alt="" />
      </div>
    </div>
  )
}

const DEMOS = {
  clasificacion: ClassificationDemo,
  direcciones: DirectionsDemo,
  numeros: NumbersDemo,
  patrones: PatternsDemo,
  emociones: EmotionsDemo,
}

function GameTutorial({ game, muted, onBack, onNarrationChange, onStart, onToggleSound }) {
  const [isNarrating, setIsNarrating] = useState(false)
  const audioRef = useRef(null)
  const Demo = DEMOS[game.id]
  const audioSource = game.tutorialAudio ?? null
  const usesFullScreenArt = game.id === 'clasificacion'

  const stopNarration = useCallback(() => {
    audioRef.current?.pause()
    setIsNarrating(false)
  }, [])

  const playNarration = useCallback(() => {
    const audio = audioRef.current
    if (muted || !audio || !isPageActive()) return
    audio.pause()
    audio.currentTime = 0
    void audio.play().catch(() => setIsNarrating(false))
  }, [muted])

  useEffect(() => {
    if (!audioSource) return undefined
    const audio = new Audio(audioSource)
    const handlePlay = () => setIsNarrating(true)
    const handleFinish = () => setIsNarrating(false)
    audio.preload = 'auto'
    audio.volume = 0.9
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('ended', handleFinish)
    audio.addEventListener('error', handleFinish)
    audio.load()
    audioRef.current = audio

    const startTimer = window.setTimeout(playNarration, 0)
    return () => {
      window.clearTimeout(startTimer)
      audio.pause()
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('ended', handleFinish)
      audio.removeEventListener('error', handleFinish)
      audioRef.current = null
    }
  }, [audioSource, playNarration])

  useEffect(() => {
    const handleInactive = () => {
      if (!isPageActive()) stopNarration()
    }
    window.addEventListener('blur', handleInactive)
    document.addEventListener('visibilitychange', handleInactive)
    return () => {
      window.removeEventListener('blur', handleInactive)
      document.removeEventListener('visibilitychange', handleInactive)
    }
  }, [stopNarration])

  useEffect(() => {
    onNarrationChange(isNarrating)
    return () => onNarrationChange(false)
  }, [isNarrating, onNarrationChange])

  return (
    <main className={`game-tutorial game-tutorial--${game.id}`}>
      {usesFullScreenArt && (
        <picture className="game-tutorial__full-screen-art">
          <source media="(orientation: portrait)" srcSet={classificationTutorialPortrait} />
          <img
            src={classificationTutorialLandscape}
            alt="Tutorial visual: toca la manzana roja y llévala hasta la caja roja"
          />
        </picture>
      )}
      <header className="game-tutorial__header">
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
        <img className="game-tutorial__game-icon" src={game.icon} alt="" />
        <button type="button" className="home-button" onClick={onBack} aria-label="Volver al lobby"><HomeIcon /></button>
      </header>

      <section className="game-tutorial__stage">
        <div className="game-tutorial__card">
          {!usesFullScreenArt && <LobbyMascot className="game-tutorial__mascot" talking={isNarrating} />}
          {audioSource && (
            <button type="button" className="game-tutorial__replay" onClick={playNarration} aria-label="Repetir instrucciones">
              <SoundIcon />
            </button>
          )}
          {!usesFullScreenArt && Demo && <Demo />}
        </div>

        <button
          type="button"
          className="game-tutorial__start"
          onClick={() => {
            stopNarration()
            onStart()
          }}
          aria-label="Comenzar a jugar"
        >
          <PlayIcon />
        </button>
      </section>
    </main>
  )
}

export default GameTutorial
