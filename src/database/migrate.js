import Postgrator from "postgrator";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createPool } from "./repository.js";

const MIGRATION_PATTERN = path.join(
  dirname(fileURLToPath(import.meta.url)),
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
    const _appliedMigrations = await postgrator.migrate(version);
  } catch (e) {
    console.error(e);
  } finally {
    if (owned_pool) {
      await pool.end();
    }
  }
}
