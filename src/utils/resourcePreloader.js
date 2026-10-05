import { prepareBufferedAudio, releaseBufferedAudio } from './audioPool.js'

const assetModules = import.meta.glob([
  '../assets/**/*.{jpg,jpeg,webp,svg,mp3}',
  '!../assets/tutorials/**',
], {
  eager: true,
  query: '?url',
  import: 'default',
})

const ASSETS = Object.entries(assetModules).map(([modulePath, source]) => ({
  path: modulePath.replace('../assets/', ''),
  source,
  type: modulePath.endsWith('.mp3') ? 'audio' : 'image',
}))

const loadedSources = new Set()
const COMMON_GAME_SOUNDS = new Set([
  'sounds/click.mp3',
  'sounds/hover.mp3',
  'sounds/correct.mp3',
  'sounds/miss.mp3',
  'sounds/level-complete.mp3',
])

const isSmallScreen = () => window.matchMedia('(max-width: 719px)').matches
const isPortraitScreen = () => window.matchMedia('(orientation: portrait)').matches
const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches

const shouldPreloadBackground = (path) => {
  const small = isSmallScreen()
  const portrait = isPortraitScreen()

  if (path.startsWith('backgrounds/lobby-')) {
    const selected = small
      ? 'backgrounds/lobby-mobile.webp'
      : portrait
        ? 'backgrounds/lobby-tablet-portrait.webp'
        : 'backgrounds/lobby-tablet.webp'
    return path === selected
  }

  if (path.startsWith('backgrounds/classification-')) {
    return path === (small
      ? 'backgrounds/classification-mobile.webp'
      : 'backgrounds/classification-tablet.webp')
  }

  if (path.startsWith('backgrounds/directions-')) {
    const isLargeTablet = window.matchMedia('(min-width: 1300px) and (min-height: 900px) and (orientation: landscape) and (pointer: coarse)').matches
    const selected = small
      ? 'backgrounds/directions-mobile.webp'
      : isLargeTablet
        ? 'backgrounds/directions-ipad-pro.webp'
        : portrait
          ? 'backgrounds/directions-tablet-portrait.webp'
          : 'backgrounds/directions-tablet.webp'
    return path === selected
  }

  if (path.startsWith('backgrounds/patterns-')) {
    const selected = small
      ? 'backgrounds/patterns-mobile.webp'
      : portrait
        ? 'backgrounds/patterns-tablet-portrait.webp'
        : isCoarsePointer()
          ? 'backgrounds/patterns-tablet.webp'
          : 'backgrounds/patterns-desktop.webp'
    return path === selected
  }

  if (path.startsWith('backgrounds/balloons-')) {
    return path === (small
      ? 'backgrounds/balloons-portrait.webp'
      : 'backgrounds/balloons-landscape.webp')
  }

  return true
}

const filterResourcesForDevice = (resources) => resources.filter(({ path, type }) => (
  type !== 'image' || shouldPreloadBackground(path)
))

const isLobbyAsset = (path) => (
  path.startsWith('backgrounds/lobby-')
  || path.startsWith('branding/')
  || path.startsWith('characters/')
  || path.startsWith('minigames/')
  || path.startsWith('ui/')
  || path === 'sounds/intro.mp3'
  || path === 'sounds/lobby-background.mp3'
  || path === 'sounds/saludo-lobby.mp3'
  || path === 'sounds/return-to-lobby.mp3'
  || path === 'sounds/click.mp3'
  || path === 'sounds/hover.mp3'
  || path === 'sounds/balloons/guide.mp3'
  || path.startsWith('sounds/guide-')
)

const isGameAsset = (path, gameId) => {
  if (COMMON_GAME_SOUNDS.has(path)) return true

  if (gameId === 'clasificacion') {
    return path.startsWith('classification/')
      || path.startsWith('backgrounds/classification-')
      || path.startsWith('sounds/classification/')
  }

  if (gameId === 'direcciones') {
    return path.startsWith('directions/')
      || path.startsWith('backgrounds/directions-')
      || path.startsWith('sounds/directions/')
  }

  if (gameId === 'numeros') {
    return path === 'classification/object-sprites.webp'
      || path.startsWith('backgrounds/classification-')
      || path.startsWith('sounds/numbers/')
  }

  if (gameId === 'patrones') {
    return path.startsWith('patterns/')
      || path.startsWith('backgrounds/patterns-')
      || path.startsWith('sounds/patterns/')
  }

  if (gameId === 'emociones') {
    return path.startsWith('emotions/')
      || path.startsWith('backgrounds/classification-')
      || path.startsWith('sounds/emotions/')
  }

  if (gameId === 'cuenta-explota') {
    return path.startsWith('balloons/')
      || path.startsWith('backgrounds/balloons-')
      || path.startsWith('sounds/balloons/')
  }

  return false
}

const preloadImage = (source) => new Promise((resolve) => {
  const image = new Image()
  let finished = false

  const finish = async () => {
    if (finished) return
    finished = true

    try {
      await image.decode()
    } catch {
      // Continue even if a browser cannot decode one optional resource.
    }
    resolve()
  }

  image.addEventListener('load', finish, { once: true })
  image.addEventListener('error', finish, { once: true })
  image.src = source
})

const preloadAudio = async (source, path) => {
  const isStreamingMusic = path === 'sounds/lobby-background.mp3' || path.endsWith('/music.mp3')
  try {
    await prepareBufferedAudio(source, { native: isStreamingMusic })
  } catch {
    // Un sonido opcional no debe dejar bloqueada la pantalla de carga.
  }
}

const preloadResource = async ({ source, type, path }) => {
  if (loadedSources.has(source)) return

  if (type === 'audio') await preloadAudio(source, path)
  else await preloadImage(source)

  loadedSources.add(source)
}

export const getLobbyResources = () => filterResourcesForDevice(ASSETS.filter(({ path }) => isLobbyAsset(path)))
export const getGameResources = (gameId) => filterResourcesForDevice(ASSETS.filter(({ path }) => isGameAsset(path, gameId)))

export const releaseResources = (resources) => {
  const uniqueResources = [...new Map(resources.map((resource) => [resource.source, resource])).values()]

  uniqueResources.forEach(({ source, type }) => {
    loadedSources.delete(source)
    if (type === 'audio') releaseBufferedAudio(source)
  })
}

export const preloadResources = async (resources, onProgress = () => {}) => {
  const uniqueResources = [...new Map(resources.map((resource) => [resource.source, resource])).values()]
  let completed = uniqueResources.filter(({ source }) => loadedSources.has(source)).length
  onProgress(uniqueResources.length === 0 ? 100 : Math.round((completed / uniqueResources.length) * 100))

  const queue = uniqueResources.filter(({ source }) => !loadedSources.has(source))
  const worker = async () => {
    while (queue.length > 0) {
      const resource = queue.shift()
      await preloadResource(resource)
      completed += 1
      onProgress(Math.round((completed / uniqueResources.length) * 100))
    }
  }

  const concurrency = isCoarsePointer() || isSmallScreen() ? 3 : 6
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
  onProgress(100)
}
