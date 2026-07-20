/* =====================================================
   In-Memory Token Cache
   ─────────────────────────────────────────────────────
   Simple module-level cache. No external dependencies.
   The token is refreshed automatically by the YAKEEN
   service when it expires.
====================================================== */

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Store a token with an expiry time.
 * @param {string} token
 * @param {number} expiresInSeconds — lifetime in seconds
 */
const setToken = (token, expiresInSeconds) => {
  cachedToken = token;
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
};

/**
 * Retrieve the cached token if still valid (with 60 s buffer).
 * @returns {string|null}
 */
const getToken = () => {
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }
  return null;
};

/**
 * Invalidate the cached token (e.g. after a 401).
 */
const clearToken = () => {
  cachedToken = null;
  tokenExpiresAt = null;
};

/**
 * Check if a valid token exists.
 * @returns {boolean}
 */
const hasValidToken = () => {
  return !!(cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000);
};

module.exports = { setToken, getToken, clearToken, hasValidToken };
