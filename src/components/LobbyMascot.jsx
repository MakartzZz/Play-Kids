import { useEffect, useRef, useState } from 'react'
import lionAwake from '../assets/characters/playkids-lion-head.png'
import lionBlink from '../assets/characters/playkids-lion-blink.png'
import lionTalkSmall from '../assets/characters/playkids-lion-talk-small.png'
import lionTalkWide from '../assets/characters/playkids-lion-talk-wide.png'

const FIRST_BLINK_DELAY = 1800
const BLINK_DURATION = 220
const MIN_BLINK_GAP = 3300
const BLINK_GAP_VARIATION = 2200
const MIN_SPEECH_FRAME_DURATION = 180
const SPEECH_FRAME_DURATION_VARIATION = 80

function LobbyMascot({ talking = false, className = '' }) {
  const [isBlinking, setIsBlinking] = useState(false)
  const [speechFrame, setSpeechFrame] = useState(0)
  const timersRef = useRef([])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const scheduleBlink = (delay) => {
      const blinkTimer = window.setTimeout(() => {
        setIsBlinking(true)

        const openTimer = window.setTimeout(() => {
          setIsBlinking(false)
          scheduleBlink(MIN_BLINK_GAP + Math.random() * BLINK_GAP_VARIATION)
        }, BLINK_DURATION)

        timersRef.current.push(openTimer)
      }, delay)

      timersRef.current.push(blinkTimer)
    }

    scheduleBlink(FIRST_BLINK_DELAY)

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  useEffect(() => {
    if (!talking) return undefined

    let speechTimer

    const scheduleNextSpeechFrame = () => {
      const delay = MIN_SPEECH_FRAME_DURATION + Math.random() * SPEECH_FRAME_DURATION_VARIATION

      speechTimer = window.setTimeout(() => {
        setSpeechFrame((current) => {
          const offset = 1 + Math.floor(Math.random() * 2)
          return (current + offset) % 3
        })
        scheduleNextSpeechFrame()
      }, delay)
    }

    scheduleNextSpeechFrame()

    return () => window.clearTimeout(speechTimer)
  }, [talking])

  return (
    <span
      className={`${className} lobby-mascot ${isBlinking ? 'is-blinking' : ''} ${talking ? 'is-talking' : ''} ${speechFrame === 0 ? 'has-closed-mouth' : ''} ${speechFrame === 2 ? 'has-wide-mouth' : ''}`}
      aria-hidden="true"
    >
      <img className="lobby-mascot__frame lobby-mascot__frame--awake" src={lionAwake} alt="" />
      <img className="lobby-mascot__frame lobby-mascot__frame--blink" src={lionBlink} alt="" />
      <img className="lobby-mascot__frame lobby-mascot__frame--talk-small" src={lionTalkSmall} alt="" />
      <img className="lobby-mascot__frame lobby-mascot__frame--talk-wide" src={lionTalkWide} alt="" />
    </span>
  )
}

export default LobbyMascot
