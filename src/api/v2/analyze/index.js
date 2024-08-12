import { CONFIG } from "../../../config.js";
import { selectScanLatestScanByHost } from "../../../database/repository.js";
import { SCHEMAS } from "../schemas.js";
import {
  checkHostname,
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
    async (request, reply) => {
      const query =
        /** @type {import("../../v2/schemas.js").AnalyzeReqQuery} */ (
          request.query
        );
      let hostname = query.host.trim().toLowerCase();
      hostname = await checkHostname(hostname);
      return await scanOrReturnRecent(
        fastify,
        pool,
        hostname,
        CONFIG.api.cacheTimeForGet
      );
    }
  );

  fastify.post(
    "/analyze",
    { schema: SCHEMAS.analyzePost },
    async (request, reply) => {
      const query =
        /** @type {import("../../v2/schemas.js").AnalyzeReqQuery} */ (
          request.query
        );
      let hostname = query.host.trim().toLowerCase();
      hostname = await checkHostname(hostname);
      return await scanOrReturnRecent(
        fastify,
        pool,
        hostname,
        CONFIG.api.cooldown
      );
    }
  );
}

/**
 *
 * @param {import("fastify").FastifyInstance} fastify
 * @param {Pool} pool
 * @param {string} hostname
 * @param {number} age
 * @returns {Promise<any>}
 */
async function scanOrReturnRecent(fastify, pool, hostname, age) {
  let scanRow = await selectScanLatestScanByHost(pool, hostname, age);
  if (!scanRow) {
    // do a rescan
    fastify.log.info("Rescanning because no recent scan could be found");
    scanRow = await executeScan(pool, hostname);
  } else {
    fastify.log.info("Returning a recent scan result");
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
