import { CONFIG } from "../../../config.js";
import {
  ensureSite,
  insertScan,
  insertTestResults,
  ScanState,
  selectScanLatestScanByHost,
  selectScanRecentScan,
  updateScanState,
} from "../../../database/repository.js";
import { scan } from "../../../scanner/index.js";
import { Policy } from "../../../types.js";
import { NotFoundError, ScanFailedError } from "../../errors.js";
import { PolicyResponse, SCHEMAS } from "../schemas.js";
import {
  checkHostname,
  historyForSite,
  hydrateTests,
  testsForScan,
} from "../utils.js";

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

      const scanRow = await selectScanLatestScanByHost(pool, hostname);

      if (!scanRow) {
        throw new NotFoundError();
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

      // Ensure we have the site in the database
      const siteId = await ensureSite(pool, hostname);

      // Next, let's see if there's a recent scan; if there was a recent scan,
      // let's just return it
      let scanRow = await selectScanRecentScan(
        pool,
        siteId,
        CONFIG.api.cooldown
      );

      // If no existing scan found, let's scan
      if (!scanRow) {
        scanRow = await insertScan(pool, siteId);
        const scanId = scanRow.id;
        let scanResult;
        try {
          scanResult = await scan(hostname);
        } catch (e) {
          await updateScanState(pool, scanId, ScanState.FAILED, e.message);
          throw new ScanFailedError(e);
        }
        scanRow = await insertTestResults(pool, siteId, scanId, scanResult);
      }

      const scanId = scanRow.id;
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
  );
}
