import { CONFIG } from "../../../config.js";
import { selectScanLatestScanByHost } from "../../../database/repository.js";
import { Site } from "../../../site.js";
import { SCHEMAS } from "../schemas.js";
import {
  checkSitename,
  executeScan,
  historyForSite,
  hydrateTests,
  testsForScan,
} from "../utils.js";

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
  fastify.get(
    "/analyze",
    { schema: SCHEMAS.analyzeGet },
    async (request, _reply) => {
      const query =
        /** @type {import("../../v2/schemas.js").AnalyzeReqQuery} */ (
          request.query
        );
      const hostname = query.host.trim().toLowerCase();
      let site = Site.fromSiteString(hostname);
      site = await checkSitename(site);
      return await scanOrReturnRecent(
        fastify,
        pool,
        site,
        CONFIG.api.cacheTimeForGet
      );
    }
  );

  fastify.post(
    "/analyze",
    { schema: SCHEMAS.analyzePost },
    async (request, _reply) => {
      const query =
        /** @type {import("../../v2/schemas.js").AnalyzeReqQuery} */ (
          request.query
        );
      const hostname = query.host.trim().toLowerCase();
      let site = Site.fromSiteString(hostname);
      site = await checkSitename(site);
      return await scanOrReturnRecent(fastify, pool, site, CONFIG.api.cooldown);
    }
  );
}

/**
 *
 * @param {import("fastify").FastifyInstance} _fastify
 * @param {Pool} pool
 * @param {import("../../../site.js").Site} site
 * @param {number} age
 * @returns {Promise<any>}
 */
async function scanOrReturnRecent(_fastify, pool, site, age) {
  let scanRow = await selectScanLatestScanByHost(pool, site.asSiteKey(), age);
  if (!scanRow) {
    // do a rescan
    scanRow = await executeScan(pool, site);
  }
  const scanId = scanRow.id;
  const siteId = scanRow.site_id;

  const [rawTests, history] = await Promise.all([
    testsForScan(pool, scanId),
    historyForSite(pool, siteId),
  ]);
  const tests = hydrateTests(rawTests);
  scanRow.scanned_at = scanRow.start_time;

  return {
    scan: scanRow,
    tests,
    history,
  };
}
