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
