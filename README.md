# PlayKids

Aplicación web educativa para niñas y niños de 4 a 6 años, construida con React, Vite y CSS.

## Desarrollo

```bash
npm install
npm run dev
```

## Estructura inicial

- `src/components/IntroScreen.jsx`: portada, secuencia de entrada y desbloqueo de audio en iPhone/iPad.
- `src/components/IntroMascot.jsx`: dos cuadros provisionales para demostrar el cambio de sprite.
- `src/components/GameLobby.jsx`: lobby responsive con acceso a los cinco minijuegos.
- `src/components/GamePlaceholder.jsx`: destino temporal que reserva el espacio de cada juego.
- `src/data/minigames.js`: nombres, colores e identidad provisional de los juegos.
- `src/config/media.js`: punto único para conectar el futuro sonido de portada y ajustar sus tiempos.

La interfaz usa áreas seguras de iOS, unidades de viewport modernas y una composición específica para móvil y otra compartida por tabletas y computadoras. La configuración PWA ya permite generar el manifiesto y los recursos para uso sin conexión.
