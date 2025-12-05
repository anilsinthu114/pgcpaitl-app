const { transports } = require("winston");
const DailyRotate = require("winston-daily-rotate-file");
const path = require("path");

module.exports = {
  appTransport: new DailyRotate({
    dirname: path.join(__dirname, "..", "logs"),
    filename: "app-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "30d"
  }),

  paymentTransport: new DailyRotate({
    dirname: path.join(__dirname, "..", "logs"),
    filename: "payments-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "60d"
  }),

  dbTransport: new DailyRotate({
    dirname: path.join(__dirname, "..", "logs"),
    filename: "db-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "30d"
  }),

  errorTransport: new DailyRotate({
    dirname: path.join(__dirname, "..", "logs"),
    filename: "error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "90d"
  })
};
