import { Site } from "../site.js";

/**
 *
 * @param {Site} site
 * @param {import("../types.js").Options} [options]
 */
export function urls(site, options = {}) {
  return {
    http: url(site, false, options),
    https: url(site, true, options),
  };
}

/**
 *
 * @param {Site} site
 * @param {boolean} [https]
 * @param {import("../types.js").Options} options
 * @returns
 */
function url(site, https = true, options = {}) {
  let port = (https ? options.httpsPort : options.httpPort) ?? "";
  port = port === "" ? "" : `:${port}`;
  const url = new URL(
    `${https ? "https" : "http"}://${site}${port}${options.path ?? ""}`
  );
  return url;
}
