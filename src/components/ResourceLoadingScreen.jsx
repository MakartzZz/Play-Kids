import { useEffect, useRef, useState } from 'react'
import playKidsIcon from '../assets/branding/playkids-icon.png'
import {
  getGameResources,
  getLobbyResources,
  preloadResources,
  releaseResources,
} from '../utils/resourcePreloader.js'

function ResourceLoadingScreen({ destination = 'game', game, onComplete }) {
  const [progress, setProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)
  const isLobbyDestination = destination === 'lobby'

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let active = true

    const load = async () => {
      const resourcesToRelease = isLobbyDestination
        ? getGameResources(game.id)
        : getLobbyResources()
      const resourcesToLoad = isLobbyDestination
        ? getLobbyResources()
        : getGameResources(game.id)

      releaseResources(resourcesToRelease)
      await preloadResources(resourcesToLoad, (nextProgress) => {
        if (active) setProgress(nextProgress)
      })
      if (active) onCompleteRef.current()
    }

    void load()
    return () => { active = false }
  }, [game.id, isLobbyDestination])

  const loadingTitle = isLobbyDestination ? 'Preparando el lobby...' : 'Preparando el juego...'
  const loadingLabel = isLobbyDestination ? 'Cargando el lobby' : `Cargando ${game.title}`
  const loadingIcon = isLobbyDestination ? playKidsIcon : game.icon

  return (
    <main className="intro-screen intro-screen--loading" aria-label={loadingLabel}>
      <div className="intro-screen__bubbles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="intro-screen__loader" role="status" aria-live="polite">
        <img className="resource-loader__game-icon" src={loadingIcon} alt="" />
        <span className="intro-screen__loader-dots" aria-hidden="true"><i /><i /><i /></span>
        <strong>{loadingTitle}</strong>
        <span className="intro-screen__progress" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </span>
        <small>{progress}%</small>
      </div>
    </main>
  )
}

export default ResourceLoadingScreen
