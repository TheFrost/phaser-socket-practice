import Phaser from 'phaser'
import io from 'socket.io-client'
import { config, gameSettings } from './config'
import Beam from './beam'

export default class Scene2 extends Phaser.Scene {
  constructor () {
    super('playGame')
  }

  create () {
    this.socket = io()
    this.otherPlayers = this.physics.add.group()
    this.socket.on('currentPlayers', (players) => {
      Object.keys(players).map(id => {
        const player = players[id]
        if (player.playerId === this.socket.id) {
          this.addPlayer(player)
        } else {
          this.addOtherPlayers(player)
        }
      })
    })
    this.socket.on('newPlayer', playerInfo => this.addOtherPlayers(playerInfo))
    this.socket.on('disconnect', playerId => {
      this.otherPlayers.getChildren().map(player => {
        if (playerId === player.playerId) {
          player.destroy()
        }
      })
    })
    this.socket.on('playerMoved', ({ x, y, playerId }) => {
      this.otherPlayers.getChildren().map(player => {
        if (playerId === player.playerId) {
          player.setPosition(x, y)
        }
      })
    })

    this.background = this.add.tileSprite(0, 0, config.width, config.height, 'background')
    this.background.setOrigin(0, 0)

    // this.ship1 = this.add.sprite(
    //   config.width / 2 - 50,
    //   config.height / 2, 'ship'
    // )
    // this.ship2 = this.add.sprite(
    //   config.width / 2,
    //   config.height / 2, 'ship2'
    // )
    // this.ship3 = this.add.sprite(
    //   config.width / 2 + 50,
    //   config.height / 2, 'ship3'
    // )

    // this.enemies = this.physics.add.group()
    // this.enemies.add(this.ship1)
    // this.enemies.add(this.ship2)
    // this.enemies.add(this.ship3)

    // this.ship1.play('ship1_anim')
    // this.ship2.play('ship2_anim')
    // this.ship3.play('ship3_anim')

    this.powerUps = this.physics.add.group()

    const maxObjects = 4
    for (let i = 0; i <= maxObjects; i++) {
      const powerUp = this.physics.add.sprite(16, 16, 'power-up')
      this.powerUps.add(powerUp)
      powerUp.setRandomPosition(0, 0, this.game.config.width, this.game.config.height)

      if (Math.random() > 0.5) {
        powerUp.play('red')
      } else {
        powerUp.play('gray')
      }

      powerUp.setVelocity(100, 100)
      powerUp.setCollideWorldBounds(true)
      powerUp.setBounce(1)
    }

    this.cursorKeys = this.input.keyboard.createCursorKeys()
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.projectiles = this.add.group()

    // this.physics.add.collider(this.projectiles, this.powerUps, (projectile, powerUp) => projectile.destroy())

    // this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this)

    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 1)
    graphics.beginPath()
    graphics.moveTo(0, 0)
    graphics.lineTo(config.width, 0)
    graphics.lineTo(config.width, 20)
    graphics.lineTo(0, 20)
    graphics.lineTo(0, 0)
    graphics.closePath()
    graphics.fillPath()

    this.score = 0

    this.scoreLabel = this.add.bitmapText(10, 5, 'pixelFont', 'SCORE', 16)
  }

  addPlayer ({ x, y }) {
    this.player = this.physics.add.sprite(x, y, 'player')
    this.player.play('thrust')
    this.player.setCollideWorldBounds(true)
    this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this)
    this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this)
  }

  addOtherPlayers ({ x, y, playerId }) {
    const player = this.physics.add.sprite(x, y, 'player')
    player.playerId = playerId
    this.otherPlayers.add(player)
  }

  pickPowerUp (player, powerUp) {
    powerUp.disableBody(true, true)
  }

  hurtPlayer (player, enemy) {
    this.resetShipPos(enemy)
    player.x = config.width / 2 - 8
    player.y = config.height - 64
  }

  hitEnemy (projectile, enemy) {
    projectile.destroy()
    enemy.setTexture('explosion')
    enemy.play('explode')
    enemy.once('animationcomplete', () => this.resetShipPos(enemy))
    this.score += 15
    const scoreFormated = this.zeroPad(this.score, 6)
    this.scoreLabel.text = `SCORE ${scoreFormated}`
  }

  moveShip (ship, speed) {
    ship.y += speed
    if (ship.y > config.height) {
      this.resetShipPos(ship)
    }
  }

  resetShipPos (ship) {
    ship.y = 0
    const randomX = Phaser.Math.Between(0, config.width)
    ship.x = randomX
  }

  update () {
    // this.moveShip(this.ship1, 1)
    // this.moveShip(this.ship2, 2)
    // this.moveShip(this.ship3, 3)

    this.background.tilePositionY -= 0.5

    this.movePlayerManager()

    if (this.player) {
      const { x, y } = this.player
      if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
        this.socket.emit('playerMovement', { x, y })
      }

      // save old position data
      this.player.oldPosition = { x, y }
    }

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      this.shootBeam()
    }

    for (let i = 0; i < this.projectiles.getChildren().length; i++) {
      const beam = this.projectiles.getChildren()[i]
      beam.update()
    }
  }

  movePlayerManager () {
    if (this.cursorKeys.left.isDown) {
      this.player.setVelocityX(-gameSettings.playerSpeed)
    } else if (this.cursorKeys.right.isDown) {
      this.player.setVelocityX(gameSettings.playerSpeed)
    }

    if (this.cursorKeys.up.isDown) {
      this.player.setVelocityY(-gameSettings.playerSpeed)
    } else if (this.cursorKeys.down.isDown) {
      this.player.setVelocityY(gameSettings.playerSpeed)
    }
  }

  shootBeam () {
    const beam = new Beam(this, this.player)
    this.socket.emit('beamShot', this.player)

  }

  zeroPad (number, size) {
    let stringNumber = String(number)
    while (stringNumber.length < (size || 2)) {
      stringNumber = `0${stringNumber}`
    }
    return stringNumber
  }
}
