const mongoose = require("mongoose");
const User = mongoose.model("User");
const {MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const {COLORS, EMOJIS} = require("../../utils/data");
const _ = require("../../utils/utils");

class GameManager {
  constructor () {
    this.game = 'TicTacToe'
    this.pending_move_interactions = [];
  }
  get clientObject() {
    return this.client
  }
  set clientObject(client) {
    this.client = client
  }
  
  async waitForMove(interaction, user) {
    this.pending_move_interactions.push(interaction.message.interaction.id);
    
    setTimeout(async () => {
      if (this.pending_move_interactions.includes(interaction.message.interaction.id)) {
        const game = await this.parseGameDataFromPreviousMessage(interaction)
        
        let components = interaction.message.components.map(row => {
          row.components = row.components.map(component => {
            component.disabled = true;
            return component;
          });
          return row;
        });

        const embed = new MessageEmbed()
          .setTitle(this.game)
          .setColor(COLORS.ERROR)
          .setDescription(`Terminating game due to inactivity... ${user.toString()} has not played their move in over 90 seconds. ${game.turn.toString()} has won the game!`)
  
        await interaction.editReply({
          embeds: [embed],
          components,
        })
  
        await this.scoreForWin(!game.player1Turn ? game.player1 : game.player2, !game.player1Turn ? game.player2 : game.player1);
        
        this.pending_move_interactions.splice(this.pending_move_interactions.indexOf(interaction.message.interaction.id), 1);
      }
    }, 90 * 1000)
  }
  
  async onMove(interaction) {
    if (this.pending_move_interactions.includes(interaction.message.interaction.id)) {
      this.pending_move_interactions.splice(this.pending_move_interactions.indexOf(interaction.message.interaction.id), 1);
    }
  }

  async askForGame (interaction, player1, player2) {
    const embed = new MessageEmbed()
      .setColor(COLORS.INFO)
      .setTitle(this.game)
      .setDescription(this.client.messages.GAME_PROMPT_ASK(player1, this.game))

    const components = [
      new MessageActionRow()
        .addComponents([
            new MessageButton()
              .setCustomId(`${this.game}askforgame-accept`)
              .setLabel("Accept")
              .setStyle("SUCCESS"),
            new MessageButton()
              .setCustomId(`${this.game}askforgame-decline`)
              .setLabel("Decline")
              .setStyle("DANGER"),
          ]
        )
    ]

    const prompt = await interaction.reply({
      content: player2.toString(),
      embeds: [embed],
      components: components,
      fetchReply: true,
    })

    const filter = (interaction) => interaction.user.id === player2.user.id;
    const collector = prompt.createMessageComponentCollector({ filter, time: 15_000 });
    collector.on('collect', async button => {
      if (button.customId === `${this.game}askforgame-accept`) {
        return await this.startGame(interaction, player1, player2)
      }
      
      if (button.customId === `${this.game}askforgame-decline`) {
        const embed = new MessageEmbed()
          .setColor(COLORS.ERROR)
          .setTitle(this.game)
          .setDescription(this.client.messages.GAME_PROMPT_DENIED(player2))

        return await interaction.editReply({
          content: player1.toString(),
          embeds: [embed],
          components: [],
        })
      }
    });
    collector.on('end', async collected => {
      if (collected.size === 0) {
        const embed = new MessageEmbed()
          .setColor(COLORS.ERROR)
          .setTitle(this.game)
          .setDescription(this.client.messages.GAME_PROMPT_NO_REPLY(player2))
        
        return await interaction.editReply({
          content: player1.toString(),
          embeds: [embed],
          components: [],
        })
      }
    });
  }
  
  async startGame(interaction, player1, player2) {
    const embed = new MessageEmbed()
      .setTitle(this.game)
      .setDescription(`Move: ${player1.toString()}\n\nYou have until ${_.timeStampFromNow(90)} to make your move!`)
      .setFooter(this.client.messages.RANDOM_BOT_TIP())
      .setColor(COLORS.INFO);

    const components = [];
    for (let rowCount = 0; rowCount < 3; rowCount++) {
      let row = new MessageActionRow();
      for (let colCount = 0; colCount < 3; colCount++) {
        row.addComponents(
          new MessageButton()
            .setCustomId(`tictactoe-${rowCount}-${colCount}`)
            .setEmoji(EMOJIS.TRANSPARENT)
            .setStyle("SECONDARY"),
        );
      }
      components.push(row);
    }

    interaction.message = await interaction.editReply({
      content: `${player1.toString()} vs ${player2.toString()}`,
      embeds: [embed],
      components,
      fetchReply: true,
    });
  
    await this.startUserDB(player1.user, player2)
    await this.startUserDB(player2, player1.user)
    await this.waitForMove(interaction, player1)
  }
  
  async parseGameDataFromPreviousMessage(interaction) {
    let message = interaction.message;
    let players = message.content.split(" vs ");
    players = players.map(id => id.replace(/[^0-9]/g, ""))
    
    let guildUsers = interaction.guild.members
    let player1 = await guildUsers.fetch(players[0])
    let player2 = await guildUsers.fetch(players[1])
    let player1Turn = message.embeds[0].description.split('\n')[0].split(": ")[1] === player1.toString();
    
    return {
      player1,
      player2,
      player1Turn,
      turn: player1Turn ? player1 : player2
    }
  }
  
  async playerMove(interaction) {
    const game = await this.parseGameDataFromPreviousMessage(interaction);
    if (!game || !game.player1 || !game.player2) {
      await interaction.reply({
        content: "Could not load complete game data - Cannot play",
        ephemeral: true
      })
      return;
    }
    
    if (game.turn.user.id !== interaction.user.id) {
      return await interaction.reply({
        content: `${EMOJIS.CROSS} | It's not your turn!`,
        ephemeral: true,
      });
    }
    
    await this.onMove(interaction)
  
    let components = interaction.message.components.map(row => {
      row.components = row.components.map(component => {
        if (component.customId === interaction.customId) {
          let emoji = game.player1Turn ? EMOJIS.CROSS : EMOJIS.ZERO;
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
      
      await this.scoreForWin(game.player1Turn ? game.player1 : game.player2, game.player1Turn ? game.player2 : game.player1);
    }
    if (gameDraw) {
      embed.description = `Game is a draw!`;
      
      await this.scoreForDraw(game.player1, game.player2);
    }
    if (!gameOver && !gameDraw) {
      game.player1Turn = !game.player1Turn;
      let turn = game.player1Turn ? game.player1 : game.player2;
      embed.description = `Move: ${turn.toString()}\n\nYou must do your move within 90 seconds. (<t:${Math.round(new Date().getTime() / 1000) + 90}:R>)`;
      await this.waitForMove(interaction, turn);
    }

    embed.setFooter(this.client.messages.RANDOM_BOT_TIP())
  
    await interaction.update({
      embeds: [embed],
      components: components,
    });
  }
  
  async startUserDB(player, against) {
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
  
  async scoreForWin(winner, loser) {
    winner = await User.findById(winner.id);
    loser = await User.findById(loser.id);
    
    
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
  
  async scoreForDraw (player1, player2) {
    player1 = await User.findById(player1.id);
    player2 = await User.findById(player2.id);
  
    
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

const GameManagerInstance = new GameManager();
module.exports = GameManagerInstance;