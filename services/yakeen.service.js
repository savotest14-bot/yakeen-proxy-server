const yakeenAxios = require("../config/axios");
const logger = require("../config/logger");
const tokenCache = require("../utils/tokenCache");
const identityCache = require("../utils/cache");
const env = require("../config/env");

/* =====================================================
   Safe Axios Error Logger — never log full response
====================================================== */

const safeLogAxiosError = (label, error) => {
  const info = {
    label,
    message: error.message || "Unknown error",
    code: error.code || null,
    status: error.response?.status || null,
    statusText: error.response?.statusText || null,
    responseData: error.response?.data || null,
    url: error.config?.url || null,
    method: error.config?.method || null,
  };
  logger.error(`${label}`, info);
};

/* =====================================================
   YAKEEN Login — Authenticate & Cache Token
====================================================== */

const login = async () => {
  const loginUrl = env.YAKEEN_LOGIN_URL;

  logger.info("YAKEEN login attempt", { url: loginUrl });

  try {
    const response = await yakeenAxios.post(
      loginUrl,
      {
        username: env.YAKEEN_USERNAME,
        password: env.YAKEEN_PASSWORD,
      },
      {
        headers: {
          "app-id": env.YAKEEN_APP_ID,
          "app-key": env.YAKEEN_APP_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    // console.log removed to save disk space and bandwidth

    if (response.status >= 400) {
      logger.error("YAKEEN login returned error status", {
        status: response.status,
        data: response.data,
      });
      throw new Error(`YAKEEN login failed with status ${response.status}`);
    }

    const data = response.data;

    if (!data || !data.access_token) {
      logger.error("YAKEEN login response missing accessToken", {
        keys: Object.keys(data || {}),
      });
      throw new Error("YAKEEN login response missing accessToken");
    }

    // Default 55 minutes if no expiry returned (tokens typically last 1h)
    const expiresInSeconds = data.expires_in || 3300;
    tokenCache.setToken(data.access_token, expiresInSeconds);

    logger.info("YAKEEN login success — token cached");

    return data.access_token;
  } catch (error) {
    safeLogAxiosError("YAKEEN login failure", error);
    throw new Error("YAKEEN authentication failed");
  }
};

/* =====================================================
   Get Valid Token — Reuse or Re-login
====================================================== */

const getToken = async () => {
  const cached = tokenCache.getToken();
  if (cached) {
    logger.info("Using cached YAKEEN token");
    return cached;
  }

  logger.info("Token expired or not cached — logging in…");
  return login();
};

/* =====================================================
   Build Verification Request Config
====================================================== */

// const buildVerificationConfig = (identityType, identityNumber, dateOfBirth, token) => {
//   const serviceIdentifier =
//     identityType === "SAUDI"
//       ? env.YAKEEN_SAUDI_SERVICE_IDENTIFIER
//       : env.YAKEEN_RESIDENT_SERVICE_IDENTIFIER;

//   const query =
//     identityType === "SAUDI"
//       ? { nin: identityNumber, dateOfBirth }
//       : { iqama: identityNumber, dateOfBirth };

//   const url = `${env.YAKEEN_BASE_URL}/api/v1/yakeen/data`;

//   const headers = {
//     Authorization: `Bearer ${token}`,
//     "service-identifier": serviceIdentifier,
//     "usage-code": env.YAKEEN_USAGE_CODE,
//     "operator-id": env.YAKEEN_OPERATOR_ID,
//     "accept-language": "ar",
//     "app-id": env.YAKEEN_APP_ID,
//     "app-key": env.YAKEEN_APP_KEY,
//   };
//   console.log("YAKEEN verification config:", { url, query, headers });
//   return { url, params: query, headers, timeout: 30000 };
// };


const buildVerificationConfig = (
  identityType,
  identityNumber,
  dateOfBirth,
  token
) => {
  const serviceIdentifier =
    identityType === "SAUDI"
      ? env.YAKEEN_SAUDI_SERVICE_IDENTIFIER
      : env.YAKEEN_RESIDENT_SERVICE_IDENTIFIER;

  // Convert YYYY-MM-DD -> YYYY-MM
  const formattedDateOfBirth = dateOfBirth
    ? dateOfBirth.substring(0, 7)
    : dateOfBirth;

  const query =
    identityType === "SAUDI"
      ? {
        nin: identityNumber,
        dateOfBirth: formattedDateOfBirth,
      }
      : {
        iqama: identityNumber,
        dateOfBirth: formattedDateOfBirth,
      };

  const url = `${env.YAKEEN_BASE_URL}/api/v1/yakeen/data`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "service-identifier": serviceIdentifier,
    "usage-code": env.YAKEEN_USAGE_CODE,
    "operator-id": env.YAKEEN_OPERATOR_ID,
    "accept-language": "ar",
    "app-id": env.YAKEEN_APP_ID,
    "app-key": env.YAKEEN_APP_KEY,
  };

  // console.log removed to save disk space and bandwidth

  return {
    url,
    params: query,
    headers,
    timeout: 30000,
  };
};
/* =====================================================
   YAKEEN Verification — Fetch Identity Data
====================================================== */

const verifyIdentity = async ({ identityType, identityNumber, dateOfBirth }) => {
  const cacheKey = `${identityType}:${identityNumber}:${dateOfBirth}`;
  const cachedData = identityCache.get(cacheKey);
  if (cachedData) {
    logger.info("Serving YAKEEN verification from cache", {
      identityType,
      identityNumber,
    });
    return cachedData;
  }

  logger.info("YAKEEN verification request", {
    identityType,
    identityNumber,
    dateOfBirth,
  });

  /* ── Acquire token ─────────────────────────────── */
  let token;
  try {
    token = await getToken();
  } catch (loginError) {
    logger.error("Token acquisition failed", { message: loginError.message });
    throw new Error("YAKEEN authentication failed. Please try again later.");
  }

  const config = buildVerificationConfig(identityType, identityNumber, dateOfBirth, token);

  logger.info("YAKEEN verification call", {
    url: config.url,
    params: config.params,
  });

  /* ── First attempt ─────────────────────────────── */
  try {
    const response = await yakeenAxios.get(config.url, {
      params: config.params,
      headers: config.headers,
      timeout: config.timeout,
    });
    // console.log removed to save disk space and bandwidth
    if (response.status === 401) {
      throw Object.assign(new Error("Unauthorized"), {
        response: { status: 401, data: response.data },
      });
    }

    if (response.status >= 400) {
      const msg =
        response.data?.message || response.data?.error || "Identity verification failed";
      throw Object.assign(new Error(msg), {
        response: { status: response.status, data: response.data },
      });
    }

    logger.info("YAKEEN verification success", {
      identityType,
      status: response.status,
    });

    identityCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    /* ── Retry on 401 ─────────────────────────────── */
    if (error.response && error.response.status === 401) {
      logger.info("YAKEEN token expired — re-authenticating for retry…");

      tokenCache.clearToken();

      try {
        const newToken = await getToken();
        const retryConfig = buildVerificationConfig(
          identityType,
          identityNumber,
          dateOfBirth,
          newToken
        );

        const retryResponse = await yakeenAxios.get(retryConfig.url, {
          params: retryConfig.params,
          headers: retryConfig.headers,
          timeout: retryConfig.timeout,
        });

        if (retryResponse.status >= 400) {
          const msg =
            retryResponse.data?.message ||
            retryResponse.data?.error ||
            "Identity verification failed after retry";
          throw new Error(msg);
        }

        logger.info("YAKEEN verification retry success", {
          identityType,
          status: retryResponse.status,
        });
        // console.log removed to save disk space and bandwidth
        identityCache.set(cacheKey, retryResponse.data);
        return retryResponse.data;
      } catch (retryError) {
        safeLogAxiosError("YAKEEN retry verification failure", retryError);

        if (retryError.response?.data) {
          throw new Error(
            retryError.response.data.message ||
            retryError.response.data.error ||
            "YAKEEN verification failed after retry"
          );
        }

        throw new Error("YAKEEN service unavailable after retry. Please try again later.");
      }
    }

    /* ── Non-401 errors ───────────────────────────── */
    safeLogAxiosError("YAKEEN verification failure", error);

    if (error.response?.data) {
      throw new Error(
        error.response.data.message ||
        error.response.data.error ||
        "Identity verification failed"
      );
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("YAKEEN service timed out. Please try again later.");
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      throw new Error("YAKEEN service is unreachable. Please try again later.");
    }

    throw new Error("YAKEEN service unavailable. Please try again later.");
  }
};


/* =====================================================
   Exports
====================================================== */

module.exports = {
  login,
  getToken,
  verifyIdentity,
  buildVerificationConfig,
  safeLogAxiosError,
};
