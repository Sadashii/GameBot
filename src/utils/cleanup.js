const {config} = require('../config');
const {MessageEmbed} = require("discord.js");

const cleanup = async (client, logger) => {
  if (process.env.NODE_ENV === "DEVELOPMENT") {
    return;
  }

  let cleanup_stats_channel = await client.channels.fetch(config.SESSION_STATISTICS_CHANNEL)

  const createStatsMessage = (type) => {
    return client[type]
      .filter(x => x.uses > 0)
      .map((x, name) => `${name} - ${x.uses}`)
      .join('\n') || `No ${type} used yet.`
  }

  const embed = new MessageEmbed()
    .setTitle("Cleanup Stats")
    .setColor(0x00AE86)
    .setDescription(`**Started at:** <t:${(new Date(client.readyAt).getTime() / 1000).toFixed(0)}>`)
    .addField("Command Usage Stats", createStatsMessage('commands'))
    .addField("Button Usage Stats", createStatsMessage('buttons'))

  await cleanup_stats_channel.send({
    embeds: [embed]
  })

  process.exit(0)
}

module.exports = cleanup