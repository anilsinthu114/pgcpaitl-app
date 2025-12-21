const isProd = process.env.NODE_ENV === "production";

const debug = (...args) => {
  if (!isProd) console.log("[DEBUG]", ...args);
};

const info = (...args) => console.log("[INFO]", ...args);

const warn = (...args) => console.warn("[WARN]", ...args);

const error = (...args) => console.error("[ERROR]", ...args);

module.exports = { debug, info, warn, error };
