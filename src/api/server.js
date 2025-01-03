import Fastify from "fastify";
import simpleFormPlugin from "fastify-simple-form";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { init as initSentry, setupFastifyErrorHandler } from "@sentry/node";

// import analyzeApiV1 from "./v1/analyze/index.js";
import analyzeApiV2 from "./v2/analyze/index.js";
import scanApiV2 from "./v2/scan/index.js";
import statsApiV2 from "./v2/stats/index.js";
import recommendationMatrixApiV2 from "./v2/recommendations/index.js";
import version from "./version/index.js";
import globalErrorHandler from "./global-error-handler.js";
import pool from "@fastify/postgres";
import { poolOptions } from "../database/repository.js";
import { CONFIG } from "../config.js";

if (CONFIG.sentry.dsn) {
  initSentry({
    dsn: CONFIG.sentry.dsn,
  });
}

/**
 * Creates a Fastify server instance
 * @returns {Promise<import("fastify").FastifyInstance>}
 */
export async function createServer() {
  const server = Fastify({
    logger: CONFIG.api.enableLogging,
  });

  if (CONFIG.sentry.dsn) {
    setupFastifyErrorHandler(server);
  }

  // @ts-ignore
  server.register(simpleFormPlugin);
  await server.register(cors, {
    origin: "*",
    methods: ["GET", "OPTIONS", "HEAD", "POST"],
    maxAge: 86400,
  });
  await server.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAnchestors: ["'none'"],
      },
    },

    hsts: {
      maxAge: 63072000,
      includeSubDomains: false,
    },
    frameguard: {
      action: "deny",
    },
    xXssProtection: true,
    referrerPolicy: {
      policy: "no-referrer",
    },
  });
  server.register(pool, poolOptions);
  server.setErrorHandler(globalErrorHandler);

  server.get("/", {}, async (_request, _reply) => {
    return "Welcome to the MDN Observatory!";
  });

  // await Promise.all([server.register(analyzeApiV1, { prefix: "/api/v1" })]);
  await Promise.all([
    server.register(analyzeApiV2, { prefix: "/api/v2" }),
    server.register(scanApiV2, { prefix: "/api/v2" }),
    server.register(statsApiV2, { prefix: "/api/v2" }),
    server.register(recommendationMatrixApiV2, { prefix: "/api/v2" }),
    server.register(version, { prefix: "/api/v2" }),
  ]);

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, async () => {
      await server.close();
      process.exit(0);
    });
  });

  return server;
}
