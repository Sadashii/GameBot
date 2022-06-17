const _ = require("./utils");

const tips = [
  "Want a game added? Suggest it now with /featurerequest",
  "Like playing these games? Vote for me on top.gg with /vote",
  "Wanna play these games in your server? Add me now with /support",
]

class messages {
  GAME_PROMPT_ASK(player, game) {
    return `${player.toString()} invites you to play a game of ${game} with them! [Request expires ${_.timeStampFromNow(15)}]`
  }
  
  GAME_PROMPT_NO_REPLY(player) {
    return `Couldn't start the game, ${player.toString()} didn't respond to your request...`
  }
  
  GAME_PROMPT_DENIED(player) {
    return `Couldn't start the game, ${player.toString()} declined your request...`
  }
  
  
  
  RANDOM_BOT_TIP() {
    return tips[Math.floor(Math.random() * tips.length)]
  }
}


module.exports = new messages();