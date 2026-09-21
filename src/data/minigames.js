import clasificacionIcon from '../assets/minigames/clasificacion.png'
import direccionesIcon from '../assets/minigames/direcciones.png'
import emocionesIcon from '../assets/minigames/emociones.png'
import numerosIcon from '../assets/minigames/numeros.png'
import patronesIcon from '../assets/minigames/patrones.png'
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

export const minigames = [
  {
    id: 'clasificacion',
    title: 'Clasificación',
    description: 'Agrupa objetos por su color',
    guideTitle: '¡Juguemos a clasificar!',
    guideMessage: 'Observa cada objeto y colócalo con los que tengan su mismo color.',
    guideAudio: clasificacionGuideAudio,
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
    musicSource: emocionesMusic,
    musicVolume: 0.1,
    icon: emocionesIcon,
    accent: '#f5a623',
    softColor: '#fff7df',
  },
]
