import { SiteIsDownError } from "../api/errors.js";
import { validHostname } from "../api/v2/utils.js";
import { CONFIG } from "../config.js";
import { Site } from "../site.js";
import axios from "axios";

/**
 * Detects if a port supports TLS by making simple test requests
 * @param {Site} site
 * @returns {Promise<boolean>} true if TLS is supported, false otherwise
 */
export async function detectTlsSupport(site) {
  const httpsUrl = `https://${site.hostname}:${site.port}${site.path ?? ""}`;
  const httpUrl = `http://${site.hostname}:${site.port}${site.path ?? ""}`;

  // Simple timeout and basic config for quick checks
  const config = {
    timeout: CONFIG.retriever.clientTimeout,
    maxRedirects: 0,
    validateStatus: (/** @type {number} */ status) => status < 500,
  };

  // Run both requests concurrently
  const [httpsResult, httpResult] = await Promise.allSettled([
    axios.head(httpsUrl, {
      ...config,
      httpsAgent: new (await import("https")).Agent({
        rejectUnauthorized: false, // Accept self-signed certs for detection
      }),
    }),
    axios.head(httpUrl, config),
  ]);

  // Check if HTTPS succeeded
  if (httpsResult.status === "fulfilled") {
    return true;
  }

  // Check if HTTP succeeded
  if (httpResult.status === "fulfilled") {
    return false;
  }

  // Both failed
  throw new SiteIsDownError();
}

/**
 *
 * @param {Site} site
 * @param {import("../types.js").ScanOptions} [options]
 */
export async function urls(site, options = {}) {
  if (site.port === undefined) {
    await validHostname(site.hostname);
  }
  return {
    http: url(site, false, options),
    https: url(site, true, options),
  };
}

/**
 *
 * @param {Site} site
 * @param {boolean} [https]
 * @param {import("../types.js").ScanOptions} options
 * @returns
 */
function url(site, https = true, options = {}) {
  let port = (https ? options.httpsPort : options.httpPort) ?? "";
  if (site.port !== undefined) {
    port = site.port;
  }
  port = port === "" ? "" : `:${port}`;
  const url = new URL(
    `${https ? "https" : "http"}://${site.hostname}${port}${site.path ?? ""}`
  );
  return url;
}
