const assert = require('chai').assert
const expect = require('chai').expect
const gameState = require('../game-state/game-state')
const QUESTIONS = require('../questions').Questions
const utils = require('../utils');



describe('Game state', function() {
  
  describe('#create state', function() {
    it('should create a game state and store it with a room as key', function() {
      gameState.createState('room1');
      expect(gameState.getState('room1')).to.deep.equal(
        {
          name: 'Do You Know Me? 🤔',
          gameStarted: false,
          gameStartCountDown: 3,
          playerIds: [],
          questions: QUESTIONS,
          room: 'room1',
          turn: null,
        }
      );
    });
  });

  describe('#addPlayerId', function() {
    it('should add a player id to playerIds array', function() {
      gameState.createState('room1')
      gameState.addPlayerId('room1', 'pid1')
      gameState.addPlayerId('room1', 'pid2')
      expect(gameState.getPlayerIds('room1'))
        .to.be.an('array')
        .that.deep.equal(['pid1', 'pid2']);
    });
  });

  describe('#getRandomPlayerId', function() {
    it('should get a random players id', function() {
      gameState.createState('room1')
      gameState.addPlayerId('room1', 'pid1')
      gameState.addPlayerId('room1', 'pid2')
      gameState.addPlayerId('room1', 'pid3')
      expect(['pid1', 'pid2', 'pid3']).to.be.an('array').that.includes(gameState.getRandomPlayerId('room1'));
    });
  });
  
  describe('#updatePlayerId', function() {
    it('should update a players id', function() {
      gameState.createState('room1')
      gameState.addPlayerId('room1', 'pid1')
      gameState.addPlayer('room1', 'pid1')
      gameState.setUsername('room1', 'pid1', 'Jonas')
      gameState.updatePlayerId('room1', 'pid1', 'NEWpid1')
      expect(gameState.getPlayer('room1', 'NEWpid1')).to.deep.equal({
        emoji: gameState.getPlayer('room1', 'NEWpid1').emoji,
        color: gameState.getPlayer('room1', 'NEWpid1').color,
        username: 'Jonas',
        questions: [],
        ready: false,
      })
    });
  });

  describe('#addPlayer', function() {
    it('should add a player to the state', function() {
      gameState.createState('room1')
      gameState.addPlayer('room1', 'pid1')
      expect(gameState.getPlayer('room1', 'pid1')).to.deep.equal({
        emoji: gameState.getPlayer('room1', 'pid1').emoji,
        color: gameState.getPlayer('room1', 'pid1').color,
        username: 'unknown',
        questions: [],
        ready: false,
      })
    });
  });

  describe('#remove Player', function() {
    it('should remove a player to the state', function() {
      gameState.createState('room1')
      gameState.addPlayer('room1', 'pid1')
      gameState.addPlayerId('room1', 'pid1')
      gameState.removePlayer('room1', 'pid1')
      expect(gameState.getState('room1')).to.deep.equal({
        name: 'Do You Know Me? 🤔',
        gameStarted: false,
        gameStartCountDown: 3,
        playerIds: [],
        questions: QUESTIONS,
        room: 'room1',
        turn: null,
      })
    });
  });

  describe('#addQuestion', function() {
    it('should add a question to a player to the state', function() {
      gameState.createState('room1')
      gameState.addPlayer('room1', 'pid1')
      gameState.addQuestion('room1', 'pid1', QUESTIONS[0])
      expect(gameState.getPlayerQuestions('room1', 'pid1')[0]).to.deep.equal({
        question: "What is/was your mothers name?",
        tags: ["family", "parent"],
        points: 100,
        level: 'easy',
        answered: false,
        playerId: 'pid1',
      })
    });
  });

  describe('#setFocusOnQuestion', function() {
    it('should set focus on a players question', function() {
      gameState.createState('room1')
      gameState.addPlayerId('room1', 'pid1')
      gameState.addPlayer('room1', 'pid1')
      gameState.addQuestion('room1', 'pid1', QUESTIONS[0])
      gameState.setFocusOnQuestion('room1', gameState.getPlayerQuestions('room1', 'pid1')[0], 'pid2')
      expect(gameState.getPlayerQuestions('room1', 'pid1')[0]).to.deep.equal({
        question: "What is/was your mothers name?",
        tags: ["family", "parent"],
        points: 100,
        level: 'easy',
        answered: false,
        playerId: 'pid1',
        focus: true,
        focusFrom: 'pid2'
      })
    });
  });

});