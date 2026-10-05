const MAX_BUFFER_COUNT = 48
const CHANNEL_NAMES = ['voices', 'effects']

const bufferCache = new Map()
const preparationPool = new Map()
const activeSourceCounts = new Map()
const activePlaybackStops = new Set()
const desiredChannelVolumes = { voices: 1, effects: 1 }

let audioContext = null
let channelGains = null

export const supportsWebAudio = () => (
  typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext)
)

const touchBuffer = (source, buffer) => {
  bufferCache.delete(source)
  bufferCache.set(source, buffer)
}

const trimBufferCache = () => {
  while (bufferCache.size > MAX_BUFFER_COUNT) {
    let removableSource = null
    for (const source of bufferCache.keys()) {
      if (!activeSourceCounts.has(source)) {
        removableSource = source
        break
      }
    }
    if (!removableSource) return
    bufferCache.delete(removableSource)
    preparationPool.delete(removableSource)
  }
}

const createContext = () => {
  if (audioContext || !supportsWebAudio()) return audioContext
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  try {
    audioContext = new AudioContextClass({ latencyHint: 'interactive' })
  } catch {
    audioContext = new AudioContextClass()
  }
  channelGains = Object.fromEntries(CHANNEL_NAMES.map((channel) => {
    const gain = audioContext.createGain()
    gain.gain.value = desiredChannelVolumes[channel]
    gain.connect(audioContext.destination)
    return [channel, gain]
  }))
  return audioContext
}

export const resumeWebAudio = () => {
  const context = createContext()
  if (!context || context.state === 'running') return Promise.resolve()
  return context.resume().catch(() => {})
}

export const suspendWebAudio = () => {
  if (!audioContext || audioContext.state !== 'running') return Promise.resolve()
  return audioContext.suspend().catch(() => {})
}

export const setWebAudioChannelVolume = (channel, volume) => {
  if (!(channel in desiredChannelVolumes)) return
  desiredChannelVolumes[channel] = Math.min(1, Math.max(0, Number(volume) || 0))
  const gain = channelGains?.[channel]
  if (!gain || !audioContext) return
  gain.gain.setValueAtTime(desiredChannelVolumes[channel], audioContext.currentTime)
}

export const prepareWebAudio = async (source) => {
  if (!source || !supportsWebAudio()) return null
  const cached = bufferCache.get(source)
  if (cached) {
    touchBuffer(source, cached)
    return cached
  }
  if (preparationPool.has(source)) return preparationPool.get(source)

  const preparation = (async () => {
    const context = createContext()
    const response = await fetch(source, { cache: 'force-cache' })
    if (!response.ok) throw new Error(`No se pudo cargar el audio: ${response.status}`)
    const encodedAudio = await response.arrayBuffer()
    const buffer = await context.decodeAudioData(encodedAudio)
    touchBuffer(source, buffer)
    trimBufferCache()
    return buffer
  })().catch((error) => {
    preparationPool.delete(source)
    throw error
  })

  preparationPool.set(source, preparation)
  return preparation
}

export const releaseWebAudio = (source) => {
  if (!source || activeSourceCounts.has(source)) return
  bufferCache.delete(source)
  preparationPool.delete(source)
}

export const playWebAudio = async ({ source, channel, volume, playbackRate, loop, onEnded }) => {
  const context = createContext()
  if (!context) throw new Error('Web Audio no está disponible.')

  const buffer = await prepareWebAudio(source)
  await resumeWebAudio()
  if (document.hidden) throw new Error('La página no está activa.')

  const sourceNode = context.createBufferSource()
  const clipGain = context.createGain()
  sourceNode.buffer = buffer
  sourceNode.loop = Boolean(loop)
  sourceNode.playbackRate.value = Math.max(0.25, Math.min(4, playbackRate || 1))
  clipGain.gain.value = Math.min(1, Math.max(0, volume ?? 1))
  sourceNode.connect(clipGain)
  clipGain.connect(channelGains[channel] ?? channelGains.effects)

  activeSourceCounts.set(source, (activeSourceCounts.get(source) ?? 0) + 1)
  let stopped = false
  const stopPlayback = (notifyEnded = false) => {
    if (stopped) return
    sourceNode.onended = null
    try {
      sourceNode.stop()
    } catch {
      // El nodo pudo terminar entre la comprobación y la detención.
    }
    releasePlayback(notifyEnded)
  }

  const releasePlayback = (notifyEnded) => {
    if (stopped) return
    stopped = true
    sourceNode.onended = null
    sourceNode.disconnect()
    clipGain.disconnect()
    const remaining = (activeSourceCounts.get(source) ?? 1) - 1
    if (remaining > 0) activeSourceCounts.set(source, remaining)
    else activeSourceCounts.delete(source)
    activePlaybackStops.delete(stopPlayback)
    if (notifyEnded) onEnded?.()
    trimBufferCache()
  }

  sourceNode.onended = () => releasePlayback(true)
  sourceNode.start()
  activePlaybackStops.add(stopPlayback)

  return {
    gain: clipGain,
    stop: () => stopPlayback(false),
  }
}

export class WebAudioClip extends EventTarget {
  constructor(source) {
    super()
    this.__playKidsWebAudioClip = true
    this.src = source
    this.preload = 'auto'
    this.loop = false
    this.paused = true
    this.playbackRate = 1
    this.preservesPitch = true
    this._channel = 'effects'
    this._volume = 1
    this._playback = null
    this._playRequest = 0
    this._buffer = null
  }

  setAudioChannel(channel) {
    this._channel = CHANNEL_NAMES.includes(channel) ? channel : 'effects'
  }

  set volume(value) {
    this._volume = Math.min(1, Math.max(0, Number(value) || 0))
    if (this._playback && audioContext) {
      this._playback.gain.gain.setValueAtTime(this._volume, audioContext.currentTime)
    }
  }

  get volume() {
    return this._volume
  }

  set currentTime(value) {
    if (Number(value) === 0 && !this.paused) this.pause()
  }

  get currentTime() {
    return 0
  }

  get duration() {
    return this._buffer?.duration ?? Number.NaN
  }

  get readyState() {
    return this._buffer || bufferCache.has(this.src) ? 3 : 0
  }

  async load() {
    try {
      this._buffer = await prepareWebAudio(this.src)
    } catch {
      this.dispatchEvent(new Event('error'))
    }
  }

  async play() {
    this.pause()
    const request = ++this._playRequest
    this.paused = false

    try {
      this._buffer = await prepareWebAudio(this.src)
      if (request !== this._playRequest) return
      this._playback = await playWebAudio({
        source: this.src,
        channel: this._channel,
        volume: this._volume,
        playbackRate: this.playbackRate,
        loop: this.loop,
        onEnded: () => {
          if (request !== this._playRequest) return
          this._playback = null
          this.paused = true
          this.dispatchEvent(new Event('ended'))
        },
      })
      if (request !== this._playRequest) {
        this._playback.stop()
        this._playback = null
        return
      }
      this.dispatchEvent(new Event('play'))
    } catch (error) {
      if (request !== this._playRequest) return
      this._playback = null
      this.paused = true
      this.dispatchEvent(new Event('error'))
      throw error
    }
  }

  pause() {
    this._playRequest += 1
    this._playback?.stop()
    this._playback = null
    this.paused = true
  }

  release() {
    this.pause()
    this._buffer = null
    releaseWebAudio(this.src)
  }
}

if (typeof window !== 'undefined' && supportsWebAudio()) {
  const unlockAudio = () => { void resumeWebAudio() }
  const stopActiveAudio = () => {
    const stops = [...activePlaybackStops]
    stops.forEach((stop) => stop(true))
    void suspendWebAudio()
  }
  const handleVisibility = () => {
    if (document.hidden) stopActiveAudio()
    else void resumeWebAudio()
  }
  window.addEventListener('pointerdown', unlockAudio, true)
  window.addEventListener('keydown', unlockAudio, true)
  window.addEventListener('pageshow', unlockAudio)
  window.addEventListener('pagehide', stopActiveAudio)
  document.addEventListener('visibilitychange', handleVisibility)
}
