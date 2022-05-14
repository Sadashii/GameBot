const mongoose = require("mongoose");
const {decodeFromID, animations} = require("./data");
const {MessageEmbed} = require("discord.js");
const User = mongoose.model("User");

module.exports = {
  name: "hangman",
  type: "BUTTON",
  enabled: true,
  async execute (client, interaction, logger) {
    const game = interaction.message;
    
    if (interaction.user.id !== game.interaction.user.id) {
      return interaction.message.channel.send({
        content: "You can't play hangman with someone else!",
        ephemeral: true,
      });
    }
    
    const embed = game.embeds[0];
    const dataField = embed.fields[0].value.split("\n");
    let livesLeft = dataField[1].split(": ")[1];
    let charactersGuessed = dataField[2].split(": ")[1];
    const word = decodeFromID(embed.footer.text.split(": ")[1]);
    
    const characterGuessed = interaction.customId.split("-")[1].toLowerCase();
    const isCharacterValid = word.includes(characterGuessed);
    
    if (isCharacterValid) {
      charactersGuessed = `${charactersGuessed}${characterGuessed}`;
    } else {
      livesLeft--;
    }
    
    let wordHash = "";
    for (const char of word) {
      if (charactersGuessed.includes(char)) {
        wordHash += ` ${char} `;
      } else {
        wordHash += " \\_ ";
      }
    }
    
    let animation = animations[8 - livesLeft].join("\n");
    
    let newEmbed = new MessageEmbed()
      .setTitle(embed.title)
      .setColor(embed.color)
      .addField("Game Information", `Word length: ${word.length}\nLives left: ${livesLeft}\nCharacters guessed: ${charactersGuessed}\n\nWord: ${wordHash}`, true)
      .addField("Avatar", `\`\`\`${animation}\`\`\``, true)
      .setFooter(embed.footer.text);
    
    let components = game.components.map(row => {
      row.components = row.components.map(component => {
        if (component.customId === interaction.customId) {
          component.style = isCharacterValid ? "SUCCESS" : "DANGER";
          component.disabled = true;
        }
        return component;
      });
      return row;
    });
    
    
    // Handle game over logic
    if (livesLeft === 0) {
      components = game.components.map(row => {
        row.components = row.components.map(component => {
          component.setDisabled(true);
          return component;
        });
        return row;
      });
      newEmbed.fields[0].value = `Game over! **You lost!**\n\nThe word was: **${word}**`;
      
      let user = await User.findOne({userId: interaction.user.id});
      if (!user) {
        user = new User({
          _id: interaction.user.id,
        });
      }
      
      if (!user.hangman) {
        user.hangman = {
          wins: 0,
          losses: 0,
          winstreak: 0,
          games: 0,
        };
      }
      
      user.hangman.losses += 1;
      user.hangman.games += 1;
      user.hangman.winstreak = 0;
      user.markModified("hangman");
      await user.save();
    }
    
    if (word.split("").every(char => charactersGuessed.includes(char))) {
      components = game.components.map(row => {
        row.components = row.components.map(component => {
          component.setDisabled(true);
          return component;
        });
        return row;
      });
      newEmbed.fields[0].value = "Game over! You won!\n\nThe word was: " + word;
      
      let user = await User.findOne({userId: interaction.user.id});
      if (!user) {
        user = new User({
          _id: interaction.user.id,
        });
      }
      
      if (!user.hangman) {
        user.hangman = {
          wins: 0,
          losses: 0,
          winstreak: 0,
          games: 0,
        };
      }
      
      user.hangman.wins += 1;
      user.hangman.games += 1;
      user.hangman.winstreak += 1;
      user.markModified("hangman");
      await user.save();
    }
    
    await interaction.update({
      embeds: [newEmbed],
      components: components,
    });
  },
};