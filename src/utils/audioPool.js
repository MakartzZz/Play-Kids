const audioPool = new Map()
const audioPreparationPool = new Map()

export const getBufferedAudio = (source) => {
  if (!source) return null

  if (!audioPool.has(source)) {
    const audio = new Audio(source)
    audio.preload = 'auto'
    audioPool.set(source, audio)
  }

  return audioPool.get(source)
}

export const rewindBufferedAudio = (audio) => {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

export const prepareBufferedAudio = (source) => {
  if (!source) return Promise.resolve()
  if (audioPreparationPool.has(source)) return audioPreparationPool.get(source)

  const preparation = new Promise((resolve) => {
    const audio = getBufferedAudio(source)
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

  audioPreparationPool.set(source, preparation)
  return preparation
}
