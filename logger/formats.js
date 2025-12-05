const { format } = require("winston");

module.exports = {
  logFormat: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(info => {
      return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message} ${
        info.meta ? JSON.stringify(info.meta) : ""
      }`;
    })
  )
};
