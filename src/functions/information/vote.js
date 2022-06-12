const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");
const {config} = require("../../config");

const command = new SlashCommandBuilder()
  .setName("vote")
  .setDescription("Help me grow by up-voting me on top.gg")


module.exports = {
  type: "COMMAND",
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
    const embed = new MessageEmbed()
      .setColor(COLORS.SUCCESS)
      .setDescription("Support by voting for me (and leaving a 5-star review) on top.gg - Thanks 🙂")

    const components = new MessageActionRow()
      .addComponents([
        new MessageButton()
          .setURL(`https://top.gg/bot/${client.user.id}/vote`)
          .setLabel("Vote on top.gg")
          .setStyle("LINK"),
        new MessageButton()
          .setURL(config.INVITE_URL)
          .setLabel("Add to your server")
          .setStyle("LINK"),
      ])

    await interaction.reply({
      embeds: [embed],
      components: [components]
    })

  },
};