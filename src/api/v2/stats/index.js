import { selectGradeDistribution } from "../../../database/repository.js";
import { SCHEMAS } from "../schemas.js";

/**
 * Register the API - default export
 * @param {import('fastify').FastifyInstance} fastify
 * @returns {Promise<void>}
 */
export default async function (fastify) {
  const pool = fastify.pg.pool;

  fastify.get(
    "/grade_distribution",
    { schema: SCHEMAS.gradeDistribution },
    async (request, reply) => {
      const res = await selectGradeDistribution(pool);
      return res;
    }
  );
}
