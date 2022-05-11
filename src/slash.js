const {REST} = require("@discordjs/rest");
const {Routes} = require("discord-api-types/v9");
const fs = require("fs");
const logger = require("./utils/logger");
const Permissions = require("discord.js").Permissions;

const commands = [];
const commandGroups = fs.readdirSync("./src/functions");
for (const group of commandGroups) {
  const commandFiles = fs.readdirSync(`./src/functions/${group}`).filter(file => file.endsWith(".js"));
  for (const commandFile of commandFiles) {
    const command = require(`./functions/${group}/${commandFile}`);
    if (command.type === "COMMAND" && command.enabled) {
      let json = command.data.toJSON();
      let default_member_permissions = (Array.isArray(command.permissions) && command.permissions.length > 0) ? new Permissions(command.permissions).bitfield.toString() : null;
      json = {
        ...json,
        default_member_permissions,
      };
      commands.push(json);
    }
  }
}

const rest = new REST({version: "10"}).setToken(process.env.DISCORD_BOT_TOKEN);

if (process.env.NODE_ENV === "DEVELOPMENT") {
  rest
    .put(Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, process.env.DEVELOPMENT_SERVER_ID), {body: commands})
    .then(res => logger.info(`Updated commands for ${process.env.DEVELOPMENT_SERVER_ID}`))
    .catch(err => logger.error(err));
} else {
  rest
    .put(Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID), {body: commands})
    .then(res => logger.info(`Registered ${res.body.length} global commands`))
    .catch(err => logger.error(err));
}