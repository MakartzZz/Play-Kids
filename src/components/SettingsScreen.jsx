import { useEffect, useRef } from 'react'
import { BackIcon, DownloadIcon, EffectsIcon, MusicIcon, VoiceIcon, VolumeLevelsIcon } from './UiIcons.jsx'
import voicePreview from '../assets/sounds/classification/objects/apple.mp3'
import effectPreview from '../assets/sounds/correct.mp3'
import { getBufferedAudio, rewindBufferedAudio } from '../utils/audioPool.js'
import { isAppleVolumeRestricted, setAudioVolume } from '../utils/audioSettings.js'

const CHANNELS = [
  { id: 'voices', Icon: VoiceIcon, title: 'Voces', description: 'Instrucciones, pistas y palabras.', preview: voicePreview, previewVolume: 0.9 },
  { id: 'effects', Icon: EffectsIcon, title: 'Sonidos', description: 'Aciertos, botones y efectos del juego.', preview: effectPreview, previewVolume: 0.55 },
  { id: 'music', Icon: MusicIcon, title: 'Música', description: 'Música de fondo de las aventuras.' },
]

const isIOS = () => {
  const appleTouch = isAppleVolumeRestricted()
  return appleTouch && /iPad|iPhone|iPod|Macintosh/i.test(navigator.userAgent || '')
}

function SettingsScreen({ audioSettings, installed, installAvailable, onAudioChange, onBack, onInstall }) {
  const volumeRestricted = isAppleVolumeRestricted()
  const previewAudioRef = useRef(null)

  const playPreview = (channel) => {
    const audio = getBufferedAudio(channel.preview)
    previewAudioRef.current?.pause()
    previewAudioRef.current = audio
    setAudioVolume(audio, channel.id, channel.previewVolume)
    rewindBufferedAudio(audio)
    void audio.play().catch(() => {})
  }

  useEffect(() => () => previewAudioRef.current?.pause(), [])

  return (
    <main className="settings-screen">
      <header className="settings-header">
        <button type="button" className="settings-back" onClick={onBack} aria-label="Volver al lobby">
          <BackIcon />
          <span>Volver</span>
        </button>
        <div className="settings-heading">
          <div>
            <span>Zona para adultos</span>
            <h1>Ajustes</h1>
          </div>
        </div>
      </header>

      <section className="settings-content">
        <article className="settings-card settings-card--audio">
          <div className="settings-card__title">
            <span aria-hidden="true"><VolumeLevelsIcon /></span>
            <div>
              <h2>Volumen del juego</h2>
              <p>Configura cada tipo de sonido por separado.</p>
            </div>
          </div>

          {volumeRestricted ? (
            <div className="settings-apple-note">
              <strong>El volumen se controla desde el dispositivo</strong>
              <p>En iPhone y iPad, usa los botones de volumen para elegir qué tan fuerte se escucha el juego.</p>
            </div>
          ) : (
            <div className="settings-volume-list">
              {CHANNELS.map((channel) => {
                const percent = Math.round(audioSettings[channel.id] * 100)
                const ChannelIcon = channel.Icon
                return (
                  <div className="settings-volume" key={channel.id}>
                    <span className="settings-volume__icon" aria-hidden="true"><ChannelIcon /></span>
                    <span className="settings-volume__copy">
                      <strong>{channel.title}</strong>
                      <small>{channel.description}</small>
                    </span>
                    <span className="settings-volume__controls">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={percent}
                        style={{ '--volume-progress': `${percent}%` }}
                        onChange={(event) => onAudioChange(channel.id, Number(event.target.value) / 100)}
                        aria-label={`Volumen de ${channel.title.toLowerCase()}`}
                      />
                      <output>{percent}%</output>
                      {channel.preview && (
                        <button
                          type="button"
                          className="settings-volume__test"
                          data-interface-sound="off"
                          onClick={() => playPreview(channel)}
                        >
                          Probar
                        </button>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <article className="settings-card settings-card--install">
          <div className="settings-install__icon" aria-hidden="true"><DownloadIcon /></div>
          <div className="settings-install__copy">
            <h2>{installed ? 'PlayKids ya está instalada' : 'Instala PlayKids en este dispositivo'}</h2>
            <p>
              {installed
                ? 'Puedes abrirla desde tus aplicaciones como cualquier otra app.'
                : isIOS()
                  ? 'En Safari, toca Compartir y luego “Agregar a pantalla de inicio”.'
                  : 'Agrégala a tus aplicaciones para abrirla fácilmente desde la pantalla principal.'}
            </p>
          </div>
          {!installed && installAvailable && (
            <button type="button" className="settings-install__button" onClick={onInstall}>Instalar</button>
          )}
        </article>
      </section>
    </main>
  )
}

export default SettingsScreen
