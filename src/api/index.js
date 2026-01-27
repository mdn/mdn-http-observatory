import { CONFIG } from "../config.js";
import { createServer } from "./server.js";
import { setupCache } from "../cache.js";

async function main() {
  await setupCache();

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
