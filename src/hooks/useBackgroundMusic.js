import { useEffect, useRef } from 'react'
import { getBufferedAudio } from '../utils/audioPool.js'

function useBackgroundMusic(source, shouldPlay, volume = 0.18) {
  const audioRef = useRef(null)
  const shouldPlayRef = useRef(shouldPlay)

  useEffect(() => {
    const audio = getBufferedAudio(source)
    audio.loop = true
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.currentTime = 0
      audioRef.current = null
    }
  }, [source])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    shouldPlayRef.current = shouldPlay
    if (!audio) return undefined

    let active = true

    const removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', retryAfterInteraction, true)
      window.removeEventListener('keydown', retryAfterInteraction, true)
    }

    const pauseMusic = () => {
      removeUnlockListeners()
      audio.pause()
    }

    const beginPlayback = () => {
      if (!active || !shouldPlayRef.current || document.hidden) return

      void audio.play()
        .then(removeUnlockListeners)
        .catch(() => {
          if (!active || !shouldPlayRef.current || document.hidden) return
          window.addEventListener('pointerdown', retryAfterInteraction, true)
          window.addEventListener('keydown', retryAfterInteraction, true)
        })
    }

    function retryAfterInteraction() {
      removeUnlockListeners()
      beginPlayback()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseMusic()
      } else if (shouldPlayRef.current) {
        beginPlayback()
      }
    }

    const handlePageShow = () => {
      if (!document.hidden && shouldPlayRef.current) beginPlayback()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', pauseMusic)
    window.addEventListener('pageshow', handlePageShow)

    if (shouldPlay) beginPlayback()
    else pauseMusic()

    return () => {
      active = false
      removeUnlockListeners()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', pauseMusic)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [shouldPlay])
}

export default useBackgroundMusic
