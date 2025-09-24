import { selectGradeDistribution } from "../../../database/repository.js";
import { SCHEMAS } from "../schemas.js";

/**
 * Register the API - default export
 * @param {import('fastify').FastifyInstance} fastify
 * @returns {Promise<void>}
 */
export default async function (fastify) {
  fastify.get(
    "/grade_distribution",
    { schema: SCHEMAS.gradeDistribution },
    async (_request, _reply) => {
      const res = await selectGradeDistribution(fastify.pg.pool);
      return res;
    }
  );
}
