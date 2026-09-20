import lionAwake from '../assets/characters/playkids-lion-head.png'
import lionBlink from '../assets/characters/playkids-lion-blink.png'

function IntroMascot({ awake }) {
  return (
    <div className={`intro-mascot ${awake ? 'is-awake' : ''}`}>
      <img
        className="intro-mascot__frame intro-mascot__frame--sleeping"
        src={lionBlink}
        alt="León de PlayKids"
      />
      <img
        className="intro-mascot__frame intro-mascot__frame--awake"
        src={lionAwake}
        alt=""
        aria-hidden="true"
      />
    </div>
  )
}

export default IntroMascot
