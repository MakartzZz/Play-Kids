const STORAGE_KEY = 'playkids-audio-settings'

export const DEFAULT_AUDIO_SETTINGS = {
  voices: 1,
  effects: 1,
  music: 1,
}

const trackedAudio = new Map()

const clampVolume = (value) => Math.min(1, Math.max(0, Number(value) || 0))

const readStoredSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_AUDIO_SETTINGS

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return Object.fromEntries(
      Object.entries(DEFAULT_AUDIO_SETTINGS).map(([channel, fallback]) => [
        channel,
        stored && channel in stored ? clampVolume(stored[channel]) : fallback,
      ]),
    )
  } catch {
    return DEFAULT_AUDIO_SETTINGS
  }
}

let currentSettings = readStoredSettings()

const applyVolume = (audio, channel, baseVolume) => {
  if (!audio) return
  const volume = clampVolume(baseVolume) * (currentSettings[channel] ?? 1)

  try {
    audio.volume = clampVolume(volume)
  } catch {
    // iOS mantiene el volumen multimedia bajo el control físico del dispositivo.
  }
}

export const getAudioSettings = () => ({ ...currentSettings })

export const updateAudioSetting = (channel, value) => {
  if (!(channel in DEFAULT_AUDIO_SETTINGS)) return getAudioSettings()

  currentSettings = { ...currentSettings, [channel]: clampVolume(value) }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings))
  } catch {
    // Los ajustes continúan activos durante la sesión aunque no haya almacenamiento.
  }

  trackedAudio.forEach(({ channel: audioChannel, baseVolume }, audio) => {
    applyVolume(audio, audioChannel, baseVolume)
  })

  return getAudioSettings()
}

export const setAudioVolume = (audio, channel, baseVolume, track = true) => {
  if (!audio) return
  if (track) trackedAudio.set(audio, { channel, baseVolume: clampVolume(baseVolume) })
  applyVolume(audio, channel, baseVolume)
}

export const isAppleVolumeRestricted = () => {
  if (typeof navigator === 'undefined') return false
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent || '')
  const isIPadDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isIOS || isIPadDesktopMode
}
