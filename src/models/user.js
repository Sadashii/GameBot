/*
    Module Dependencies
*/
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/** User Schema
 * @class User
 * @memberof module:models
 * @param {String} _id - Unique ID of the user.
 */

const User = new Schema({
  _id: String,
  tictactoe: {
    wins: Number,
    losses: Number,
    ties: Number,
    games: Number,
    winstreak: Number,
    against: [Object],
  },
});

mongoose.model("User", User, "users");