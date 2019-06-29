import Phaser from 'phaser'
import io from 'socket.io-client'
import { config, gameSettings } from './config'
import { zeroPad } from './utils'
import Beam from './beam'

export default class PlayGameScene extends Phaser.Scene {
  constructor () {
    super('playGame')
  }

  create () {
    this.socket = io()
    this.otherPlayers = this.physics.add.group()

    this.bindEvents()
    this.setUpBackground()
    this.setUpEnemies()

    // this.powerUps = this.physics.add.group()

    // const maxObjects = 4
    // for (let i = 0; i <= maxObjects; i++) {
    //   const powerUp = this.physics.add.sprite(16, 16, 'power-up')
    //   this.powerUps.add(powerUp)
    //   powerUp.setRandomPosition(0, 0, this.game.config.width, this.game.config.height)

    //   if (Math.random() > 0.5) {
    //     powerUp.play('red')
    //   } else {
    //     powerUp.play('gray')
    //   }

    //   powerUp.setVelocity(100, 100)
    //   powerUp.setCollideWorldBounds(true)
    //   powerUp.setBounce(1)
    // }

    this.setUpInputs()
    this.setUpProjectiles()
    this.setUpColliders()
    this.setUpScore()
  }

  bindEvents () {
    const { socket } = this

    socket.on('currentPlayers', players => this.currentPlayerEventHandler(players))
    socket.on('newPlayer', playerInfo => this.addOtherPlayers(playerInfo))
    socket.on('disconnect', playerId => this.disconnectEventHandler(playerId))
    socket.on('playerMoved', playerInfo => this.playerMovedEventHandler(playerInfo))
  }

  currentPlayerEventHandler (players) {
    Object.keys(players).map(id => {
      const player = players[id]
      if (player.id === this.socket.id) {
        this.addPlayer(player)
      } else {
        this.addOtherPlayers(player)
      }
    })
  }

  disconnectEventHandler (playerId) {
    this.otherPlayers.getChildren().map(player => {
      if (playerId === player.id) {
        player.destroy()
      }
    })
  }

  playerMovedEventHandler ({ x, y, id: playerId }) {
    this.otherPlayers.getChildren().map(player => {
      if (playerId === player.id) {
        player.setPosition(x, y)
      }
    })
  }

  setUpBackground () {
    this.background = this.add.tileSprite(0, 0, config.width, config.height, 'background')
    this.background.setOrigin(0, 0)
  }

  setUpEnemies () {
    const { numEnemies } = gameSettings
    const { Between } = Phaser.Math

    this.enemies = this.physics.add.group()

    for (let i = 0; i < numEnemies; i++) {
      const shipId = Between(1, 3)
      const ship = this.add.sprite(
        Between(0, config.width),
        0,
        `ship${shipId}`
      )

      ship.play(`ship${shipId}_anim`)

      this.enemies.add(ship)
    }
  }

  setUpInputs () {
    this.cursorKeys = this.input.keyboard.createCursorKeys()
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  setUpProjectiles () {
    this.projectiles = this.add.group()
  }

  setUpColliders () {
    // this.physics.add.collider(this.projectiles, this.powerUps, (projectile, powerUp) => projectile.destroy())
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this)
  }

  setUpScore () {
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

  addOtherPlayers ({ x, y, id: playerId }) {
    const player = this.physics.add.sprite(x, y, 'player')
    player.id = playerId
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
    this.killShip(enemy)
    this.updateScore()
  }

  killShip (ship) {
    ship.setTexture('explosion')
    ship.play('explode')
    ship.once('animationcomplete', () => this.resetShipAfterDeath(ship))
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

  resetShipAfterDeath (ship) {
    const { Between } = Phaser.Math
    const shipId = Between(1, 3)

    ship.setTexture(`ship${shipId}`)
    ship.setVisible(true)
    ship.play(`ship${shipId}_anim`)

    this.resetShipPos(ship)
  }

  updateScore () {
    this.score += 15
    const scoreFormated = zeroPad(this.score, 6)
    this.scoreLabel.text = `SCORE ${scoreFormated}`
  }

  update () {
    this.updateBackground()
    this.moveEnemies()
    this.movePlayerManager()
    this.updateProjectiles()
    this.validateInputs()
  }

  moveEnemies () {
    const { Between } = Phaser.Math
    this.enemies.getChildren().map(enemy => this.moveShip(enemy, Between(1, 3)))
  }

  movePlayerManager () {
    if (this.player === undefined) return

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

    this.emitPlayerPosition()
  }

  emitPlayerPosition () {
    const { x, y, oldPosition } = this.player
    if (oldPosition && (x !== oldPosition.x || y !== oldPosition.y)) {
      this.socket.emit('playerMovement', { x, y })
    }

    this.player.oldPosition = { x, y }
  }

  updateBackground () {
    this.background.tilePositionY -= 0.5
  }

  updateProjectiles () {
    this.projectiles.getChildren().map(beam => beam.update())
  }

  validateInputs () {
    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      this.shootBeam()
    }
  }

  shootBeam () {
    const beam = new Beam(this, this.player)
    beam.init()

    // this.socket.emit('beamShot', this.player)
  }
}
