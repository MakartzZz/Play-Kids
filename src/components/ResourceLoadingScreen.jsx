import { useEffect, useRef, useState } from 'react'
import LobbyMascot from './LobbyMascot.jsx'
import LoadingTopicIdeas from './LoadingTopicIdeas.jsx'
import { getBufferedAudio, rewindBufferedAudio } from '../utils/audioPool.js'
import {
  getGameResources,
  getLobbyResources,
  preloadResources,
  releaseResources,
} from '../utils/resourcePreloader.js'

function ResourceLoadingScreen({ destination = 'game', game, muted = false, onComplete }) {
  const [progress, setProgress] = useState(0)
  const [resourcesReady, setResourcesReady] = useState(false)
  const [introFinished, setIntroFinished] = useState(destination === 'lobby')
  const onCompleteRef = useRef(onComplete)
  const introAudioRef = useRef(null)
  const completedRef = useRef(false)
  const isLobbyDestination = destination === 'lobby'

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let active = true
    let introAudio = null
    const finishIntro = () => {
      if (active) setIntroFinished(true)
    }

    const load = async () => {
      const resourcesToRelease = isLobbyDestination
        ? getGameResources(game.id)
        : getLobbyResources()
      const resourcesToLoad = isLobbyDestination
        ? getLobbyResources()
        : getGameResources(game.id)

      releaseResources(resourcesToRelease)

      if (!isLobbyDestination && game.introAudio && !muted) {
        introAudio = getBufferedAudio(game.introAudio)
        introAudioRef.current = introAudio
        introAudio.volume = 0.9
        introAudio.addEventListener('ended', finishIntro)
        introAudio.addEventListener('error', finishIntro)
        rewindBufferedAudio(introAudio)
        void introAudio.play().catch(finishIntro)
      } else {
        setIntroFinished(true)
      }

      await preloadResources(resourcesToLoad, (nextProgress) => {
        if (active) setProgress(nextProgress)
      })
      if (active) setResourcesReady(true)
    }

    void load()
    return () => {
      active = false
      introAudio?.pause()
      introAudio?.removeEventListener('ended', finishIntro)
      introAudio?.removeEventListener('error', finishIntro)
      introAudioRef.current = null
    }
  }, [game.id, game.introAudio, isLobbyDestination, muted])

  useEffect(() => {
    if (!resourcesReady || !introFinished || completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }, [introFinished, resourcesReady])

  const skipIntro = () => {
    if (isLobbyDestination || !resourcesReady || introFinished) return
    rewindBufferedAudio(introAudioRef.current)
    setIntroFinished(true)
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    skipIntro()
  }

  const canSkipIntro = !isLobbyDestination && resourcesReady && !introFinished
  const loadingTitle = isLobbyDestination
    ? 'Preparando el lobby...'
    : resourcesReady
      ? '¡Todo listo!'
      : 'Preparando el juego...'
  const loadingLabel = isLobbyDestination ? 'Cargando el lobby' : `Cargando ${game.title}`

  return (
    <main
      className={`intro-screen intro-screen--loading ${canSkipIntro ? 'is-ready-to-skip' : ''}`}
      aria-label={canSkipIntro ? `${loadingLabel}. Toca para comenzar.` : loadingLabel}
      onClick={skipIntro}
      onKeyDown={handleKeyDown}
      role={canSkipIntro ? 'button' : undefined}
      tabIndex={canSkipIntro ? 0 : undefined}
    >
      <div className="intro-screen__bubbles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="intro-screen__loader" role="status" aria-live="polite">
        {!isLobbyDestination && (
          <div className="resource-loader__speaker">
            {!introFinished && <LoadingTopicIdeas gameId={game.id} />}
            <LobbyMascot className="resource-loader__mascot" talking={!introFinished} />
          </div>
        )}
        <span className="intro-screen__loader-dots" aria-hidden="true"><i /><i /><i /></span>
        <strong>{loadingTitle}</strong>
        <span className="intro-screen__progress" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </span>
        <small>{progress}%</small>
        {canSkipIntro && <em className="resource-loader__skip">Toca para comenzar</em>}
      </div>
    </main>
  )
}

export default ResourceLoadingScreen
