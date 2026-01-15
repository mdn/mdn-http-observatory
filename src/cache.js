import path from "node:path";
import os from "node:os";
import fs from "node:fs";

import { retrieveAndStoreCABundle } from "./ca-bundle.js";
import { retrieveAndStoreHsts } from "./hsts.js";
import { retrieveAndStoreTldList } from "./tld-list.js";

const CACHE_DIR = path.join(os.homedir(), ".cache", "mdn-http-observatory");
export const CA_BUNDLE_PATH = path.join(CACHE_DIR, "mozilla.ca-bundle");
export const HSTS_PRELOAD_PATH = path.join(CACHE_DIR, "hsts-preload.json");
export const TLD_LIST_PATH = path.join(CACHE_DIR, "tld-list.json");

/**
 * Setup the cache.
 *
 * Create `~/.config/mdn-http-observatory` if it doesn't exist.
 * Only download files if they don't exist in the cache directory.
 */
export async function setupCache() {
  setupCacheDirectory();

  const promises = [];
  if (!fs.existsSync(CA_BUNDLE_PATH)) {
    promises.push(retrieveAndStoreCABundle(CA_BUNDLE_PATH));
  }
  if (!fs.existsSync(HSTS_PRELOAD_PATH)) {
    promises.push(retrieveAndStoreHsts(HSTS_PRELOAD_PATH));
  }
  if (!fs.existsSync(TLD_LIST_PATH)) {
    promises.push(retrieveAndStoreTldList(TLD_LIST_PATH));
  }

  // Download at the same time
  await Promise.all(promises);
}

/**
 * Forcibly refresh cache.
 *
 * Downloading all files even if they are already present in the cache
 * directory.
 */
export async function refreshCache() {
  setupCacheDirectory();

  await Promise.all([
    retrieveAndStoreCABundle(CA_BUNDLE_PATH),
    retrieveAndStoreHsts(HSTS_PRELOAD_PATH),
    retrieveAndStoreTldList(TLD_LIST_PATH),
  ]);
}

function setupCacheDirectory() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR);
    }
  } catch (err) {
    console.error(err);
  }
}

// Refresh cache when this file is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  refreshCache().catch(console.error);
}
