import BootGameScene from './BootGameScene'
import PlayGameScene from './PlayGameScene'

export const gameSettings = {
  playerSpeed: 200,
  numEnemies: 3,
  maxEnemySpeed: 5
}

export const config = {
  width: 256,
  height: 272,
  backgroundColor: 0x000000,
  scene: [BootGameScene, PlayGameScene],
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}
