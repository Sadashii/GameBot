const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");

const command = new SlashCommandBuilder()
  .setName("feature")
  .setDescription("Request a feature or a game for the bot")
  .addStringOption(feature => feature
    .setName("feature")
    .setDescription("The feature you want to request")
    .setRequired(true))


module.exports = {
  type: "COMMAND",
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
  //  TODO: Get the feature requests channel
  //  TODO: Send an embed to the channel
  //  TODO: Add emoji reactions to the message
  },
};