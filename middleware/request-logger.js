const { appLogger } = require("../logger");

module.exports = function requestLogger(req, res, next) {
  appLogger.info(`Incoming request: ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });
  next();
};
