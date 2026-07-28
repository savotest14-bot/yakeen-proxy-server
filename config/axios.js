const axios = require("axios");
const http = require("http");
const https = require("https");

/* =====================================================
   Pre-configured Axios instance for YAKEEN API calls
====================================================== */

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const yakeenAxios = axios.create({
  timeout: 30000,
  httpAgent,
  httpsAgent,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  maxRedirects: 3,
  validateStatus: (status) => status < 500,
});

module.exports = yakeenAxios;
