/**
 *
 * @param {string} hostname
 * @param {import("../types.js").Options} [options]
 */
export function urls(hostname, options = {}) {
  return {
    http: url(hostname, false, options),
    https: url(hostname, true, options),
  };
}

/**
 *
 * @param {string} hostname
 * @param {boolean} [https]
 * @param {import("../types.js").Options} options
 * @returns
 */
function url(hostname, https = true, options = {}) {
  let port = (https ? options.httpsPort : options.httpPort) ?? "";
  port = port === "" ? "" : `:${port}`;
  const url = new URL(
    `${https ? "https" : "http"}://${hostname}${port}${options.path ?? ""}`
  );
  return url;
}
