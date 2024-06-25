import { selectScanById } from "../../../database/repository.js";
import { NotFoundError } from "../../errors.js";
import { SCHEMAS } from "../schemas.js";
import { hydrateTests, testsForScan } from "./../utils.js";

/**
 * Register the API - default export
 * @param {import('fastify').FastifyInstance} fastify
 * @returns {Promise<void>}
 */
export default async function (fastify) {
  const pool = fastify.pg.pool;

  fastify.get("/scan", { schema: SCHEMAS.scan }, async (request, reply) => {
    const query = /** @type {import("../../v2/schemas.js").ScanQuery} */ (
      request.query
    );
    const scanId = query.scan;
    const scanRow = await selectScanById(pool, scanId);

    if (!scanRow) {
      throw new NotFoundError();
    }
    const siteId = scanRow.site_id;
    const tests = hydrateTests(await testsForScan(pool, scanId));
    scanRow.scanned_at = scanRow.start_time;
    return {
      scan: scanRow,
      tests,
    };
  });
}
