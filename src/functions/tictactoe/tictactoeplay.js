const GameManager = require("./gamemanager");

module.exports = {
  name: "tictactoe",
  type: "BUTTON",
  enabled: true,
  async execute (client, interaction, logger) {
    await GameManager.playerMove(interaction)
  },
};