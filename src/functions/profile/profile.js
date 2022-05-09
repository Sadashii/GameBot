const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");

const mongoose = require("mongoose");
const {COLORS} = require("../../utils/data");
const {log} = require("winston");
const User = mongoose.model("User");

const command = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("View a user's GameBot profile.")
  .addSubcommand(subcommand => subcommand
    .setName("tictactoe")
    .setDescription("View a user's TicTacToe profile.")
    .addUserOption(user => user
      .setName("user")
      .setDescription("The user to view the profile of. Choose none to view your own profile.")),
  );


module.exports = {
  type: "COMMAND",
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
    let user = interaction.options.getUser("user") || interaction.user;
    
    switch (interaction.options.getSubcommand()) {
      case "tictactoe":
        let userStats = (await User.findById(user.id))?.tictactoe;
        if (!userStats) {
          return await interaction.reply({
            content: `${user.username} has not played TicTacToe yet.`,
            ephemeral: true,
          });
        }
        
        let most_played_against = Object.entries(userStats.against).sort((a, b) => b[1].games - a[1].games).slice(0, 3);
        let most_played = [];
        for (let [id, stats] of most_played_against) {
          stats.user = (await interaction.guild.members.fetch(id)).toString() || id;
          stats.games !== 0 && most_played.push(`${stats.user} (${stats.games} games)`);
        }
        
        let most_won_against = Object.entries(userStats.against).sort((a, b) => b[1].wins - a[1].wins).slice(0, 3);
        let most_won = [];
        for (let [id, stats] of most_won_against) {
          stats.user = (await interaction.guild.members.fetch(id)).toString() || id;
          stats.wins !== 0 && most_won.push(`${stats.user} (${stats.wins} wins)`);
        }
        
        let most_lost_against = Object.entries(userStats.against).sort((a, b) => a[1].losses - b[1].losses).slice(0, 3);
        let most_lost = [];
        for (let [id, stats] of most_lost_against) {
          stats.user = (await interaction.guild.members.fetch(id)).toString() || id;
          stats.losses !== 0 && most_lost.push(`${stats.user} (${stats.losses} losses)`);
        }
        
        let highest_winstreak_against = Object.entries(userStats.against).sort((a, b) => b[1].winstreak - a[1].winstreak).slice(0, 3);
        let highest_winstreak = [];
        for (let [id, stats] of highest_winstreak_against) {
          stats.user = (await interaction.guild.members.fetch(id)).toString() || id;
          stats.winstreak !== 0 && highest_winstreak.push(`${stats.user} (${stats.winstreak} winstreak)`);
        }
        
        
        let embed = new MessageEmbed()
          .setTitle(`${user.username}'s TicTacToe Profile`)
          .setThumbnail(user.avatarURL())
          .setDescription(`
**Games played:** ${userStats.games}
**Wins:** ${userStats.wins} (${Math.round(userStats.wins / userStats.games * 100)}%)
**Losses:** ${userStats.losses} (${Math.round(userStats.losses / userStats.games * 100)}%)
**Draws:** ${userStats.ties} (${Math.round(userStats.ties / userStats.games * 100)}%)
**Win streak:** ${userStats.winstreak}
          `)
          .addField("Most played against", most_played.join("\n") || "-", true)
          .addField("Most won against", most_won.join("\n") || "-", true)
          .addField("Most lost against", most_lost.join("\n") || "-", true)
          .addField("Highest win streak against (currently)", highest_winstreak.join("\n") || "-", true)
          .setColor(COLORS.SUCCESS);
        
        await interaction.reply({
          embeds: [embed],
        });
    }
  },
};