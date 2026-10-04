export function SoundIcon({ muted = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 9v6h4l5 4V5L9 9H5Z" />
      {muted ? (
        <>
          <path d="m18 9 4 4" />
          <path d="m22 9-4 4" />
        </>
      ) : (
        <>
          <path d="M17 9.5a4 4 0 0 1 0 5" />
          <path d="M19.5 7a7.5 7.5 0 0 1 0 10" />
        </>
      )}
    </svg>
  )
}

export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 11 9-7 9 7" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M9.5 19.5v-6h5v6" />
    </svg>
  )
}

export function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8V3m0 5h5" />
      <path d="M5.6 7a8 8 0 1 1-1.1 8" />
    </svg>
  )
}

export function HintIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M8.4 15.5A7 7 0 1 1 15.6 15.5C14.6 16.2 14 17 14 18h-4c0-1-.6-1.8-1.6-2.5Z" />
      <path d="M12 2V.5" />
      <path d="m4.2 4.2-1-1" />
      <path d="m19.8 4.2 1-1" />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5.5v13L19 12 8 5.5Z" />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  )
}

export function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m14.5 5-7 7 7 7" />
      <path d="M8 12h11" />
    </svg>
  )
}

export function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="m7.5 10 4.5 4.5 4.5-4.5" />
      <path d="M5 18v2h14v-2" />
    </svg>
  )
}

export function VolumeLevelsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10v4h3l4 3V7l-4 3H4Z" />
      <path d="M15 9.5a4 4 0 0 1 0 5" />
      <path d="M18 7a7 7 0 0 1 0 10" />
    </svg>
  )
}

export function VoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5Z" />
      <path d="M4.5 11a7.5 7.5 0 0 0 15 0" />
      <path d="M12 18.5V22" />
      <path d="M9 22h6" />
    </svg>
  )
}

export function EffectsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9L12 2Z" />
      <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
      <path d="m5 13 .8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z" />
    </svg>
  )
}

export function MusicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18V6l10-2v12" />
      <ellipse cx="6.5" cy="18" rx="2.5" ry="2" />
      <ellipse cx="16.5" cy="16" rx="2.5" ry="2" />
    </svg>
  )
}
