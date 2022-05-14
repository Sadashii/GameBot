const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");

const command = new SlashCommandBuilder()
  .setName("contribute")
  .setDescription("Contribute to the bot development")

module.exports = {
  type: "COMMAND",
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
    //  TODO: Send a messsage with information and buttons about github/discord/etc.
  },
};