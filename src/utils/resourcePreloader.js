import { prepareBufferedAudio, releaseBufferedAudio } from './audioPool.js'

const assetModules = import.meta.glob([
  '../assets/**/*.{png,jpg,jpeg,webp,svg,mp3}',
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
    return path === 'classification/object-sprites.png'
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

const preloadAudio = async (source) => {
  try {
    const response = await fetch(source, { cache: 'force-cache' })
    if (!response.ok) throw new Error(`No se pudo cargar el audio: ${response.status}`)
    await response.arrayBuffer()
  } catch {
    // The media element still gets a chance to prepare the file directly.
  }

  await prepareBufferedAudio(source)
}

const preloadResource = async ({ source, type }) => {
  if (loadedSources.has(source)) return

  if (type === 'audio') await preloadAudio(source)
  else await preloadImage(source)

  loadedSources.add(source)
}

export const getLobbyResources = () => ASSETS.filter(({ path }) => isLobbyAsset(path))
export const getGameResources = (gameId) => ASSETS.filter(({ path }) => isGameAsset(path, gameId))

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

  await Promise.all(Array.from({ length: Math.min(6, queue.length) }, worker))
  onProgress(100)
}
