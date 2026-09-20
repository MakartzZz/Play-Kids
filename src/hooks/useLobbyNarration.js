import { useEffect, useRef, useState } from 'react'

function useLobbyNarration({ cueId, source, shouldPlay, volume = 0.9, rememberPlayed = true }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const playedCuesRef = useRef(new Set())

  useEffect(() => {
    if (!source || !shouldPlay || (rememberPlayed && playedCuesRef.current.has(cueId))) {
      setIsPlaying(false)
      return undefined
    }

    const audio = new Audio(source)
    let active = true
    audio.preload = 'auto'
    audio.volume = volume
    audio.load()

    const removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', retryAfterInteraction, true)
      window.removeEventListener('keydown', retryAfterInteraction, true)
    }

    const finish = () => {
      if (!active) return
      setIsPlaying(false)
    }

    const beginPlayback = () => {
      if (!active || (rememberPlayed && playedCuesRef.current.has(cueId))) return

      void audio.play()
        .then(() => {
          if (!active) return
          if (rememberPlayed) playedCuesRef.current.add(cueId)
          setIsPlaying(true)
          removeUnlockListeners()
        })
        .catch(() => {
          if (!active) return
          window.addEventListener('pointerdown', retryAfterInteraction, true)
          window.addEventListener('keydown', retryAfterInteraction, true)
        })
    }

    function retryAfterInteraction() {
      removeUnlockListeners()
      beginPlayback()
    }

    audio.addEventListener('ended', finish)
    audio.addEventListener('error', finish)
    beginPlayback()

    return () => {
      active = false
      removeUnlockListeners()
      audio.removeEventListener('ended', finish)
      audio.removeEventListener('error', finish)
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
    }
  }, [cueId, rememberPlayed, shouldPlay, source, volume])

  return isPlaying
}

export default useLobbyNarration
