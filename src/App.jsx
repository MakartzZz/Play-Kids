import { useState } from 'react'
import './App.css'
import GameLobby from './components/GameLobby.jsx'
import GamePlaceholder from './components/GamePlaceholder.jsx'
import GameTutorial from './components/GameTutorial.jsx'
import IntroScreen from './components/IntroScreen.jsx'
import ClassificationGame from './features/classification/ClassificationGame.jsx'
import DirectionsGame from './features/directions/DirectionsGame.jsx'
import EmotionsGame from './features/emotions/EmotionsGame.jsx'
import NumbersGame from './features/numbers/NumbersGame.jsx'
import PatternsGame from './features/patterns/PatternsGame.jsx'
import { lobbyMedia } from './config/media.js'
import useBackgroundMusic from './hooks/useBackgroundMusic.js'
import useInterfaceSounds from './hooks/useInterfaceSounds.js'
import useLobbyNarration from './hooks/useLobbyNarration.js'

function App() {
  const [screen, setScreen] = useState('intro')
  const [selectedGame, setSelectedGame] = useState(null)
  const [muted, setMuted] = useState(false)
  const [lobbyEntry, setLobbyEntry] = useState({ type: 'appStart', visit: 0 })
  const [isGuideNarrationPlaying, setIsGuideNarrationPlaying] = useState(false)

  const narrationSource = lobbyMedia.narrationByEntry[lobbyEntry.type]
  const isLobbyNarrationPlaying = useLobbyNarration({
    cueId: `${lobbyEntry.type}-${lobbyEntry.visit}`,
    source: narrationSource,
    shouldPlay: screen === 'lobby' && !muted,
    volume: lobbyMedia.narrationVolume,
  })

  useBackgroundMusic(
    lobbyMedia.musicSource,
    screen !== 'intro' && !muted,
    isLobbyNarrationPlaying || isGuideNarrationPlaying
      ? lobbyMedia.musicDuckedVolume
      : lobbyMedia.musicVolume,
  )
  useInterfaceSounds(muted)

  const openGame = (game) => {
    setSelectedGame(game)
    setScreen('tutorial')
  }

  const returnToLobby = () => {
    setLobbyEntry((current) => ({ type: 'gameReturn', visit: current.visit + 1 }))
    setScreen('lobby')
  }

  if (screen === 'intro') {
    return <IntroScreen onComplete={() => setScreen('lobby')} />
  }

  if (screen === 'tutorial' && selectedGame) {
    return (
      <GameTutorial
        game={selectedGame}
        muted={muted}
        onBack={returnToLobby}
        onNarrationChange={setIsGuideNarrationPlaying}
        onStart={() => setScreen('game')}
        onToggleSound={() => setMuted((current) => !current)}
      />
    )
  }

  if (screen === 'game' && selectedGame) {
    if (selectedGame.id === 'clasificacion') {
      return (
        <ClassificationGame
          game={selectedGame}
          muted={muted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />
      )
    }

    if (selectedGame.id === 'direcciones') {
      return (
        <DirectionsGame
          game={selectedGame}
          muted={muted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />
      )
    }

    if (selectedGame.id === 'numeros') {
      return (
        <NumbersGame
          game={selectedGame}
          muted={muted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />
      )
    }

    if (selectedGame.id === 'patrones') {
      return (
        <PatternsGame
          game={selectedGame}
          muted={muted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />
      )
    }

    if (selectedGame.id === 'emociones') {
      return (
        <EmotionsGame
          game={selectedGame}
          muted={muted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />
      )
    }

    return <GamePlaceholder game={selectedGame} onBack={returnToLobby} />
  }

  return (
    <GameLobby
      entryType={lobbyEntry.type}
      isNarrating={isLobbyNarrationPlaying}
      muted={muted}
      onGuideNarrationChange={setIsGuideNarrationPlaying}
      onToggleSound={() => setMuted((current) => !current)}
      onSelectGame={openGame}
    />
  )
}

export default App
