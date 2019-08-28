
const QUESTIONS = require('../questions').Questions
const utils = require('../utils');

const initialState = {
  name: 'Do You Know Me? 🤔',
  gameStarted: false,
  gameStartCountDown: 3,
  playerIds: [],
  questions: QUESTIONS,
}

const states = {};

const generateRoomNumber = () => {
  if(Object.keys(states).length === 0) return '1';
  return (parseInt(
    Object.keys(states)
      .find((key, i, arr) => !arr.includes((parseInt(key, 36) + 1).toString(36).toUpperCase()))
  , 36) + 1).toString(36).toUpperCase()
}

const clearOfflinePlayers = (room) => {
  Object.keys(states[room]).map((key) => {
    if(states[room][key].hasOwnProperty('username') && !states[room].playerIds.includes(key)) {
      console.log("WILL DELETE:", key)
      return delete states[room][key];
    }
  })
  return states[room];
}

const updatePlayerId = (room, playerId, newPlayerId) => {
  states[room][newPlayerId] = states[room][playerId]
  delete states[room][playerId]
  return states[room]
}

const hasState = (room) => !!getState(room);

const createState = () => {
  const roomNumber = generateRoomNumber()
  return states[roomNumber] = {
    ...initialState,
    room: roomNumber,
  }
}

const addPlayerId = (room, playerId) => {
  return states[room].playerIds = [...new Set([...getPlayerIds(room), ...[playerId]])]
}

const getPlayerIds = (room) => states[room].playerIds;

const hasPlayers = (room) => states[room].playerIds.length > 0;

const getPlayer = (room, playerId) => states[room][playerId] || null; 

const getPlayers = (room) => getPlayerIds(room).map(id => getPlayer(room, id));

const addPlayer = (room, playerId) => {
  return states[room][playerId] = {
    emoji: utils.pickUniqueEmoiji(states[room]),
    color: utils.pickUniqueColor(states[room]),
    username: 'unknown',
    questions: [],
    ready: false,
    ...states[room][playerId] ? states[room][playerId] : {},
  };
}

const replacePlayer = (room, newPlayerId, oldPlayerId) => {
  console.log("ADDING: ", newPlayerId)
  return states[room][newPlayerId] = getPlayer(room, oldPlayerId);
}

const removePlayer = (room, playerId) => {
  console.log("REMOVING: ", playerId)
  delete states[room][playerId];
  states[room].playerIds = getPlayerIds(room).filter(id => id !== playerId)
  return states[room];
}

const setUsername = (room, playerId, username) => states[room][playerId].username = username;

const getQuestions = (room) => states[room].questions;

const getPlayerQuestions = (room, playerId) => states[room][playerId].questions;

const pickQuestions = (room, playerId) => {
  const availablePoints = [... new Set(gameState.getQuestions(room).map(q => q.points))]
  const questionPoints = [... new Set(gameState.getPlayerQuestions(room, playerId).map(q => q.points))]
  const unPickedPoints = availablePoints.filter((points) => !questionPoints.includes(points)).sort()
  return unPickedPoints.length > 0 
    ? gameState.getQuestions(room).filter(q => q.points === unPickedPoints[0])
    : [];
}

const getState = (room) => states[room]

const setReady = (room, playerId, bool) => states[room][playerId].ready = bool;

const allReady = (room) => getPlayerIds(room).length > 1 && getPlayers(room).every(player => player.ready);

const startGame = (room) => states[room].gameStarted = true;

const stopGame = (room) => states[room].gameStarted = false;

const setCountDown = (room, payload) => states[room].gameStartCountDown = payload;

const getCountDown = (room) => states[room].gameStartCountDown;

module.exports = {
  clearOfflinePlayers: clearOfflinePlayers,
  updatePlayerId: updatePlayerId,
  hasState: hasState,
  createState: createState,
  addPlayerId: addPlayerId,
  getPlayerIds: getPlayerIds,
  hasPlayers: hasPlayers,
  getPlayer: getPlayer,
  addPlayer: addPlayer,
  replacePlayer: replacePlayer,
  removePlayer: removePlayer,
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
}


