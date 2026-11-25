import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import axios from "axios";

const HSTS_URL = new URL(
  "https://raw.githubusercontent.com/chromium/chromium/main/net/http/transport_security_state_static.json"
);

const SCANNER_PINNED_DOMAINS = new Set([
  "accounts.firefox.com",
  "addons.mozilla.org",
  "aus4.mozilla.org",
  "aus5.mozilla.org",
  "cdn.mozilla.org",
  "services.mozilla.com",
]);

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 *
 * @typedef {object} RawData
 * @property {RawEntry[]} entries
 * @typedef {object} RawEntry
 * @property {string} name
 * @property {string} policy
 * @property {string} mode
 * @property {string} [include_subdomains]
 * @property {string} [include_subdomains_for_pinning]
 * @typedef {object} HstsEntry
 * @property {boolean} includeSubDomains
 * @property {boolean} includeSubDomainsForPinning
 * @property {string} mode
 * @property {boolean} pinned
 * @typedef {{ [key: string]: HstsEntry }} HstsMap
 */

/**
 * @param {Record<string, string>} [headers]
 * @param {number} [maxRedirects]
 */
const get = (headers = {}, maxRedirects = 5) =>
  axios.get(HSTS_URL.href, { headers, maxRedirects });

/**
 * Fetch the raw list, authenticated if `GITHUB_TOKEN` is set to avoid 429s.
 * Falls back to an unauthenticated request if the token is rejected.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
async function fetchHsts() {
  const { GITHUB_TOKEN } = process.env;
  if (!GITHUB_TOKEN) {
    return get();
  }
  // Never follow redirects with the token, so it cannot reach another host.
  return get({ Authorization: `Bearer ${GITHUB_TOKEN}` }, 0).catch((error) => {
    if ([400, 401, 404].includes(error.response?.status)) {
      return get();
    }
    throw error;
  });
}

/**
 * Download the Google HSTS preload list
 * @returns
 */
export async function retrieveAndStoreHsts() {
  let r;
  try {
    r = await fetchHsts();
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : null;
    console.error(
      "Error getting data:",
      error instanceof Error ? error.message : error,
      status ?? ""
    );
    return;
  }
  const data = removeJsonComments(r.data);
  /** @type {RawData} */
  const rawData = JSON.parse(data);

  const hstsMap = rawData.entries.reduce((acc, entry) => {
    const domain = entry.name.trim().toLowerCase();
    acc[domain] = {
      includeSubDomains: !!entry.include_subdomains,
      includeSubDomainsForPinning:
        !!entry.include_subdomains || !!entry.include_subdomains_for_pinning,
      mode: entry.mode,
      // Add in the manually pinned domains
      pinned: SCANNER_PINNED_DOMAINS.has(domain),
    };
    return acc;
  }, /** @type {HstsMap} */ ({}));

  const filePath = path.join(dirname, "..", "conf", "hsts-preload.json");
  try {
    await writeFile(filePath, JSON.stringify(hstsMap, null, 2));
    console.log(`File written to ${filePath}`);
  } catch (error) {
    console.error("Error writing file:", error);
    return;
  }
}

/**
 *
 * @param {string} jsonString
 * @returns {string}
 */
function removeJsonComments(jsonString) {
  return jsonString.replaceAll(/\/\/.*$/gm, "");
}

// Execute when run directly
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  retrieveAndStoreHsts().catch(console.error);
}
