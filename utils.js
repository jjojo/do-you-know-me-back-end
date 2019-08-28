const EMOJIS = ['🐹', '🐶', '🐱', '🦊', '🐻', '🐯', '🦁', '🐸', '🐵', '🐥'];
const COLORS = ['#f368e0', '#ff9f43', '#ee5253', '#ee5253', '#10ac84', '#5f27cd', '#795548', '#8BC34A'];


const getItemsNotInRoom = (state, itemType) => {
  return state.playerIds
      .map((playerId) => (state[playerId] || {})[itemType])
      .filter((item) => typeof item !== 'undefined');
}

const pickUniqueEmoiji = (state) => {
  const filteredEmojis = EMOJIS.filter((emoji) => !getItemsNotInRoom(state, 'emoji').includes(emoji))
  return filteredEmojis[Math.floor(Math.random() * filteredEmojis.length)];
}

const pickUniqueColor = (state) => {
  const filteredColors = COLORS.filter((color) => !getItemsNotInRoom(state, 'color').includes(color))
  return filteredColors[Math.floor(Math.random() * filteredColors.length)];
}

const setIntervalX = (fn, Xms, times) => {
  if(!times) return
  setTimeout(() => {
    fn() 
    setIntervalX(fn, Xms, times-1)
  }, Xms)
}

// left to right function composition [like clojur's ->>]
const comp = (...fns) => ((params) => fns.reduce((acc, f) => f(acc), params))()

module.exports = {
  pickUniqueEmoiji: pickUniqueEmoiji,
  pickUniqueColor: pickUniqueColor,
  setIntervalX: setIntervalX,
  comp: comp,
}