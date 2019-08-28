const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const gameState = require('./game-state/game-state')

const utils = require("./utils");

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

const addQuestion = (room, playerId, question) => gameState.getPlayer(room, playerId).questions.push(question);

const broadcastGameUpdate = (room) => io.in(room).emit('gameUpdate', gameState.getState(room))

const joinRoom = (socket, room, emit, errorMsg) => {
  socket.join(room, () => {
    try{
      console.log("JOINED")
      emit
    } catch (error) {
      console.log("ERRPR", error)
      socket.emit('error', errorMsg)
    }
  });
}


io.on('connection', (socket) => {
  console.log('a user connected 👤');
  
  
  socket.on('createGame', (room) => {
    if(gameState.hasState(room)) {
      joinRoom(
        socket, 
        room, 
        socket.emit('gameUpdate', gameState.getState(room)),
        'could not rejoin room 😭'
      );
    } else {
      const gameRoom = gameState.createState().room
      joinRoom(
        socket, 
        gameRoom, 
        socket.emit('gameCreated', gameState.getState(gameRoom)),
        'could not create game 😭'
      );
      console.log("GAME CREATED")
    }
  })


  socket.on('join', (room, playerId) => {
      
    socket.join(room, () => {
      try {
        if(!gameState.hasState(room)) throw new Error('No game active for this room')
        gameState.addPlayerId(room, socket.id)
        if (playerId && playerId !== socket.id) {
          gameState.replacePlayer(room, socket.id, playerId)
          gameState.removePlayer(room, playerId)
        }
        gameState.addPlayer(room, socket.id)
        if(gameState.hasPlayers(room)) gameState.clearOfflinePlayers(room)          
        socket.emit('joinedGame', gameState.getState(room), socket.id)
        socket.emit('pickQuestions', gameState.pickQuestions(room, socket.id))
        if(gameState.getPlayerIds(room).includes(socket.id)) io.in(room).emit('gameUpdate', gameState.getState(room))
      } catch (error) {
        console.log(error)
        socket.emit('rejection', 'Couldn\'t join! 🤷‍♂️', error.message)
      }
    });
  });

  socket.on('setUsername', (room, playerId, username) => {
    gameState.setUsername(room, playerId, username)
    broadcastGameUpdate(room)
  })

  socket.on('acceptedQuestion', (question) => {
    const room = Object.keys(socket.rooms)[0];
    addQuestion(room, socket.id, question);
    const questionsLeftToAnswer = gameState.pickQuestions(room, socket.id)
    socket.emit('pickQuestions', questionsLeftToAnswer)
    if (questionsLeftToAnswer.length === 0) {
      gameState.setReady(room, socket.id, true)
      console.log("ALL READY ? ",gameState.allReady(room))
      if(gameState.allReady(room)) {
        console.log("SHOULD START GAME")
        gameState.startGame(room)
        io.in(room).emit('gameStarted', gameState.getState(room))
        utils.setIntervalX(() => {
          if(gameState.getCountDown(room) >= 0) {
            gameState.setCountDown(room, gameState.getCountDown(room) - 1)
            broadcastGameUpdate(room)
          }
        }, 1000, 4)
      } else {
        gameState.stopGame(room)
        gameState.setCountDown(room, 3)
        io.in(room).emit('gameStarted', gameState.getState(room))
      }
    }
    broadcastGameUpdate(room);
  })

  socket.on('disconnecting', () => {
    Object.keys(io.sockets.adapter.rooms).forEach((room) => {
      if(gameState.hasState(room)) {
        gameState.removePlayer(room, socket.id)
        broadcastGameUpdate(room)
      }
    })
  });

  socket.on('disconnect', () => {
    console.log('User disconnected 🚫')
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});