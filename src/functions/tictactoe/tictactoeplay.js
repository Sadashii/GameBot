const mongoose = require("mongoose");
const {ICONS} = require("./data");
const User = mongoose.model("User");

module.exports = {
  name: "tictactoe",
  type: "BUTTON",
  enabled: true,
  async execute (client, interaction, logger) {
    let game = interaction.message;
    let players = game.embeds[0].description.split("\n")[0].split(" vs ");
    let currentmove = game.embeds[0].description.split("\n")[2].split(": ")[1];
    let turnsDone = game.embeds[0].description.split("\n")[3].split(": ")[1];
    
    if (currentmove !== interaction.user.toString()) {
      return await interaction.reply({
        content: `${ICONS.CROSS} | It's not your turn!`,
        ephemeral: true,
      });
    }
    
    let components = game.components.map(row => {
      row.components = row.components.map(component => {
        if (component.customId === interaction.customId) {
          let emoji = turnsDone % 2 === 0 ? ICONS.CROSS : ICONS.ZERO;
          let background = turnsDone % 2 === 0 ? "SUCCESS" : "DANGER";
          
          component.setEmoji(emoji);
          component.style = background;
          component.disabled = true;
        }
        return component;
      });
      return row;
    });
    
    let gameOver = false;
    let grid = components.map(row => {
      return row.components.map(component => component.emoji?.name);
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
    
    
    let embed = game.embeds[0];
    turnsDone = parseInt(turnsDone) + 1;
    if (gameOver) {
      embed.description = `Player ${currentmove} won!`;
      components = components.map(row => {
        row.components = row.components.map(component => {
          component.disabled = true;
          return component;
        });
        return row;
      });
      
      let wid = currentmove.slice(2, -1);
      let lid = players[0] === currentmove ? players[1].slice(2, -1) : players[0].slice(2, -1);
      
      
      let win = await User.findById(wid);
      if (win) {
        win.tictactoe.wins += 1;
        win.tictactoe.games += 1;
        win.tictactoe.winstreak += 1  ;
        if (win.tictactoe.against[lid]) {
          win.tictactoe.against[lid].wins += 1;
          win.tictactoe.against[lid].games += 1;
          win.tictactoe.against[lid].winstreak += 1;
        } else {
          win.tictactoe.against[lid] = {
            wins: 1,
            losses: 0,
            ties: 0,
            games: 1,
            winstreak: 1,
          };
        }
        win.markModified("tictactoe");
      } else {
        win = new User({
          _id: wid,
          tictactoe: {
            wins: 1,
            losses: 0,
            ties: 0,
            games: 1,
            winstreak: 1,
            against: {
              [lid]: {
                wins: 1,
                losses: 0,
                ties: 0,
                games: 1,
                winstreak: 1,
              },
            },
          },
        });
      }
      await win.save();
      
      
      let los = await User.findById(lid);
      if (los) {
        los.tictactoe.losses += 1;
        los.tictactoe.games += 1;
        los.tictactoe.winstreak = 0;
        if (los.tictactoe.against[wid]) {
          los.tictactoe.against[wid].losses += 1;
          los.tictactoe.against[wid].games += 1;
          los.tictactoe.against[wid].winstreak = 0;
        } else {
          los.tictactoe.against[wid] = {
            wins: 0,
            losses: 1,
            ties: 0,
            games: 1,
          };
        }
        los.markModified("tictactoe");
      } else {
        los = new User({
          _id: lid,
          tictactoe: {
            wins: 0,
            losses: 1,
            ties: 0,
            games: 1,
            winstreak: 0,
            against: {
              [wid]: {
                wins: 0,
                losses: 1,
                ties: 0,
                games: 1,
                winstreak: 0,
              },
            },
          },
        });
      }
      await los.save();
    }
    
    if (turnsDone === 9) {
      embed.description = `It's a draw!`;
  
      let wid = currentmove.slice(2, -1);
      let lid = players[0] === currentmove ? players[1].slice(2, -1) : players[0].slice(2, -1);
      
      let win = await User.findById(wid);
      if (win) {
        win.tictactoe.ties += 1;
        win.tictactoe.games += 1;
        win.tictactoe.winstreak = 0;
        if (win.tictactoe.against[lid]) {
          win.tictactoe.against[lid].ties += 1;
          win.tictactoe.against[lid].games += 1;
          win.tictactoe.against[lid].winstreak = 0;
        } else {
          win.tictactoe.against[lid] = {
            wins: 0,
            losses: 0,
            ties: 1,
            games: 1,
            winstreak: 0,
          };
        }
        win.markModified("tictactoe");
      } else {
        win = new User({
          _id: wid,
          tictactoe: {
            wins: 0,
            losses: 0,
            ties: 1,
            games: 1,
            winstreak: 0,
            against: {
              [lid]: {
                wins: 0,
                losses: 0,
                ties: 1,
                games: 1,
                winstreak: 0,
              },
            },
          },
        });
      }
      await win.save();
      
      let los = await User.findById(lid);
      if (los) {
        los.tictactoe.ties += 1;
        los.tictactoe.games += 1;
        los.tictactoe.winstreak = 0;
        if (los.tictactoe.against[wid]) {
          los.tictactoe.against[wid].ties += 1;
          los.tictactoe.against[wid].games += 1;
          los.tictactoe.against[wid].winstreak = 0;
        } else {
          los.tictactoe.against[wid] = {
            wins: 0,
            losses: 0,
            ties: 1,
            games: 1,
            winstreak: 0,
          };
        }
        los.markModified("tictactoe");
      } else {
        los = new User({
          _id: lid,
          tictactoe: {
            wins: 0,
            losses: 0,
            ties: 1,
            games: 1,
            winstreak: 0,
            against: {
              [wid]: {
                wins: 0,
                losses: 0,
                ties: 1,
                games: 1,
                winstreak: 0,
              },
            },
          },
        });
      }
      
      await los.save();
    }
    
    if (!gameOver && turnsDone !== 9) {
      let nextMove = turnsDone % 2 === 0 ? players[0] : players[1];
      embed.description = `${players[0]} vs ${players[1]}\n\nMove: ${nextMove}\nTurns: ${turnsDone}`;
    }
    
    
    await interaction.update({
      embeds: [embed],
      components: components,
    });
  },
};