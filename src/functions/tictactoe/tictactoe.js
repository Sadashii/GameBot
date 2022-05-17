const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");
const {ICONS} = require("./data");

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
    const opponent = interaction.options.getUser("opponent");
    
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
    
    
    await interaction.deferReply();
    
    const embed = new MessageEmbed()
      .setTitle("TicTacToe")
      .setDescription(`${interaction.user.toString()} vs ${opponent.toString()}\n\nMove: ${interaction.user.toString()}\nTurns: 0`)
      .setColor(COLORS.INFO);
    
    const components = [];
    for (let rowCount = 0; rowCount < 3; rowCount++) {
      let row = new MessageActionRow();
      for (let colCount = 0; colCount < 3; colCount++) {
        row.addComponents(
          new MessageButton()
            .setCustomId(`tictactoe-${rowCount}-${colCount}`)
            .setEmoji(ICONS.NONE)
            .setStyle("SECONDARY"),
        );
      }
      components.push(row);
    }
    
    
    await interaction.editReply({
      content: `${interaction.user.toString()} vs ${opponent.toString()}`,
      embeds: [embed],
      components,
    });
    
  },
};