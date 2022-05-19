const {SlashCommandBuilder} = require("@discordjs/builders");
const GameManager = require("./tictactoemanager");

const command = new SlashCommandBuilder()
  .setName("tictactoe")
  .setDescription("Play a game of tic tac toe")
  .addUserOption(player => player
    .setName("opponent")
    .setDescription("The person you want to play against")
    .setRequired(true));


module.exports = {
  type: "COMMAND",
  isGame: true,
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
    const opponent = interaction.options.getMember("opponent");
    
    if (opponent.id === interaction.user.id) {
      return await interaction.reply({
        content: "<:cross:973110683048755260> | You can't play against yourself!",
        ephemeral: true,
      });
    }
    if (opponent.bot) {
      return await interaction.reply({
        content: "<:cross:973110683048755260> | You can't play against a bot!",
        ephemeral: true,
      });
    }
    
    await interaction.deferReply()
    await GameManager.askForGame(interaction, opponent);
  },
};