import clasificacionIcon from '../assets/minigames/clasificacion.webp'
import direccionesIcon from '../assets/minigames/direcciones.webp'
import emocionesIcon from '../assets/minigames/emociones.webp'
import numerosIcon from '../assets/minigames/numeros.webp'
import patronesIcon from '../assets/minigames/patrones.webp'
import cuentaExplotaIcon from '../assets/minigames/cuenta-explota.webp'
import clasificacionGuideAudio from '../assets/sounds/guide-clasificacion.mp3'
import direccionesGuideAudio from '../assets/sounds/guide-direcciones.mp3'
import emocionesGuideAudio from '../assets/sounds/guide-emociones.mp3'
import numerosGuideAudio from '../assets/sounds/guide-numeros.mp3'
import patronesGuideAudio from '../assets/sounds/guide-patrones.mp3'
import clasificacionMusic from '../assets/sounds/classification/music.mp3'
import direccionesMusic from '../assets/sounds/directions/music.mp3'
import numerosMusic from '../assets/sounds/numbers/music.mp3'
import patronesMusic from '../assets/sounds/patterns/music.mp3'
import emocionesMusic from '../assets/sounds/emotions/music.mp3'
import globosMusic from '../assets/sounds/balloons/music.mp3'
import clasificacionIntroAudio from '../assets/sounds/classification/intro.mp3'
import direccionesIntroAudio from '../assets/sounds/directions/intro.mp3'
import emocionesIntroAudio from '../assets/sounds/emotions/intro.mp3'
import numerosIntroAudio from '../assets/sounds/numbers/intro.mp3'
import patronesIntroAudio from '../assets/sounds/patterns/intro.mp3'
import { balloonsGuideAudio } from '../features/balloons/balloonsAudio.js'

export const minigames = [
  {
    id: 'clasificacion',
    title: 'Clasificación',
    description: 'Agrupa objetos por su color',
    guideTitle: '¡Juguemos a clasificar!',
    guideMessage: 'Observa cada objeto y colócalo con los que tengan su mismo color.',
    guideAudio: clasificacionGuideAudio,
    introAudio: clasificacionIntroAudio,
    musicSource: clasificacionMusic,
    musicVolume: 0.1,
    icon: clasificacionIcon,
    accent: '#ff6a5f',
    softColor: '#fff1ed',
  },
  {
    id: 'direcciones',
    title: 'Direcciones',
    description: 'Arriba, abajo y a los lados',
    guideTitle: '¿Jugamos con las direcciones?',
    guideMessage: 'Ayuda al conejito a moverse por el camino correcto.',
    guideAudio: direccionesGuideAudio,
    introAudio: direccionesIntroAudio,
    musicSource: direccionesMusic,
    musicVolume: 0.1,
    icon: direccionesIcon,
    accent: '#8c5ce7',
    softColor: '#f4efff',
  },
  {
    id: 'numeros',
    title: 'Números',
    description: 'Números y cantidades del 1 al 5',
    guideTitle: '¿Contamos juntos?',
    guideMessage: 'Cuenta los objetos y elige el número correcto.',
    guideAudio: numerosGuideAudio,
    introAudio: numerosIntroAudio,
    musicSource: numerosMusic,
    musicVolume: 0.1,
    icon: numerosIcon,
    accent: '#2c8df0',
    softColor: '#ebf6ff',
  },
  {
    id: 'patrones',
    title: 'Patrones',
    description: 'Secuencias y memoria',
    guideTitle: '¿Buscamos patrones?',
    guideMessage: 'Observa la secuencia y descubre qué figura sigue.',
    guideAudio: patronesGuideAudio,
    introAudio: patronesIntroAudio,
    musicSource: patronesMusic,
    musicVolume: 0.1,
    icon: patronesIcon,
    accent: '#ed62a7',
    softColor: '#fff0f7',
  },
  {
    id: 'emociones',
    title: 'Emociones',
    description: 'Reconoce cómo nos sentimos',
    guideTitle: '¿Exploramos las emociones?',
    guideMessage: 'Mira cada situación y descubre cómo se siente nuestro amiguito.',
    guideAudio: emocionesGuideAudio,
    introAudio: emocionesIntroAudio,
    musicSource: emocionesMusic,
    musicVolume: 0.1,
    icon: emocionesIcon,
    accent: '#f5a623',
    softColor: '#fff7df',
  },
  {
    id: 'cuenta-explota',
    title: 'Cuenta y explota',
    description: 'Cuenta globos del 5 al 10',
    guideTitle: '¿Contamos globos?',
    guideMessage: 'Revienta los globos del color indicado y cuenta conmigo.',
    guideAudio: balloonsGuideAudio,
    introAudio: balloonsGuideAudio,
    musicSource: globosMusic,
    musicVolume: 0.1,
    icon: cuentaExplotaIcon,
    accent: '#169dcc',
    softColor: '#eafaff',
  },
]
