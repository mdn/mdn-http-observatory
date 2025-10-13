import { CONFIG } from "../../../config.js";
import { selectScanLatestScanByHost as selectScanLatestScanBySite } from "../../../database/repository.js";
import { Site } from "../../../site.js";
import { SCHEMAS } from "../schemas.js";
import { checkSitename, executeScan } from "../utils.js";

/**
 * @typedef {import("pg").Pool} Pool
 */

/**
 * Register the API - default export
 * @param {import('fastify').FastifyInstance} fastify
 * @returns {Promise<void>}
 */
export default async function (fastify) {
  const pool = fastify.pg.pool;
  fastify.post("/scan", { schema: SCHEMAS.scan }, async (request, _reply) => {
    const query = /** @type {import("../../v2/schemas.js").ScanQuery} */ (
      request.query
    );

    const hostname = query.host.trim().toLowerCase();
    let site = Site.fromSiteString(hostname);
    site = await checkSitename(site);
    return await scanOrReturnRecent(fastify, pool, site, CONFIG.api.cooldown);
  });
}

/**
 *
 * @param {import("fastify").FastifyInstance} _fastify
 * @param {Pool} pool
 * @param {Site} site
 * @param {number} age
 * @returns {Promise<any>}
 */
async function scanOrReturnRecent(_fastify, pool, site, age) {
  let scanRow = await selectScanLatestScanBySite(pool, site.asSiteKey(), age);
  if (!scanRow) {
    // do a rescan
    scanRow = await executeScan(pool, site);
  }

  scanRow.scanned_at = scanRow.start_time;
  const siteLink = `https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(site.asSiteKey())}`;
  return { details_url: siteLink, ...scanRow };
}
