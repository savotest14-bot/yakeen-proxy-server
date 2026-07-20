/* =====================================================
   Date Utility Helpers
====================================================== */

/**
 * Get current ISO timestamp string.
 * @returns {string}
 */
const nowISO = () => new Date().toISOString();

/**
 * Format a Date object to YYYY-MM-DD HH:mm:ss.
 * @param {Date} [date]
 * @returns {string}
 */
const formatDateTime = (date = new Date()) => {
  return date
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, "");
};

module.exports = { nowISO, formatDateTime };
