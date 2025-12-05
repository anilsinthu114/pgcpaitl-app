const { createLogger, format, transports } = require("winston");
const { logFormat } = require("./formats");
const {
  appTransport,
  paymentTransport,
  dbTransport,
  errorTransport
} = require("./transports");

// GENERAL LOGGER (App-level)
const appLogger = createLogger({
  level: "info",
  format: logFormat,
  transports: [
    appTransport,
    new transports.Console()
  ]
});

// PAYMENT LOGGER
const paymentLogger = createLogger({
  level: "info",
  format: logFormat,
  transports: [
    paymentTransport,
    new transports.Console()
  ]
});

// DATABASE LOGGER
const dbLogger = createLogger({
  level: "info",
  format: logFormat,
  transports: [
    dbTransport,
    new transports.Console()
  ]
});

// ERROR LOGGER (Important)
const errorLogger = createLogger({
  level: "error",
  format: logFormat,
  transports: [
    errorTransport,
    new transports.Console({ stderrLevels: ["error"] })
  ]
});

module.exports = {
  appLogger,
  paymentLogger,
  dbLogger,
  errorLogger
};
