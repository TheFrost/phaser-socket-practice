const Bundler = require('parcel-bundler')
const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const players = {}

// parcel bundler middleware
const bundler = new Bundler('./*.html', {
  sourceMaps: false
})
app.use(bundler.middleware())

// socket io
io.on('connection', (socket) => {
  console.log('a user connected')

  players[socket.id] = {
    x: Math.floor(Math.random() * 200) + 50,
    y: 620,
    id: socket.id
  }

  socket.emit('currentPlayers', players)

  socket.broadcast.emit('newPlayer', players[socket.id])

  socket.on('disconnect', () => {
    console.log('user disconnect')

    delete players[socket.id]

    io.emit('disconnect', socket.id)
  })

  socket.on('playerMovement', (movementData) => {
    players[socket.id].x = movementData.x
    players[socket.id].y = movementData.y

    socket.broadcast.emit('playerMoved', players[socket.id])
  })

  socket.on('beamShot', () => {
    socket.broadcast.emit('beamShoted', socket.id)
  })
})

http.listen(8080, () => console.log('listen on *:8080'))
