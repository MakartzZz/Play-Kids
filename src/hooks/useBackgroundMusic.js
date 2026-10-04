import { useEffect, useRef } from 'react'
import { configureBufferedAudio, getBufferedAudio } from '../utils/audioPool.js'
import { setAudioVolume } from '../utils/audioSettings.js'

function useBackgroundMusic(source, shouldPlay, volume = 0.18) {
  const audioRef = useRef(null)
  const shouldPlayRef = useRef(shouldPlay)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [source])

  useEffect(() => {
    if (audioRef.current) setAudioVolume(audioRef.current, 'music', volume)
  }, [volume])

  useEffect(() => {
    shouldPlayRef.current = shouldPlay
    const audio = shouldPlay ? getBufferedAudio(source) : audioRef.current
    if (!audio) return undefined

    if (shouldPlay) {
      configureBufferedAudio(audio, { loop: true, volume, channel: 'music' })
      audioRef.current = audio
    }

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

    if (shouldPlay) {
      beginPlayback()
    } else {
      pauseMusic()
      if (audioRef.current === audio) audioRef.current = null
    }

    return () => {
      active = false
      removeUnlockListeners()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', pauseMusic)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [shouldPlay, source, volume])
}

export default useBackgroundMusic
