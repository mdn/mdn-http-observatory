import { ALL_RESULTS, ALL_TESTS } from "../../../constants.js";
import { SCORE_TABLE, TEST_TOPIC_LINKS } from "../../../grader/charts.js";
import { SCHEMAS } from "../schemas.js";

/**
 * Register the API - default export
 * @param {import('fastify').FastifyInstance} fastify
 * @returns {Promise<void>}
 */
export default async function (fastify) {
  const pool = fastify.pg.pool;

  fastify.get(
    "/recommendation_matrix",
    { schema: SCHEMAS.recommendationMatrix },
    async (request, reply) => {
      const res = ALL_RESULTS.map((output) => {
        return {
          name: output.name,
          title: output.title,
          mdnLink: TEST_TOPIC_LINKS.get(output.name) || "",
          results: output.possibleResults.map((pr) => {
            const data = SCORE_TABLE.get(pr);
            return data
              ? {
                  name: pr,
                  scoreModifier: data.modifier,
                  description: data.description,
                  recommendation: data.recommendation,
                }
              : {
                  name: pr,
                  scoreModifier: 0,
                  description: "",
                  recommendation: "",
                };
          }),
        };
      });
      return res;
    }
  );
}
