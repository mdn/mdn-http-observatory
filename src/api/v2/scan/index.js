import { CONFIG } from "../../../config.js";
import { selectScanLatestScanByHost as selectScanLatestScanBySite } from "../../../database/repository.js";
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
    let siteString = query.host.trim();
    siteString = await checkSitename(siteString);
    return await scanOrReturnRecent(
      fastify,
      pool,
      siteString,
      CONFIG.api.cooldown
    );
  });
}

/**
 *
 * @param {import("fastify").FastifyInstance} fastify
 * @param {Pool} pool
 * @param {string} site
 * @param {number} age
 * @returns {Promise<any>}
 */
async function scanOrReturnRecent(fastify, pool, site, age) {
  let scanRow = await selectScanLatestScanBySite(pool, site, age);
  if (!scanRow) {
    // do a rescan
    fastify.log.info("Rescanning because no recent scan could be found");
    scanRow = await executeScan(pool, site);
  } else {
    fastify.log.info("Returning a recent scan result");
  }
  scanRow.scanned_at = scanRow.start_time;
  const siteLink = `https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(site)}`;
  return { details_url: siteLink, ...scanRow };
}
