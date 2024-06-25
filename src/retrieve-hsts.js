import axios from "axios";
import { writeFile } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HSTS_URL = new URL(
  "https://raw.githubusercontent.com/chromium/chromium/main/net/http/transport_security_state_static.json"
);

const SCANNER_PINNED_DOMAINS = [
  "accounts.firefox.com",
  "addons.mozilla.org",
  "aus4.mozilla.org",
  "aus5.mozilla.org",
  "cdn.mozilla.org",
  "services.mozilla.com",
];

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 *
 * @typedef {Object} RawData
 * @property {RawEntry[]} entries
 * @typedef {Object} RawEntry
 * @property {string} name
 * @property {string} policy
 * @property {string} mode
 * @property {string} [include_subdomains]
 * @property {string} [include_subdomains_for_pinning]
 * @typedef {Object} HstsEntry
 * @property {boolean} includeSubDomains
 * @property {boolean} includeSubDomainsForPinning
 * @property {string} mode
 * @property {boolean} pinned
 * @typedef {{ [key: string]: HstsEntry }} HstsMap
 */

/**
 * Download the Google HSTS preload list
 * @returns
 */
async function retrieveAndStoreHsts() {
  let r;
  try {
    r = await axios.get(HSTS_URL.href);
  } catch (error) {
    console.error("Error getting data:", error);
    return;
  }
  const data = removeJsonComments(r.data);
  /** @type RawData */
  const rawData = JSON.parse(data);

  const hstsMap = rawData.entries.reduce((acc, entry) => {
    const domain = entry.name.trim().toLowerCase();
    acc[domain] = {
      includeSubDomains: !!entry.include_subdomains,
      includeSubDomainsForPinning:
        !!entry.include_subdomains || !!entry.include_subdomains_for_pinning,
      mode: entry.mode,
      // Add in the manually pinned domains
      pinned: SCANNER_PINNED_DOMAINS.includes(domain),
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
  return jsonString.replace(/\/\/.*$/gm, "");
}

await retrieveAndStoreHsts();
