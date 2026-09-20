import { useEffect, useRef, useState } from 'react'
import { getGameResources, preloadResources } from '../utils/resourcePreloader.js'

function ResourceLoadingScreen({ game, onComplete }) {
  const [progress, setProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let active = true

    const load = async () => {
      await preloadResources(getGameResources(game.id), (nextProgress) => {
        if (active) setProgress(nextProgress)
      })
      if (active) onCompleteRef.current()
    }

    void load()
    return () => { active = false }
  }, [game.id])

  return (
    <main className="intro-screen intro-screen--loading" aria-label={`Cargando ${game.title}`}>
      <div className="intro-screen__bubbles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="intro-screen__loader" role="status" aria-live="polite">
        <img className="resource-loader__game-icon" src={game.icon} alt="" />
        <span className="intro-screen__loader-dots" aria-hidden="true"><i /><i /><i /></span>
        <strong>Preparando el juego...</strong>
        <span className="intro-screen__progress" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </span>
        <small>{progress}%</small>
      </div>
    </main>
  )
}

export default ResourceLoadingScreen
