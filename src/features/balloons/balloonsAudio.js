import guide from '../../assets/sounds/balloons/guide.mp3'
import prompt5 from '../../assets/sounds/balloons/prompts/5-red.mp3'
import prompt6 from '../../assets/sounds/balloons/prompts/6-blue.mp3'
import prompt7 from '../../assets/sounds/balloons/prompts/7-yellow.mp3'
import prompt8 from '../../assets/sounds/balloons/prompts/8-green.mp3'
import prompt9 from '../../assets/sounds/balloons/prompts/9-purple.mp3'
import prompt10 from '../../assets/sounds/balloons/prompts/10-orange.mp3'
import count1 from '../../assets/sounds/balloons/count/1.mp3'
import count2 from '../../assets/sounds/balloons/count/2.mp3'
import count3 from '../../assets/sounds/balloons/count/3.mp3'
import count4 from '../../assets/sounds/balloons/count/4.mp3'
import count5 from '../../assets/sounds/balloons/count/5.mp3'
import count6 from '../../assets/sounds/balloons/count/6.mp3'
import count7 from '../../assets/sounds/balloons/count/7.mp3'
import count8 from '../../assets/sounds/balloons/count/8.mp3'
import count9 from '../../assets/sounds/balloons/count/9.mp3'
import count10 from '../../assets/sounds/balloons/count/10.mp3'
import hint from '../../assets/sounds/balloons/hints/general.mp3'
import error1 from '../../assets/sounds/balloons/feedback/error-1.mp3'
import error2 from '../../assets/sounds/balloons/feedback/error-2.mp3'
import error3 from '../../assets/sounds/balloons/feedback/error-3.mp3'
import complete5 from '../../assets/sounds/balloons/complete/5-red.mp3'
import complete6 from '../../assets/sounds/balloons/complete/6-blue.mp3'
import complete7 from '../../assets/sounds/balloons/complete/7-yellow.mp3'
import complete8 from '../../assets/sounds/balloons/complete/8-green.mp3'
import complete9 from '../../assets/sounds/balloons/complete/9-purple.mp3'
import complete10 from '../../assets/sounds/balloons/complete/10-orange.mp3'
import gameComplete from '../../assets/sounds/balloons/complete/game.mp3'
import pop1 from '../../assets/sounds/balloons/effects/pop-1.mp3'
import pop2 from '../../assets/sounds/balloons/effects/pop-2.mp3'
import wrongSoft from '../../assets/sounds/balloons/effects/wrong-soft.mp3'
import gameCompleteEffect from '../../assets/sounds/balloons/effects/game-complete.mp3'

export const balloonsGuideAudio = guide

export const balloonPromptAudios = [prompt5, prompt6, prompt7, prompt8, prompt9, prompt10]

export const balloonCountAudios = {
  1: count1,
  2: count2,
  3: count3,
  4: count4,
  5: count5,
  6: count6,
  7: count7,
  8: count8,
  9: count9,
  10: count10,
}

export const balloonHintAudio = hint
export const balloonErrorAudios = [error1, error2, error3]
export const balloonCompleteAudios = [complete5, complete6, complete7, complete8, complete9, complete10]
export const balloonGameCompleteAudio = gameComplete
export const balloonPopEffects = [pop1, pop2]
export const balloonWrongEffect = wrongSoft
export const balloonGameCompleteEffect = gameCompleteEffect
