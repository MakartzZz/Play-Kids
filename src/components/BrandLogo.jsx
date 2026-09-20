import playKidsWordmark from '../assets/branding/playkids-wordmark.png'

function BrandLogo({ compact = false }) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo--compact' : ''}`}>
      <img src={playKidsWordmark} alt="PlayKids" />
    </div>
  )
}

export default BrandLogo
