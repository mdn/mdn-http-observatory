import { version } from "tough-cookie";
import { SCHEMAS } from "../v2/schemas.js";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "..", "..", "package.json"),
    "utf8"
  )
);

/**
 * Register the API - default export
 * @param {import('fastify').FastifyInstance} fastify
 * @returns {Promise<void>}
 */
export default async function (fastify) {
  const pool = fastify.pg.pool;

  fastify.get(
    "/version",
    { schema: SCHEMAS.version },
    async (request, reply) => {
      /** @type {import("../../types.js").VersionResponse} */
      const ret = {
        version: packageJson.version,
        commit: process.env.GIT_SHA || "unknown",
        source: "https://github.com/mdn/mdn-http-observatory",
        build: process.env.RUN_ID || "unknown",
      };
      return ret;
    }
  );
}
