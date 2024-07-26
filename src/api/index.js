import { CONFIG } from "../config.js";
import { migrateDatabase } from "../database/migrate.js";
import { createServer } from "./server.js";

async function main() {
  const server = await createServer();
  try {
    await server.listen({
      host: "0.0.0.0",
      port: CONFIG.api.port,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
