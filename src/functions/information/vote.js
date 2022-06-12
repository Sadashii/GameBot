const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");

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
      .setDescription("You can vote for me on top.gg from the link below - Thanks 🙂\n\nPS: Help out more with a 5-star positive review!")

    const components = new MessageActionRow()
      .addComponents([
        new MessageButton()
          .setURL(`https://top.gg/bot/${client.user.id}/vote`)
          .setLabel("Vote on top.gg")
          .setStyle("LINK"),
      ])

    await interaction.reply({
      embeds: [embed],
      components: [components]
    })

  },
};