const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const {COLORS} = require("../../utils/data");
const {words, animations} = require("./data");
const {encodeToID} = require("../../utils/encryption");

const command = new SlashCommandBuilder()
  .setName("hangman")
  .setDescription("Play a game of hangman!");

const alphabets = [
  ["A", "B", "C", "D", "E"],
  ["F", "G", "H", "I", "J"],
  ["K", "L", "M", "N", "O"],
  ["P", "Q", "R", "S", "T"],
  ["U", "V", "W", "X", "Y"],
];

module.exports = {
  type: "COMMAND",
  isGame: true,
  data: command,
  enabled: true,
  async execute (client, interaction, logger) {
    let word = words[Math.floor(Math.random() * words.length)];
    let wordHash = word
      .split("")
      .map(letter => letter === " " ? " " : "_ ")
      .join(" \\");

    const embed = new MessageEmbed()
      .setTitle("Hangman")
      .setColor(COLORS.INFO)
      .addField("Game Information", `Word length: ${word.length}\nLives left: 8\nCharacters guessed: \n\nWord: ${wordHash}`, true)
      .addField("Avatar", `\`\`\`${animations[0].join("\n")}\`\`\``, true)
      .setFooter(`Game ID: ${encodeToID(word)}`);

    const components = [];
    for (const alphabetRow of alphabets) {
      let row = new MessageActionRow();
      for (const alphabet of alphabetRow) {
        row.addComponents(
          new MessageButton()
            .setCustomId(`hangman-${alphabet}`)
            .setLabel(alphabet)
            .setStyle("SECONDARY"),
        );
      }
      components.push(row);
    }

    await interaction.reply({
      embeds: [embed],
      components,
    });

  },
};