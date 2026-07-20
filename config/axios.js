const axios = require("axios");

/* =====================================================
   Pre-configured Axios instance for YAKEEN API calls
====================================================== */

const yakeenAxios = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  maxRedirects: 3,
  validateStatus: (status) => status < 500,
});

module.exports = yakeenAxios;
