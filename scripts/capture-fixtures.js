import fs from "node:fs";
import path from "node:path";
import { retrieve } from "../src/retriever/retriever.js";
import { scan } from "../src/scanner/index.js";
import { Site } from "../src/site.js";

/**
 * Serializes an axios response object to a plain JSON-serializable object
 * @param {import("../src/types.js").Response|null} response
 * @returns {object|null}
 */
function serializeResponse(response) {
  if (!response) {
    return null;
  }

  return {
    headers: Object.fromEntries(response.headers || {}),
    status: response.status,
    statusText: response.statusText,
    verified: response.verified,
    data: response.data || "",
    httpEquiv: response.httpEquiv ? Object.fromEntries(response.httpEquiv) : {},
  };
}

/**
 * Serializes redirect chain to plain objects
 * @param {Array<{url: URL, status: number}>} redirects
 * @returns {Array<{url: string, status: number}>}
 */
function serializeRedirects(redirects) {
  if (!redirects || !Array.isArray(redirects)) {
    return [];
  }
  return redirects.map((r) => ({
    url: r.url.href,
    status: r.status,
  }));
}

/**
 * Captures HTTP responses for a domain and saves as fixture
 * @param {string} domain
 */
async function captureFixture(domain) {
  console.log(`\nCapturing fixture for ${domain}...`);

  const site = Site.fromSiteString(domain);

  // Retrieve full HTTP response data
  console.log(`  Retrieving HTTP responses...`);
  const requests = await retrieve(site);

  // Run scan to get results (for metadata/documentation)
  console.log(`  Running security scan...`);
  const scanResult = await scan(site);

  // Build fixture object
  const fixture = {
    capturedAt: new Date().toISOString(),
    site: {
      hostname: site.hostname,
      port: site.port || null,
      path: site.path || null,
    },
    responses: {
      auto: serializeResponse(requests.responses.auto),
      http: serializeResponse(requests.responses.http),
      https: serializeResponse(requests.responses.https),
      cors: serializeResponse(requests.responses.cors),
      httpRedirects: serializeRedirects(requests.responses.httpRedirects),
      httpsRedirects: serializeRedirects(requests.responses.httpsRedirects),
    },
    resources: {
      path: requests.resources.path || "",
    },
    session: {
      url: requests.session?.url.href,
    },
  };

  // Write to fixture file
  const fixtureName = domain.replace(/\./g, "-");
  const fixturePath = path.join("test", "fixtures", `${fixtureName}.json`);

  console.log(`  Writing to ${fixturePath}...`);
  fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2), "utf8");

  console.log(
    `  ✓ Captured: Grade ${scanResult.scan.grade}, Score ${scanResult.scan.score}`
  );
}

/**
 * Main capture script
 */
async function main() {
  console.log("=== Capturing HTTP Observatory Test Fixtures ===");

  const domains = ["mozilla.org", "observatory.mozilla.org"];

  for (const domain of domains) {
    try {
      await captureFixture(domain);
    } catch (error) {
      console.error(
        `  ✗ Error capturing ${domain}:`,
        Error.isError(error) ? error.message : error
      );
      process.exit(1);
    }
  }

  console.log("\n✓ All fixtures captured successfully!");
  console.log(
    "\nNext steps:\n  1. Review changes: git diff test/fixtures/\n  2. Update test assertions if needed\n  3. Run tests: npm test test/scanner.test.js"
  );
}

main();
