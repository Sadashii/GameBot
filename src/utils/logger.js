const winston = require("winston");

/**
 * Setup Winston Logging Transports
 */
let transports = [
  new winston.transports.File({
    filename: "error.log",
    level: "error",
    format: winston.format.uncolorize(),
  }), // error logs only
  new winston.transports.File({
    filename: "combined.log",
    format: winston.format.uncolorize(),
  }), // combined log
  new winston.transports.Console(),
];

/**
 * Exports the Logger
 */
module.exports = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({format: "YYYY-MM-DD hh:mm:ss"}),
    winston.format.align(),
    winston.format.printf(
      (info) => `[${info.timestamp}] [${info.level}] ${info.message}`,
    ),
  ),
  level: "silly",
  transports: transports,
});