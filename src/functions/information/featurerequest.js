const {SlashCommandBuilder, ButtonBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");
const {config} = require("../../config")
const {encodeToID} = require("../../utils/encryption");

const command = new SlashCommandBuilder()
  .setName("featurerequest")
  .setDescription("Request a feature (or game) to be added to be added to the bot")
  .addStringOption(feature => feature
    .setName("feature")
    .setRequired(true)
    .setDescription("The feature (or game) you want to request")
  )


module.exports = {
  type: "COMMAND",
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
    let feature_requests_channel = await client.channels.fetch(config.FEATURE_REQUESTS_CHANNEL)
    if (!feature_requests_channel) {
      return interaction.reply("[ERROR] Feature requests channel not found/configured")
    }

    const embed = new MessageEmbed()
      .setColor(COLORS.INFO)
      .setTitle("Feature Request")
      .setDescription(interaction.options.getString("feature"))
      .setFooter(`Requested by ${encodeToID(interaction.user.id)}`)

    const message = await feature_requests_channel.send({
      embeds: [embed]
    })
    await message.react("✅")
    await message.react("❌")

    const channelEmbed = new MessageEmbed()
      .setColor(COLORS.SUCCESS)
      .setTitle("Feature request sent")
      .setDescription(`Your feature request has been sent to the bot owner.`)
      .addField("Feature", interaction.options.getString("feature"))

    const components = new MessageActionRow()
      .addComponents([
        new MessageButton()
          .setURL(config.DISCORD_INVITE)
          .setLabel("Discord Server")
          .setStyle("LINK"),
        new MessageButton()
          .setURL(message.url)
          .setLabel("View Request")
          .setStyle("LINK")
      ])

    await interaction.reply({
      embeds: [channelEmbed],
      components: [components]
    })

  },
};