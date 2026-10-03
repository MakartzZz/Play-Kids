import objectSprites from '../assets/classification/object-sprites.png'
import movementArrow from '../assets/directions/movement-arrow.png'
import happyEmotion from '../assets/emotions/happy.png'
import sadEmotion from '../assets/emotions/sad.png'
import surprisedEmotion from '../assets/emotions/surprised.png'
import circlePattern from '../assets/patterns/circle-blue.png'
import starPattern from '../assets/patterns/star-red.png'
import balloonSprites from '../assets/balloons/balloon-sprites.png'

const classificationIdeas = [
  { position: '0% 0%' },
  { position: '66.667% 0%' },
  { position: '0% 33.333%' },
]

const directionIdeas = [0, 90, -90, 180]
const numberIdeas = [1, 2, 3, 4, 5]
const patternIdeas = [circlePattern, starPattern, circlePattern, starPattern]
const emotionIdeas = [happyEmotion, surprisedEmotion, sadEmotion]
const balloonIdeas = ['0 0', '50% 0', '0 100%', '50% 100%']

function LoadingTopicIdeas({ gameId }) {
  let ideas = null

  if (gameId === 'clasificacion') {
    ideas = classificationIdeas.map(({ position }) => (
      <i className="resource-loader__idea" key={position}>
        <span
          className="resource-loader__idea-sprite resource-loader__idea-sprite--object"
          style={{ backgroundImage: `url(${objectSprites})`, backgroundPosition: position }}
        />
      </i>
    ))
  }

  if (gameId === 'direcciones') {
    ideas = directionIdeas.map((rotation) => (
      <i className="resource-loader__idea" key={rotation}>
        <img src={movementArrow} style={{ transform: `rotate(${rotation}deg)` }} alt="" />
      </i>
    ))
  }

  if (gameId === 'numeros') {
    ideas = numberIdeas.map((number) => (
      <i className="resource-loader__idea resource-loader__idea--number" key={number}>{number}</i>
    ))
  }

  if (gameId === 'patrones') {
    ideas = patternIdeas.map((source, index) => (
      <i className="resource-loader__idea resource-loader__idea--pattern" key={`${source}-${index}`}>
        <img src={source} alt="" />
      </i>
    ))
  }

  if (gameId === 'emociones') {
    ideas = emotionIdeas.map((source) => (
      <i className="resource-loader__idea resource-loader__idea--emotion" key={source}>
        <img src={source} alt="" />
      </i>
    ))
  }

  if (gameId === 'cuenta-explota') {
    ideas = balloonIdeas.map((position) => (
      <i className="resource-loader__idea" key={position}>
        <span
          className="resource-loader__idea-sprite resource-loader__idea-sprite--balloon"
          style={{ backgroundImage: `url(${balloonSprites})`, backgroundPosition: position }}
        />
      </i>
    ))
  }

  if (!ideas) return null

  return <span className={`resource-loader__ideas resource-loader__ideas--${gameId}`} aria-hidden="true">{ideas}</span>
}

export default LoadingTopicIdeas
