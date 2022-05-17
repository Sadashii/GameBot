const {Client, Intents, Collection} = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();

const logger = require("./utils/logger");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
  allowedMentions: { parse: ["users", "roles", "everyone"] }
});
client.games = new Collection();
client.games.tictactoe = new Collection();

// Load db models
fs.readdirSync("./src/models").filter(file => file.endsWith(".js")).forEach(file => {
  require(`./models/${file}`);
});
logger.info("Successfully loaded DB models!");

// Loader
client.games = 0;
client.buttons = new Collection();
client.commands = new Collection();
const categories = fs.readdirSync("./src/functions");
for (const group of categories) {
  const categoryFiles = fs.readdirSync(`./src/functions/${group}`).filter(file => file.endsWith(".js"));
  for (const file of categoryFiles) {
    const command = require(`./functions/${group}/${file}`);
    if (!command.enabled) {
      continue;
    }
    switch (command.type) {
      case "COMMAND":
        client.commands.set(command.data.name, command);
        if (command.isGame) {
          client.games++;
        }
        break;
      case "BUTTON":
        client.buttons.set(command.name, command.execute);
    }
    
  }
}
require("./slash");


client.once("ready", async () => {
  let userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
  client.user.setActivity({
    name: `${client.games} games in ${client.guilds.cache.size} servers with ${userCount} users!`,
    type: "PLAYING",
  });
  
  logger.info(`Logged in as ${client.user.tag} | Ping: ${client.ws.ping}ms`);
});

client.on("interactionCreate", async interaction => {
  if (interaction.isButton()) {
    const button = interaction.customId.split("-")[0];
    const buttonFunc = client.buttons.get(button);
    if (buttonFunc) {
      return await buttonFunc(client, interaction, logger);
    }
  }
  
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) {
      try {
        return await command.execute(client, interaction, logger);
      } catch (error) {
        logger.error(error);
        return await interaction.reply({content: "There was an error while executing this command!", ephemeral: true});
      }
    }
  }
});

new Promise((resolve, reject) => {
  mongoose.connection
    .on("error", (err) => {
      logger.error(err);
      reject(err);
    })
    .once("open", () => {
      logger.info("Loaded database!");
      
      client.login(process.env.DISCORD_BOT_TOKEN).then();
    });
  mongoose.connect(process.env.DBURL, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }, (err) => {
    if (err) {
      logger.error(err);
      reject(err);
    }
  });
});