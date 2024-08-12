import { CONFIG } from "../../../config.js";
import {
  ensureSite,
  insertScan,
  insertTestResults,
  ScanState,
  selectScanLatestScanByHost,
  updateScanState,
} from "../../../database/repository.js";
import { scan } from "../../../scanner/index.js";
import { ScanFailedError } from "../../errors.js";
import { SCHEMAS } from "../schemas.js";
import {
  checkHostname,
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
 * @param {Pool} pool
 * @param {string} hostname
 * @returns {Promise<import("../../../database/repository.js").ScanRow>}
 */
async function executeScan(pool, hostname) {
  const siteId = await ensureSite(pool, hostname);
  let scanRow = await insertScan(pool, siteId);
  const scanId = scanRow.id;
  let scanResult;
  try {
    scanResult = await scan(hostname);
  } catch (e) {
    if (e instanceof Error) {
      await updateScanState(pool, scanId, ScanState.FAILED, e.message);
      throw new ScanFailedError(e);
    } else {
      const unknownError = new Error("Unknown error occurred");
      await updateScanState(
        pool,
        scanId,
        ScanState.FAILED,
        unknownError.message
      );
      throw new ScanFailedError(unknownError);
    }
  }
  scanRow = await insertTestResults(pool, siteId, scanId, scanResult);
  return scanRow;
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
