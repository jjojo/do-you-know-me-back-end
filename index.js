const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const utils = require("./utils");
const QUESTIONS = require('./questions').Questions


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

let activeRooms = [];
let activeGameStates = {};


const createGameState = () => {
  console.log('CREATED A GAME')
  activeRooms.push((activeRooms.length).toString())
  return {
    name: 'Test Game',
    room: (activeRooms.length).toString(),
    gameStarted: false,
    players: [],
    questions: QUESTIONS,
  }
}

const createPlayerObject = (room, playerId) => {
  activeGameStates[room][playerId] = activeGameStates[room][playerId] 
    ? activeGameStates[room][playerId] 
    : {
        emoji: utils.pickUniqueEmoiji(activeGameStates[room]),
        color: utils.pickUniqueColor(activeGameStates[room]),
        username: 'unknown',
        questions: [],
      }
}

const getPlayerObject = (room, playerId) => activeGameStates[room][playerId];

const addToPlayerList = (room, playerId) => {
  const state = activeGameStates[room]
  activeGameStates[room] = {
    ...state,
    players: [...new Set([
        ...activeGameStates[room].players,
        ...[playerId],
    ])],
  }
  return activeGameStates[room];
}

const removePlayer = (room, playerId) => {
  const state = activeGameStates[room];
  !activeGameStates[room].players.includes(playerId) && delete activeGameStates[room][playerId];
  return activeGameStates[room] = {
    ...state,
    players: state.players
      .filter((player) => player !== playerId),
  }
}

const setUsername = (room, username, playerId) => {
  activeGameStates[room][playerId] = {
    ...activeGameStates[room][playerId],
    username: username,
  }
  return activeGameStates[room]
}

const setReady = (room, playerId, bool) => activeGameStates[room][playerId].ready = bool

const clearOfflinePlayers = (room) => {
  Object.keys(activeGameStates[room]).map((key) => {
    console.log("item: ", activeGameStates[room][key])
    console.log("key: ", key)
    if(activeGameStates[room][key].hasOwnProperty('username') && !activeGameStates[room].players.includes(key)) {
      console.log("WILL DELETE:", key)
      delete activeGameStates[room][key];
    }
  })
  return activeGameStates[room];
}

const updatePlayerId = (room, playerId, newPlayerId) => {
  activeGameStates[room].players.map((player) => player === playerId ? newPlayerId : player)
  activeGameStates[room][newPlayerId] = activeGameStates[room][playerId]
  delete activeGameStates[room][playerId]
  return activeGameStates[room]
}

const pickQuestions = (room, playerId) => {
  console.log("I PICK ", getPlayerObject(room, playerId))
  const availablePoints = [... new Set(activeGameStates[room].questions.map(q => q.points))]
  const questionPoints = [... new Set(getPlayerObject(room, playerId).questions.map(q => q.points))]
  const unPickedPoints = availablePoints.filter((points) => !questionPoints.includes(points)).sort()
  console.log(unPickedPoints)
  return unPickedPoints.length > 0 
    ? activeGameStates[room].questions.filter(q => q.points === unPickedPoints[0])
    : [];
}

const addQuestion = (room, playerId, question) => getPlayerObject(room, playerId).questions.push(question);

const getPlayers = (room) => activeGameStates[room].players.map(playerId => activeGameStates[room][playerId]);

const checkIfAllReady = (room) => getPlayers(room).every(player => player.ready) && activeGameStates[room].players.length > 1;



const startGame = (room) => {
  activeGameStates[room].gameStarted = true;
  io.in(room).emit('GameStarted', activeGameStates[room])
  utils.setIntervalX(() => {
    activeGameStates[room].gameStartCountDown = activeGameStates[room].hasOwnProperty('gameStartCountDown')
      ? activeGameStates[room].gameStartCountDown - 1
      : 3
    broadcastGameUpdate(room)
  }, 1000, 4)
}

const broadcastGameUpdate = (room) => {
  io.in(room).emit('gameUpdate', activeGameStates[room])
}

io.on('connection', (socket) => {
  console.log('a user connected 👤');

  socket.on('createGame', (room) => {
    console.log('rroooom:', room)
    if(activeGameStates[room]) {
      socket.join(room)
      socket.emit('gameUpdate', activeGameStates[room])
    } else {
      const state = createGameState()
      activeGameStates[state.room] = state;
      socket.join(state.room)
      socket.emit('gameCreated', activeGameStates[state.room])
    }
  })

  socket.on('join', (room, playerId) => {
      socket.join(room, () => {
        try{
          const state = addToPlayerList(room, socket.id)
          if (playerId && playerId !== socket.id) updatePlayerId(room, playerId, socket.id)
          createPlayerObject(room, socket.id)
          activeGameStates[room].players.length > 0 && clearOfflinePlayers(room)          
          console.log('state:',state )
          socket.emit('joinedGame', state, socket.id)
          socket.emit('pickQuestions', pickQuestions(room, socket.id))
          if(state.players.includes(socket.id)) io.in(room).emit('gameUpdate', state)
        } catch (error) {
          console.log(error)
          socket.emit('rejection', 'room does not exist! 🤷‍♂️')
        }
      });
  });

  socket.on('setUsername', (room, playerId, username) => {
    console.log('SET USERNAME for : ', playerId, username)
    setUsername(room, username, playerId)
    if(activeGameStates[room].players.includes(socket.id)) io.in(room).emit('gameUpdate', activeGameStates[room])
  })

  socket.on('acceptedQuestion', (question) => {
    console.log("question accepted from:", socket.id , question, socket.rooms)
    const room = Object.keys(socket.rooms)[0];
    addQuestion(room, socket.id, question);
    const questionsLeftToAnswer = pickQuestions(room, socket.id)
    socket.emit('pickQuestions', questionsLeftToAnswer)
    if (questionsLeftToAnswer.length === 0) {
      setReady(room, socket.id, true)
      if(checkIfAllReady(room)) {
        startGame(room)
      } else {
        activeGameStates[room].gameStarted = false;
      }
    }
    broadcastGameUpdate(room);
  })

  socket.on('disconnecting', () => {
    Object.keys(io.sockets.adapter.rooms).forEach((room) => {
      if(activeGameStates[room]) {
        removePlayer(room, socket.id)
        if(activeGameStates[room].players.includes(socket.id)) socket.to(room).emit('gameUpdate', activeGameStates[room])
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