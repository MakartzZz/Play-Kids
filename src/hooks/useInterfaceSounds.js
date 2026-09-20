import { useEffect, useRef } from 'react'
import hoverSound from '../assets/sounds/hover.mp3'
import levelCompleteSound from '../assets/sounds/level-complete.mp3'
import clickSound from '../assets/sounds/click.mp3'
import correctSound from '../assets/sounds/correct.mp3'
import missSound from '../assets/sounds/miss.mp3'
import { getBufferedAudio } from '../utils/audioPool.js'

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
    const play = (source, volume) => {
      if (mutedRef.current) return
      const audio = getBufferedAudio(source)
      if (!audio) return

      audio.volume = volume
      audio.pause()
      if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
      void audio.play().catch(() => {
        console.warn('No se pudo reproducir un sonido de la interfaz.')
      })
    }

    const handlePointerOver = (event) => {
      const button = event.target.closest?.('button')
      if (!button || button.disabled || button.contains(event.relatedTarget)) return
      play(hoverSound, 0.42)
    }

    const handleLevelComplete = () => play(levelCompleteSound, 0.72)
    const handleCorrect = () => play(correctSound, 0.46)
    const handleMiss = () => play(missSound, 0.43)
    const handleClick = (event) => {
      const button = event.target.closest?.('button')
      if (!button || button.disabled) return
      play(clickSound, 0.38)
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
    }
  }, [])
}

export default useInterfaceSounds
