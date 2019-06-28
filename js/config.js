import Scene1 from './Scene1'
import Scene2 from './Scene2'

export const gameSettings = {
  playerSpeed: 200
}

export const config = {
  width: 360,
  height: 640,
  backgroundColor: 0x000000,
  scene: [Scene1, Scene2],
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}
