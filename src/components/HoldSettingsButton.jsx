import { useEffect, useRef, useState } from 'react'
import { SettingsIcon } from './UiIcons.jsx'

const HOLD_DURATION = 1100

function HoldSettingsButton({ onOpen }) {
  const [holding, setHolding] = useState(false)
  const timerRef = useRef(null)
  const openedRef = useRef(false)

  const cancelHold = () => {
    window.clearTimeout(timerRef.current)
    timerRef.current = null
    if (!openedRef.current) setHolding(false)
  }

  const beginHold = (event) => {
    if (event.type === 'pointerdown' && event.button !== 0) return
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return
    if (timerRef.current || openedRef.current) return

    event.preventDefault()
    setHolding(true)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      openedRef.current = true
      navigator.vibrate?.(25)
      onOpen()
    }, HOLD_DURATION)
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return (
    <button
      type="button"
      className={`round-button round-button--settings ${holding ? 'is-holding' : ''}`}
      aria-label="Mantén presionado para abrir los ajustes"
      data-interface-sound="off"
      onPointerDown={beginHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onKeyDown={beginHold}
      onKeyUp={cancelHold}
      onBlur={cancelHold}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => event.preventDefault()}
    >
      <SettingsIcon />
      <span className="round-button__hold-label">Mantén presionado</span>
    </button>
  )
}

export default HoldSettingsButton
