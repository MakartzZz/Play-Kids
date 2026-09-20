import introSound from '../assets/sounds/intro.mp3'
import lobbyBackgroundMusic from '../assets/sounds/lobby-background.mp3'
import lobbyWelcomeSound from '../assets/sounds/saludo-lobby.mp3'
import lobbyReturnSound from '../assets/sounds/return-to-lobby.mp3'

export const introMedia = {
  soundSource: introSound,
  minimumDuration: 3200,
  fallbackDuration: 3800,
  spriteSwapDelay: 1450,
}

export const lobbyMedia = {
  musicSource: lobbyBackgroundMusic,
  musicVolume: 0.18,
  musicDuckedVolume: 0.07,
  narrationVolume: 0.9,
  narrationByEntry: {
    appStart: lobbyWelcomeSound,
    gameReturn: lobbyReturnSound,
  },
}
