import { useEffect, useState } from 'react'
import './App.css'
import GameLobby from './components/GameLobby.jsx'
import GamePlaceholder from './components/GamePlaceholder.jsx'
import IntroScreen from './components/IntroScreen.jsx'
import PhoneOrientationGuard from './components/PhoneOrientationGuard.jsx'
import ResourceLoadingScreen from './components/ResourceLoadingScreen.jsx'
import SettingsScreen from './components/SettingsScreen.jsx'
import BalloonsGame from './features/balloons/BalloonsGame.jsx'
import ClassificationGame from './features/classification/ClassificationGame.jsx'
import DirectionsGame from './features/directions/DirectionsGame.jsx'
import EmotionsGame from './features/emotions/EmotionsGame.jsx'
import NumbersGame from './features/numbers/NumbersGame.jsx'
import PatternsGame from './features/patterns/PatternsGame.jsx'
import { lobbyMedia } from './config/media.js'
import useBackgroundMusic from './hooks/useBackgroundMusic.js'
import useInterfaceSounds from './hooks/useInterfaceSounds.js'
import useLobbyNarration from './hooks/useLobbyNarration.js'
import usePhoneOrientationGuard from './hooks/usePhoneOrientationGuard.js'
import { getAudioSettings, updateAudioSetting } from './utils/audioSettings.js'

function App() {
  const [screen, setScreen] = useState('intro')
  const [selectedGame, setSelectedGame] = useState(null)
  const [muted, setMuted] = useState(false)
  const [lobbyEntry, setLobbyEntry] = useState({ type: 'appStart', visit: 0 })
  const [isGuideNarrationPlaying, setIsGuideNarrationPlaying] = useState(false)
  const [audioSettings, setAudioSettings] = useState(getAudioSettings)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  ))
  const { blocked: orientationBlocked, requestPortraitLock } = usePhoneOrientationGuard()
  const effectiveMuted = muted || orientationBlocked

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    const updatePageActivity = () => {
      document.documentElement.classList.toggle('is-page-inactive', document.hidden)
    }

    updatePageActivity()
    document.addEventListener('visibilitychange', updatePageActivity)
    return () => {
      document.removeEventListener('visibilitychange', updatePageActivity)
      document.documentElement.classList.remove('is-page-inactive')
    }
  }, [])

  const narrationSource = lobbyMedia.narrationByEntry[lobbyEntry.type]
  const isLobbyScreen = screen === 'lobby' || screen === 'settings'
  const isGameScreen = screen === 'game' && Boolean(selectedGame)
  const backgroundMusicSource = isGameScreen ? selectedGame.musicSource : lobbyMedia.musicSource
  const isLobbyNarrationPlaying = useLobbyNarration({
    cueId: `${lobbyEntry.type}-${lobbyEntry.visit}`,
    source: narrationSource,
    shouldPlay: screen === 'lobby' && !effectiveMuted,
    volume: lobbyMedia.narrationVolume,
  })
  const backgroundMusicVolume = isGameScreen
    ? selectedGame.musicVolume
    : isLobbyNarrationPlaying || isGuideNarrationPlaying
      ? lobbyMedia.musicDuckedVolume
      : lobbyMedia.musicVolume

  useBackgroundMusic(
    backgroundMusicSource,
    (isLobbyScreen || isGameScreen) && !effectiveMuted,
    backgroundMusicVolume,
  )
  useInterfaceSounds(effectiveMuted)

  const withOrientationGuard = (content) => (
    <>
      {content}
      <PhoneOrientationGuard
        active={orientationBlocked}
        muted={muted}
        onRequestPortrait={requestPortraitLock}
      />
    </>
  )

  const openGame = (game) => {
    setSelectedGame(game)
    setScreen('game-loading')
  }

  const returnToLobby = () => {
    setLobbyEntry((current) => ({ type: 'gameReturn', visit: current.visit + 1 }))
    setScreen('lobby-loading')
  }

  const changeAudioSetting = (channel, value) => {
    setAudioSettings(updateAudioSetting(channel, value))
  }

  const installApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  if (screen === 'intro') {
    return withOrientationGuard(<IntroScreen onComplete={() => setScreen('lobby')} />)
  }

  if (screen === 'game-loading' && selectedGame) {
    return withOrientationGuard(
      <ResourceLoadingScreen
        game={selectedGame}
        muted={effectiveMuted}
        onComplete={() => setScreen('game')}
      />,
    )
  }

  if (screen === 'lobby-loading' && selectedGame) {
    return withOrientationGuard(
      <ResourceLoadingScreen
        destination="lobby"
        game={selectedGame}
        muted={effectiveMuted}
        onComplete={() => setScreen('lobby')}
      />,
    )
  }

  if (screen === 'game' && selectedGame) {
    if (selectedGame.id === 'clasificacion') {
      return withOrientationGuard(
        <ClassificationGame
          game={selectedGame}
          muted={effectiveMuted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />,
      )
    }

    if (selectedGame.id === 'direcciones') {
      return withOrientationGuard(
        <DirectionsGame
          game={selectedGame}
          muted={effectiveMuted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />,
      )
    }

    if (selectedGame.id === 'numeros') {
      return withOrientationGuard(
        <NumbersGame
          game={selectedGame}
          muted={effectiveMuted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />,
      )
    }

    if (selectedGame.id === 'patrones') {
      return withOrientationGuard(
        <PatternsGame
          game={selectedGame}
          muted={effectiveMuted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />,
      )
    }

    if (selectedGame.id === 'emociones') {
      return withOrientationGuard(
        <EmotionsGame
          game={selectedGame}
          muted={effectiveMuted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />,
      )
    }

    if (selectedGame.id === 'cuenta-explota') {
      return withOrientationGuard(
        <BalloonsGame
          game={selectedGame}
          muted={effectiveMuted}
          onToggleSound={() => setMuted((current) => !current)}
          onBack={returnToLobby}
        />,
      )
    }

    return withOrientationGuard(<GamePlaceholder game={selectedGame} onBack={returnToLobby} />)
  }

  if (screen === 'settings') {
    return withOrientationGuard(
      <SettingsScreen
        audioSettings={audioSettings}
        installed={installed}
        installAvailable={Boolean(installPrompt)}
        onAudioChange={changeAudioSetting}
        onBack={() => setScreen('lobby')}
        onInstall={installApp}
      />,
    )
  }

  return withOrientationGuard(
    <GameLobby
      entryType={lobbyEntry.type}
      isNarrating={isLobbyNarrationPlaying}
      muted={effectiveMuted}
      onGuideNarrationChange={setIsGuideNarrationPlaying}
      onOpenSettings={() => setScreen('settings')}
      onToggleSound={() => setMuted((current) => !current)}
      onSelectGame={openGame}
    />,
  )
}

export default App
