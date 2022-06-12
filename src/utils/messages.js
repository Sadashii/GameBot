const _ = require("./utils");

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
}


module.exports = new messages();