import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import("../types.js").Hsts | null}
 */
let hstsMap = null;

/**
 * @returns {import("../types.js").Hsts}
 */
export function hsts() {
  if (!hstsMap) {
    const filePath = path.join(
      dirname,
      "..",
      "..",
      "conf",
      "hsts-preload.json"
    );
    hstsMap = new Map(
      Object.entries(JSON.parse(fs.readFileSync(filePath, "utf8")))
    );
  }
  return hstsMap;
}

/**
 *
 * @param {string} hostname
 * @returns {import("../types.js").Hst | null}
 */
export function isHstsPreloaded(hostname) {
  const h = hsts();

  // Check if the hostname is in the HSTS list with the right mode
  const existing = h.get(hostname);
  if (existing && existing.mode === "force-https") {
    return existing;
  }

  // Either the hostname is in the list *or* the TLD is and includeSubDomains is true
  const hostParts = hostname.split(".");
  const levels = hostParts.length;

  // If hostname is foo.bar.baz.mozilla.org, check bar.baz.mozilla.org,
  // baz.mozilla.org, mozilla.org, and.org
  for (hostParts.shift(); hostParts.length > 0; hostParts.shift()) {
    const domain = hostParts.join(".");
    const exist = h.get(domain);
    if (exist && exist.mode === "force-https" && exist.includeSubDomains) {
      return exist;
    }
  }
  return null;
}
