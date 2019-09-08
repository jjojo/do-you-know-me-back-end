
const QUESTIONS = require('../questions').Questions
const utils = require('../utils');

const initialState = {
  name: 'Do You Know Me? 🤔',
  gameStarted: false,
  gameStartCountDown: 3,
  playerIds: [],
  questions: QUESTIONS,
  turn: null,
}

const states = {};

/* 
  Discusting inpure functions with state "outside" dependencies:
*/
const updateState = (state) => states[state.room] = state;

const getState = (room) => states[room]

const generateRoomNumber = () => {
  if(Object.keys(states).length === 0) return '1';
  return (parseInt(
    Object.keys(states)
      .find((key, i, arr) => !arr.includes((parseInt(key, 36) + 1).toString(36).toUpperCase()))
  , 36) + 1).toString(36).toUpperCase()
}

/* 
  Pure beutiful functions:
*/

const getRandomPlayerId = (room) => getPlayerIds(room)[Math.floor(getPlayerIds(room).length * Math.random())]


// needs fixing inpure!
const clearOfflinePlayers = (room) => {
  Object.keys(getState(room)).map((key) => {
    if(getState(room)[key].hasOwnProperty('username') && !getPlayerIds(room).includes(key)) {
      console.log("WILL DELETE:", key)
      return delete states[room][key];
    }
  })
  return states[room];
}

const updatePlayerId = (room, playerId, newPlayerId) => {
  updateState({
    ...getState(room),
    [newPlayerId]: getPlayer(room, playerId),
    turn: playerId === getTurn(room) ? newPlayerId : getTurn(room),
  })
  try {
    if(getState(room).activeQuestion.question.playerId === playerId) {
      updateActiveQuestion(room, { question: {
        ...getState(room).activeQuestion.question,
        playerId: newPlayerId,
      }})
    }
    getAllPlayerQuestions(room).map(q => q.focusFrom === playerId && updateQuestion(room, q.playerId, q, { focusFrom: newPlayerId }))
    updatePlayer(room, playerId, {
      questions: getPlayerQuestions(playerId).map(q => {
        q.playerId = newPlayerId
        return q;
      })
    })
  } catch (error) {
    console.log(error)
  }
  return removePlayer(room, playerId)
}

const hasState = (room) => !!getState(room);

const createState = (roomNumber = null) => updateState({
    ...initialState,
    room: roomNumber || generateRoomNumber(),
  })

const addPlayerId = (room, playerId) => updateState({
    ...getState(room),
    playerIds: [...new Set([...getPlayerIds(room), ...[playerId]])],
  });

const getPlayerIds = (room) => getState(room).playerIds;

const hasPlayers = (room) => states[room].playerIds.length > 0;

const getPlayer = (room, playerId) => getState(room)[playerId] || null; 

const getPlayers = (room) => getPlayerIds(room).map(id => getPlayer(room, id));

const addPlayer = (room, playerId) => updateState({
    ...getState(room),
    [playerId]: {
      emoji: utils.pickUniqueEmoiji(getState(room)),
      color: utils.pickUniqueColor(getState(room)),
      username: 'unknown',
      questions: [],
      ready: false,
      ...getPlayer(room, playerId) || {},
    }
  });

const updatePlayer = (room, playerId, data) => updateState({
    ...getState(room),
    [playerId]: {
      ...getPlayer(room, playerId),
      ...data,
    }
  });

const removeFromPlayerIds = (room, playerId) => updateState({
  ...getState(room),
  playerIds: getPlayerIds(room).filter(id => id !== playerId)
})

const removePlayer = (room, playerId) => {
  console.log("REMOVING: ", playerId)
  const state = getState(room)
  delete state[playerId];
  return updateState({
    ...state,
    playerIds: getPlayerIds(room).filter(id => id !== playerId)
  })
}

const addQuestion = (room, playerId, question) => {
  return updateState({
    ...getState(room),
    [playerId]: {
      ...getPlayer(room, playerId),
      questions: getPlayer(room, playerId).questions.concat([{
        ...question, 
        answered: false,
        playerId: playerId,
      }]),
    },
  });
}

const updateQuestion = (room, playerId, question, data) => {
  return updateState({
    ...getState(room),
    [playerId]: {
      ...getPlayer(room, playerId),
      questions: getPlayerQuestions(room, playerId).map( q => q.question === question.question ? {
        ...question, 
        ...data
      } : q),
    },
  });
}

const setUsername = (room, playerId, username) => updateState({
  ...getState(room),
  [playerId]: {
    ...getPlayer(room, playerId),
    username: username
  }
})

const getQuestions = (room) => states[room].questions;

const getPlayerQuestions = (room, playerId) => getPlayer(room, playerId).questions;

const getAllPlayerQuestions = (room) => [].concat.apply([], getPlayerIds(room).map(id => getPlayerQuestions(room, id)))

const pickQuestions = (room, playerId) => {
  const availablePoints = [... new Set(getQuestions(room).map(q => q.points))]
  const questionPoints = [... new Set(getPlayerQuestions(room, playerId).map(q => q.points))]
  const unPickedPoints = availablePoints.filter((points) => !questionPoints.includes(points)).sort()
  return unPickedPoints.length > 0 
    ? getQuestions(room).filter(q => q.points === unPickedPoints[0])
    : [];
}


const setReady = (room, playerId, bool) => states[room][playerId].ready = bool;

const allReady = (room) => getPlayerIds(room).length > 1 && getPlayers(room).every(player => player.ready);

const startGame = (room) => updateState({
  ...getState(room),
  gameStarted: true
})

const stopGame = (room) => states[room].gameStarted = false;

const setCountDown = (room, payload) => states[room].gameStartCountDown = payload;

const getCountDown = (room) => states[room].gameStartCountDown;

const setTurn = (room, playerId) => updateState({
    ...getState(room),
    turn: playerId
  })

const getTurn = (room) => getState(room).turn;

const clearQuestionFocuses = (room) => {
  console.log(getAllPlayerQuestions(room))
  getAllPlayerQuestions(room).map(q => {
    if (q.focus && q.focusFrom) {
      updateQuestion(room, q.playerId, q, { focus: false, focusFrom: null })
    }
  })
}

const setFocusOnQuestion = (room, question, playerId) => {
  clearQuestionFocuses(room)
  updateQuestion(room, question.playerId, question, { focus: true, focusFrom: playerId })
}

const setActiveQuestion = (room, question) => updateState({
    ...getState(room),
    activeQuestion: {
      question: question,
      answers: [],
    }
  })

const updateActiveQuestion = (room, data) => updateState({
    ...getState(room),
    activeQuestion: {
      ...getState(room).activeQuestion,
      ...data,
    }
  })

const answerActiveQuestion = (room, answer, playerId) => {
  updateActiveQuestion(room, {answers: [
    ...getState(room).activeQuestion.answers.concat([{
      answer: answer,
      playerId: playerId,
    }])
  ]})
}

const correctActiveQuestionAnswer = (room, answer, bool) => updateActiveQuestion(room, { 
    answers: gameState.getState(room).activeQuestion.answers.map(ans => {
      if(ans.playerId === answer.playerId) ans.correct = bool
      return ans;
    })
  })

module.exports = {
  getRandomPlayerId: getRandomPlayerId,
  clearOfflinePlayers: clearOfflinePlayers,
  hasState: hasState,
  createState: createState,
  addPlayerId: addPlayerId,
  getPlayerIds: getPlayerIds,
  hasPlayers: hasPlayers,
  getPlayer: getPlayer,
  addPlayer: addPlayer,
  updatePlayerId: updatePlayerId,
  removeFromPlayerIds: removeFromPlayerIds,
  removePlayer: removePlayer,
  addQuestion: addQuestion,
  setUsername: setUsername,
  getQuestions: getQuestions,
  getPlayerQuestions: getPlayerQuestions,
  pickQuestions: pickQuestions,
  getState: getState,
  setReady: setReady,
  allReady: allReady,
  startGame: startGame,
  stopGame: stopGame,
  setCountDown: setCountDown,
  getCountDown: getCountDown,
  setTurn: setTurn,
  setFocusOnQuestion: setFocusOnQuestion,
  setActiveQuestion: setActiveQuestion,
  updateActiveQuestion: updateActiveQuestion,
  answerActiveQuestion: answerActiveQuestion,
  correctActiveQuestionAnswer: correctActiveQuestionAnswer,
}


