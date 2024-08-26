import convict from "convict";

const SCHEMA = {
  retriever: {
    retrieverUserAgent: {
      doc: "The user agent to use for retriever requests.",
      format: "String",
      default:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:129.0) Gecko/20100101 Firefox/129.0 Observatory/129.0",
      env: "RETRIEVER_USER_AGENT",
    },
    corsOrigin: {
      doc: "The CORS origin to use for CORS origin retriever requests.",
      format: "String",
      default: "https://http-observatory.security.mozilla.org",
      env: "CORS_ORIGIN",
    },
    abortTimeout: {
      doc: "The overall timeout for a request, in ms",
      format: "Number",
      default: 10000,
      env: "ABORT_TIMEOUT",
    },
    clientTimeout: {
      doc: "The timeout once the request has been sent, in ms",
      format: "Number",
      default: 9000,
      env: "CLIENT_TIMEOUT",
    },
  },
  database: {
    database: {
      doc: "The name of the database to use",
      format: "String",
      default: "httpobservatory",
      env: "PGDATABASE",
    },
    host: {
      doc: "The database server hostname",
      format: "String",
      default: "localhost",
      env: "PGHOST",
    },
    user: {
      doc: "Database username",
      format: "String",
      default: "postgres",
      env: "PGUSER",
    },
    pass: {
      doc: "Database password",
      format: "String",
      default: "",
      sensitive: true,
      env: "PGPASSWORD",
    },
    port: {
      doc: "The port of the database service",
      format: "port",
      default: 5432,
      env: "PGPORT",
    },
    sslmode: {
      doc: "Database SSL mode",
      format: "Boolean",
      default: false,
      env: "PGSSLMODE",
    },
  },
  api: {
    cooldown: {
      doc: "Cached result time for API V2, in Seconds. Defaults to 1 minute",
      format: "nat",
      default: 60,
      env: "HTTPOBS_API_COOLDOWN",
    },
    cacheTimeForGet: {
      doc: "Maximum scan age a GET request returns before initiating a new scan, in seconds. Defaults to 24 hours.",
      format: "nat",
      default: 86400,
      env: "HTTPOBS_API_GET_CACHE",
    },
    port: {
      doc: "The port to bind to",
      format: "Number",
      default: 8080,
      env: "HTTPOBS_API_PORT",
    },
    enableLogging: {
      doc: "Enable server logging",
      format: "Boolean",
      default: true,
      env: "HTTPOBS_ENABLE_LOGGING",
    },
  },
  sentry: {
    dsn: {
      doc: "The Sentry data source name (DSN) to use for error reporting.",
      format: "String",
      default: "",
      env: "SENTRY_DSN",
    },
  },
};

/**
 *
 * @param {string | undefined} configFile
 * @returns
 */
export function load(configFile) {
  const configuration = convict(SCHEMA);
  try {
    if (configFile) {
      configuration.loadFile(configFile);
    }
    configuration.validate({ allowed: "strict" });
    return configuration.getProperties();
  } catch (e) {
    throw new Error(`error reading config: ${e}`);
  }
}

export const CONFIG = load(process.env["CONFIG_FILE"]);
