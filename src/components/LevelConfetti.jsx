import './level-confetti.css'

const CONFETTI_COLORS = ['#ff4d6d', '#ffd43b', '#51cf66', '#339af0', '#845ef7', '#ff922b']

const PARTICLES = Array.from({ length: 48 }, (_, index) => ({
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  delay: `${(index % 12) * 32}ms`,
  duration: `${850 + ((index * 47) % 420)}ms`,
  rise: `${-24 - ((index * 13) % 48)}vh`,
  size: `${7 + (index % 5)}px`,
  spin: `${360 + ((index * 73) % 720)}deg`,
  spinBack: `${-360 - ((index * 73) % 720)}deg`,
  top: `${55 + ((index * 17) % 39)}%`,
  travel: `${22 + ((index * 11) % 32)}vw`,
  travelBack: `${-22 - ((index * 11) % 32)}vw`,
}))

function LevelConfetti() {
  return (
    <div className="level-confetti" aria-hidden="true">
      {PARTICLES.map((particle, index) => {
        const side = index % 2 === 0 ? 'left' : 'right'
        return (
          <i
            className={`level-confetti__particle is-${side} ${index % 3 === 0 ? 'is-round' : ''}`}
            style={{
              '--confetti-color': particle.color,
              '--confetti-delay': particle.delay,
              '--confetti-duration': particle.duration,
              '--confetti-rise': particle.rise,
              '--confetti-size': particle.size,
              '--confetti-spin': particle.spin,
              '--confetti-spin-back': particle.spinBack,
              '--confetti-top': particle.top,
              '--confetti-travel': particle.travel,
              '--confetti-travel-back': particle.travelBack,
            }}
            key={`${side}-${index}`}
          />
        )
      })}
    </div>
  )
}

export default LevelConfetti
