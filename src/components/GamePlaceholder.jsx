import { HomeIcon } from './UiIcons.jsx'

function GamePlaceholder({ game, onBack }) {
  return (
    <main className="game-placeholder" style={{ '--game-accent': game.accent, '--game-soft': game.softColor }}>
      <header className="game-placeholder__header">
        <button type="button" className="home-button" onClick={onBack} aria-label="Volver al menú principal">
          <HomeIcon />
        </button>
      </header>

      <section className="game-placeholder__content">
        <span className="game-placeholder__icon" aria-hidden="true">
          <img src={game.icon} alt="" />
        </span>
        <p>Próxima aventura</p>
        <h1>{game.title}</h1>
        <span>{game.description}</span>
        <div className="game-placeholder__stage">
          <strong>Espacio preparado para el minijuego</strong>
          <small>Aquí construiremos sus instrucciones, rondas, sonidos y recompensas.</small>
        </div>
        <button type="button" className="back-button" onClick={onBack}>← Volver a los juegos</button>
      </section>
    </main>
  )
}

export default GamePlaceholder
