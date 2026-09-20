import { useEffect, useRef } from 'react'
import hoverSound from '../assets/sounds/hover.mp3'
import levelCompleteSound from '../assets/sounds/level-complete.mp3'
import clickSound from '../assets/sounds/click.mp3'
import correctSound from '../assets/sounds/correct.mp3'
import missSound from '../assets/sounds/miss.mp3'

const LEVEL_COMPLETE_EVENT = 'playkids:level-complete'
const CORRECT_EVENT = 'playkids:correct'
const MISS_EVENT = 'playkids:miss'

export const playLevelComplete = () => {
  window.dispatchEvent(new Event(LEVEL_COMPLETE_EVENT))
}

export const playCorrect = () => {
  window.dispatchEvent(new Event(CORRECT_EVENT))
}

export const playMiss = () => {
  window.dispatchEvent(new Event(MISS_EVENT))
}

function useInterfaceSounds(muted) {
  const mutedRef = useRef(muted)

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    const hoverAudio = new Audio(hoverSound)
    const levelCompleteAudio = new Audio(levelCompleteSound)
    const clickAudio = new Audio(clickSound)
    const correctAudio = new Audio(correctSound)
    const missAudio = new Audio(missSound)
    hoverAudio.preload = 'auto'
    hoverAudio.volume = 0.42
    levelCompleteAudio.preload = 'auto'
    levelCompleteAudio.volume = 0.72
    clickAudio.preload = 'auto'
    clickAudio.volume = 0.38
    correctAudio.preload = 'auto'
    correctAudio.volume = 0.46
    missAudio.preload = 'auto'
    missAudio.volume = 0.43

    const audios = [hoverAudio, levelCompleteAudio, clickAudio, correctAudio, missAudio]
    audios.forEach((audio) => audio.load())

    const play = (audio) => {
      if (mutedRef.current) return
      audio.pause()
      if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) {
        audio.currentTime = 0
      }
      void audio.play().catch(() => {
        // Algunos navegadores móviles ignoran `preload`. Al primer intento,
        // cargamos el archivo sin tratar de mover el cursor antes de tiempo.
        audio.load()
        void audio.play().catch((error) => {
          console.warn('No se pudo reproducir un sonido de la interfaz.', error)
        })
      })
    }

    const handlePointerOver = (event) => {
      const button = event.target.closest?.('button')
      if (!button || button.disabled || button.contains(event.relatedTarget)) return
      play(hoverAudio)
    }

    const handleLevelComplete = () => play(levelCompleteAudio)
    const handleCorrect = () => play(correctAudio)
    const handleMiss = () => play(missAudio)
    const handleClick = (event) => {
      const button = event.target.closest?.('button')
      if (!button || button.disabled) return
      play(clickAudio)
    }

    document.addEventListener('pointerover', handlePointerOver)
    document.addEventListener('click', handleClick)
    window.addEventListener(LEVEL_COMPLETE_EVENT, handleLevelComplete)
    window.addEventListener(CORRECT_EVENT, handleCorrect)
    window.addEventListener(MISS_EVENT, handleMiss)

    return () => {
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('click', handleClick)
      window.removeEventListener(LEVEL_COMPLETE_EVENT, handleLevelComplete)
      window.removeEventListener(CORRECT_EVENT, handleCorrect)
      window.removeEventListener(MISS_EVENT, handleMiss)
      audios.forEach((audio) => audio.pause())
    }
  }, [])
}

export default useInterfaceSounds
