const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");
const {config} = require("../../config")

const command = new SlashCommandBuilder()
  .setName("support")
  .setDescription("Support the bot by various means.")


module.exports = {
  type: "COMMAND",
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
    const embed = new MessageEmbed()
      .setColor(COLORS.INFO)
      .setTitle("Support GameBot")
      .setThumbnail(client.user.avatarURL())
      .setDescription("Although GameBot is free, it is still a work in progress which requires time and money to keep it online. You can support the development of GameBot by various means.")

    const components = [
      new MessageActionRow()
        .addComponents([
          new MessageButton()
            .setURL(config.INVITE_URL)
            .setLabel("Add to your server")
            .setStyle("LINK"),
          new MessageButton()
            .setURL(`https://top.gg/bot/${client.user.id}/vote`)
            .setLabel("Vote on top.gg")
            .setStyle("LINK"),
          new MessageButton()
            .setURL(config.DISCORD_INVITE)
            .setLabel("Join the Discord server!")
            .setStyle("LINK")
        ]),
        new MessageActionRow()
          .addComponents([
            new MessageButton()
              .setURL("https://buymeacoffee.com/Sadashii")
              .setLabel("Buy me a coffee!")
              .setStyle("LINK"),
            new MessageButton()
              .setURL(config.GITHUB_URL)
              .setLabel("Contribute to code!")
              .setStyle("LINK")
          ])
        ]

    await interaction.reply({
      embeds: [embed],
      components: components
    });
  },
};