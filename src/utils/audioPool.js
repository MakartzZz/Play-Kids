import { setAudioVolume, untrackAudio } from './audioSettings.js'
import { prepareWebAudio, releaseWebAudio, supportsWebAudio, WebAudioClip } from './webAudioEngine.js'

const webAudioPool = new Map()
const nativeAudioPool = new Map()
const nativePreparationPool = new Map()

export const getBufferedAudio = (source, { native = false } = {}) => {
  if (!source) return null

  if (!native && supportsWebAudio()) {
    if (!webAudioPool.has(source)) webAudioPool.set(source, new WebAudioClip(source))
    return webAudioPool.get(source)
  }

  if (!nativeAudioPool.has(source)) {
    const audio = new Audio(source)
    audio.preload = 'auto'
    nativeAudioPool.set(source, audio)
  }

  return nativeAudioPool.get(source)
}

export const configureBufferedAudio = (audio, { loop, volume, channel = 'effects' }) => {
  if (!audio) return
  audio.loop = loop
  setAudioVolume(audio, channel, volume)
}

export const rewindBufferedAudio = (audio) => {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

export const releaseBufferedAudio = (source) => {
  const clip = webAudioPool.get(source)
  if (clip) {
    clip.release()
    webAudioPool.delete(source)
  }

  const audio = nativeAudioPool.get(source)
  if (audio) {
    audio.pause()
    untrackAudio(audio)
    audio.removeAttribute('src')
    audio.load()
    nativeAudioPool.delete(source)
  }

  nativePreparationPool.delete(source)
  releaseWebAudio(source)
}

export const prepareBufferedAudio = (source, { native = false } = {}) => {
  if (!source) return Promise.resolve()
  if (!native && supportsWebAudio()) return prepareWebAudio(source)
  if (nativePreparationPool.has(source)) return nativePreparationPool.get(source)

  const preparation = new Promise((resolve) => {
    const audio = getBufferedAudio(source, { native: true })
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      window.clearTimeout(timeout)
      audio.removeEventListener('canplay', finish)
      audio.removeEventListener('canplaythrough', finish)
      audio.removeEventListener('error', finish)
      resolve()
    }

    const timeout = window.setTimeout(finish, 15000)
    audio.addEventListener('canplay', finish)
    audio.addEventListener('canplaythrough', finish)
    audio.addEventListener('error', finish)

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      finish()
      return
    }

    audio.load()
  })

  nativePreparationPool.set(source, preparation)
  return preparation
}
