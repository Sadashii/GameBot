const mongoose = require("mongoose");
const User = mongoose.model("User");
const {MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const {COLORS} = require("../../utils/data");
const {ICONS} = require("./data");

class TicTacToeManager {
  constructor () {
    this.games = []
  }
  
  async askForGame (interaction, target) {
    const embed = new MessageEmbed()
      .setColor(COLORS.INFO)
      .setTitle("TicTacToe")
      .setDescription(`Do you want to play a game with ${interaction.user.toString()}? You have 15 seconds to answer.`)
    
    const components = new MessageActionRow()
      .addComponents([
        new MessageButton()
          .setCustomId(`tictactoeaskforgame-yes`)
          .setLabel("Yes")
          .setStyle("SUCCESS"),
        new MessageButton()
          .setCustomId(`tictactoeaskforgame-decline`)
          .setLabel("No")
          .setStyle("DANGER"),
        ]
      )
    
    const prompt = await interaction.editReply({
      content: target.toString(),
      embeds: [embed],
      components: [components],
      fetchReply: true,
    })
  
    const filter = (interaction) => interaction.user.id === target.id;
    const collector = prompt.createMessageComponentCollector({ filter, time: 15_000 });
    collector.on('collect', async button => {
      if (button.customId === "tictactoeaskforgame-yes") {
        await this.startGame(interaction, interaction.member, target)
      } else if (button.customId === "tictactoeaskforgame-decline") {
        const embed = new MessageEmbed()
          .setColor(COLORS.ERROR)
          .setTitle("TicTacToe")
          .setDescription(`Can't play a game with ${target.toString()}, they've declined your request.`)
  
        await interaction.editReply({
          content: interaction.user.toString(),
          embeds: [embed],
          components: [],
        })
      }
    });
    collector.on('end', async collected => {
      if (collected.size === 0) {
        const embed = new MessageEmbed()
          .setColor(COLORS.ERROR)
          .setTitle("TicTacToe")
          .setDescription(`Can't play a game with ${target.toString()}, they didn't respond to your request.`)
  
        
        await interaction.editReply({
          content: interaction.user.toString(),
          embeds: [embed],
          components: [],
        })
      }
      // No need to handle the case where a response is collected because it is handled when a button is pressed.
    });
  }
  
  async startGame(interaction, player1, player2) {
    const embed = new MessageEmbed()
      .setTitle("TicTacToe")
      .setDescription(`${player1.toString()} vs ${player2.toString()}\n\nMove: ${player1.toString()}`)
      .setColor(COLORS.INFO);

    const components = [];
    for (let rowCount = 0; rowCount < 3; rowCount++) {
      let row = new MessageActionRow();
      for (let colCount = 0; colCount < 3; colCount++) {
        row.addComponents(
          new MessageButton()
            .setCustomId(`tictactoe-${rowCount}-${colCount}`)
            .setEmoji(ICONS.NONE)
            .setStyle("SECONDARY"),
        );
      }
      components.push(row);
    }

    await interaction.editReply({
      content: `${player1.toString()} vs ${player2.toString()}`,
      embeds: [embed],
      components,
    });
    
    this.games.push({
      gameID: interaction.id,
      player1: player1.user,
      player2: player2,
      player1DB: await this.startGameDB(player1.user, player2),
      player2DB: await this.startGameDB(player2, player1.user),
      player1Turn: true,
    })
  }
  
  async playerMove(interaction) {
    let game = this.games.find(game => game.gameID === interaction.message.interaction.id)
    if (!game) return;
    
    if (game.player1Turn && game.player1.id !== interaction.user.id) {
      return await interaction.reply({
        content: `${ICONS.CROSS} | It's not your turn!`,
        ephemeral: true,
      });
    } else if (!game.player1Turn && game.player2.id !== interaction.user.id) {
      return await interaction.reply({
        content: `${ICONS.CROSS} | It's not your turn!`,
        ephemeral: true,
      });
    }
  
    let components = interaction.message.components.map(row => {
      row.components = row.components.map(component => {
        if (component.customId === interaction.customId) {
          let emoji = game.player1Turn ? ICONS.CROSS : ICONS.ZERO;
          let background = game.player1Turn ? "SUCCESS" : "DANGER";

          component.setEmoji(emoji);
          component.style = background;
          component.disabled = true;
        }
        return component;
      });
      return row;
    });
    
    let gameOver = false;
    let gameDraw = false;
    let grid = interaction.message.components.map(row => {
      return row.components.map(component => component.emoji?.name === "none" ? undefined : component.emoji.name);
    });
    
    for (const row of grid) {
      if (row[0] === row[1] && row[1] === row[2] && row[0] !== undefined) {
        gameOver = true;
      }
    }
    for (let col = 0; col < grid.length; col++) {
      if (grid[0][col] === grid[1][col] && grid[1][col] === grid[2][col] && grid[0][col] !== undefined) {
        gameOver = true;
      }
    }
    if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2] && grid[0][0] !== undefined) {
      gameOver = true;
    }
    if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0] && grid[0][2] !== undefined) {
      gameOver = true;
    }
    
    if (!gameOver && grid.every(row => row.every(col => col !== undefined))) {
      gameDraw = true;
    }
  
    
    let embed = interaction.message.embeds[0]
    
    if (gameOver) {
      embed.description = `Player ${game.player1Turn ? game.player1.toString() : game.player2.toString()} won!`;
      components = components.map(row => {
        row.components = row.components.map(component => {
          component.disabled = true;
          return component;
        });
        return row;
      });
      
      
      let winner = game.player1Turn ? game.player1DB : game.player2DB;
      let loser = game.player1Turn ? game.player2DB : game.player1DB;
      await this.scoreForWin(winner, loser);
      
      delete this.games[this.games.indexOf(game)];
    }
    if (gameDraw) {
      embed.description = `Game is a draw!`;
      
      await this.scoreForDraw(game.player1DB, game.player2DB);
      delete this.games[this.games.indexOf(game)];
    }
    if (!gameOver && !gameDraw) {
      game.player1Turn = !game.player1Turn;
      let turn = game.player1Turn ? game.player1.toString() : game.player2.toString();
      embed.description = `${game.player1.toString()} vs ${game.player2.toString()}\n\nMove: ${turn}`;
    }
  
    await interaction.update({
      embeds: [embed],
      components: components,
    });
  }
  
  async startGameDB(player, against) {
    let user = await User.findById(player.id);
    if (!user) {
      user = new User({_id: player.id});
    }
    if (!user.tictactoe) {
      user.tictactoe = {
        wins: 0,
        losses: 0,
        ties: 0,
        games: 0,
        winstreak: 0,
        against: {
          [against.id]: {
            wins: 0,
            losses: 0,
            ties: 0,
            games: 0,
            winstreak: 0,
          }
        }
      }
    }
    
    user.tictactoe.games++;
    
    if (!user.tictactoe.against[against.id]) {
      user.tictactoe.against[against.id] = {
        wins: 0,
        losses: 0,
        ties: 0,
        games: 0,
        winstreak: 0,
      }
    }
    user.tictactoe.against[against.id].games++;
    
    user.markModified('tictactoe');
    await user.save();
    return user;
  }
  
  async scoreForWin(winner, loser) { // Here, both are monogoose objects insteads of discord user objects
    winner.tictactoe.wins++;
    winner.tictactoe.winstreak++;
    winner.tictactoe.against[loser._id].wins++;
    winner.tictactoe.against[loser._id].winstreak++;
    winner.markModified('tictactoe');
    await winner.save();
    
    
    loser.tictactoe.losses++;
    loser.tictactoe.winstreak = 0;
    loser.tictactoe.against[winner._id].losses++;
    loser.tictactoe.against[winner._id].winstreak = 0;
    loser.markModified('tictactoe');
    await loser.save();
  }
  
  async scoreForDraw (player1, player2) { // Here, both are monogoose objects insteads of discord user objects
    player1.tictactoe.ties++;
    player1.tictactoe.winstreak = 0;
    player1.tictactoe.against[player2._id].ties++;
    player1.tictactoe.against[player2._id].winstreak = 0;
    player1.markModified('tictactoe');
    await player1.save();
    
    player2.tictactoe.ties++;
    player2.tictactoe.winstreak = 0;
    player2.tictactoe.against[player1._id].ties++;
    player2.tictactoe.against[player1._id].winstreak = 0;
    player2.markModified('tictactoe');
    await player2.save();
  }
}

const TicTacToeGameManager = new TicTacToeManager();
module.exports = TicTacToeGameManager;