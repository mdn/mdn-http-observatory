import path from "node:path";
import { fileURLToPath } from "node:url";

import Postgrator from "postgrator";

import { createPool } from "./repository.js";

const MIGRATION_PATTERN = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "migrations",
  "*"
);

/**
 * @typedef {import("pg").Pool} Pool
 */

/**
 *
 * @param {string} version
 * @param {Pool} [pool]
 */
export async function migrateDatabase(version, pool) {
  const owned_pool = !pool;
  if (owned_pool) {
    pool = createPool();
  }
  if (!pool) {
    throw new Error("Pool is invalid");
  }

  try {
    const postgrator = new Postgrator({
      migrationPattern: MIGRATION_PATTERN,
      driver: "pg",
      execQuery: (query) => pool.query(query),
    });
    await postgrator.migrate(version);
  } catch (error) {
    console.error(error);
  } finally {
    if (owned_pool) {
      await pool.end();
    }
  }
}
