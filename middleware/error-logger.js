const { errorLogger } = require("../logger");

module.exports = function errorLoggerMiddleware(err, req, res, next) {
  errorLogger.error("Unhandled Error", {
    message: err.message,
    stack: err.stack,
    route: req.url
  });
  next(err);
};
