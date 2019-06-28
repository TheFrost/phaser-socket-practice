import Phaser from 'phaser'

export default class Beam extends Phaser.GameObjects.Sprite {
  constructor (scene, player) {
    const x = player.x
    const y = player.y

    super(scene, x, y, 'beam')

    scene.add.existing(this)

    this.play('beam_anim')
    scene.physics.world.enableBody(this)
    this.body.velocity.y = -250

    scene.projectiles.add(this)
  }

  update () {
    if (this.y < 32) {
      this.destroy()
    }
  }
}
