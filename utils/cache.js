const NodeCache = require("node-cache");

// Cache TTL default: 10 minutes (600 seconds), cleanup check every 2 minutes
const identityCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
});

module.exports = identityCache;
