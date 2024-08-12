import ip from "ip";
import dns from "node:dns";
import {
  InvalidHostNameError,
  InvalidHostNameIpError,
  InvalidHostNameLookupError,
  ScanFailedError,
} from "../errors.js";
import {
  ensureSite,
  insertScan,
  insertTestResults,
  ScanState,
  selectScanHostHistory,
  selectTestResults,
  updateScanState,
} from "../../database/repository.js";
import {
  getRecommendation,
  getScoreDescription,
  getTopicLink,
} from "../../grader/grader.js";
import { snakeCase } from "change-case";
import { PolicyResponse } from "./schemas.js";
import { Expectation } from "../../types.js";
import { TEST_TITLES } from "../../grader/charts.js";
import { scan } from "../../scanner/index.js";

/**
 *
 * @param {string} hostname
 * @returns {boolean}
 */
export function isIp(hostname) {
  if (ip.isV4Format(hostname)) return true;
  if (ip.isV6Format(hostname)) return true;
  return false;
}

/**
 * @typedef {Object} ValidHostnameResult
 * @property {string} [hostname]
 * @property {boolean} [isIpAddress]
 */

/**
 *
 * @param {string} hostname
 * @returns {Promise<string>} - The valid hostname, maybe prefixed with 'www.'
 * @throws {InvalidHostNameIpError | InvalidHostNameError}
 */
export async function validHostname(hostname) {
  // remove any trailing dot
  hostname = hostname.replace(/\.$/, "");
  if (
    !hostname.includes(".") ||
    hostname === "localhost" ||
    // RFC 2606
    hostname.endsWith(".test") ||
    hostname.endsWith(".example") ||
    hostname.endsWith(".invalid") ||
    hostname.endsWith(".localhost") ||
    // RFC 6761
    // We allow these as they are valid domains and may be useful.
    // hostname === "example.com" ||
    // hostname.endsWith(".example.com") ||
    // hostname === "example.net" ||
    // hostname.endsWith(".example.net") ||
    // hostname === "example.org" ||
    // hostname.endsWith(".example.org") ||
    // RFC 6762
    hostname.endsWith(".local") ||
    hostname === ""
  ) {
    throw new InvalidHostNameError();
  }

  // Check if we can look up the host
  await /** @type {Promise<void>} */ (
    new Promise((resolve, reject) => {
      dns.lookup(hostname, (err, address, family) => {
        if (err) {
          reject(new InvalidHostNameLookupError(hostname));
        }
        resolve();
      });
    })
  );

  return hostname;
}

/**
 *
 * @param {string} hostname
 * @returns {Promise<string>}
 */
export async function checkHostname(hostname) {
  if (isIp(hostname)) {
    throw new InvalidHostNameIpError();
  }

  // Try prefixing with `www.` if it fails on first try
  try {
    hostname = await validHostname(hostname);
  } catch (e) {
    if (e instanceof InvalidHostNameLookupError) {
      hostname = await validHostname(`www.${hostname}`);
    } else {
      throw e;
    }
  }
  return hostname;
}

/**
 * @typedef {import("pg").Pool} Pool
 */

/**
 * Return API-formatted test results for a single scan.
 * @param {number} scanId
 * @param {Pool} pool
 */
export async function testsForScan(pool, scanId) {
  const testRows = await selectTestResults(pool, scanId);
  const tests = testRows.reduce((acc, test) => {
    /** @type {any} */
    const value = {
      expectation: test.expectation,
      name: test.name,
      link: getTopicLink(test.name),
      title: getTitle(test.name),
      pass: test.pass,
      result: test.result,
      score_description: getScoreDescription(test.result),
      recommendation: getRecommendation(test.result),
      score_modifier: test.score_modifier,
    };
    // lift fields from the output JSON one level
    for (const [k, v] of Object.entries(test.output)) {
      // fix camelization
      const key = snakeCase(k);
      value[key] = v;
    }
    acc[test.name] = value;
    return acc;
  }, /** @type {any} */ ({}));
  return tests;
}

/**
 *
 * @param {string} name
 * @returns {string}
 */
function getTitle(name) {
  return TEST_TITLES[name] || name;
}

/**
 * @param {Pool} pool
 * @param {number} siteId
 */
export async function historyForSite(pool, siteId) {
  const historyRows = await selectScanHostHistory(pool, siteId);
  const history = historyRows.map((h) => {
    const id = h.id;
    return {
      id: h.id,
      grade: h.grade,
      score: h.score,
      scanned_at: h.end_time,
    };
  });
  return history;
}

/**
 * Massage test results for API responses, i.e. CSP info,
 * null ("not applicable") values for pass on some results.
 * @param {any} tests
 * @returns {any}
 */
export function hydrateTests(tests) {
  // hydrate the csp test policy with descriptions and info fields
  if (tests["content-security-policy"]?.policy) {
    const fatPolicy = new PolicyResponse(
      tests["content-security-policy"].policy
    );
    // dynamicStrict exception, set pass=null if false
    if (fatPolicy.strictDynamic.pass === false) {
      fatPolicy.strictDynamic.pass = null;
    }

    tests["content-security-policy"].policy = fatPolicy;
  }
  // For some tests whose pass flag is "not applicable", we
  // return null on the pass field.

  const noneResults = [
    Expectation.ReferrerPolicyNotImplemented,
    Expectation.SriNotImplementedResponseNotHtml,
    Expectation.SriNotImplementedButNoScriptsLoaded,
    Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
    Expectation.CookiesNotFound,
    Expectation.CrossOriginResourcePolicyNotImplemented,
  ];

  for (const [k, v] of Object.entries(tests)) {
    if (v.result && noneResults.includes(v.result)) {
      tests[k].pass = null;
    }
  }

  return tests;
}

/**
 *
 * @param {Pool} pool
 * @param {string} hostname
 * @returns {Promise<import("../../database/repository.js").ScanRow>}
 */
export async function executeScan(pool, hostname) {
  const siteId = await ensureSite(pool, hostname);
  let scanRow = await insertScan(pool, siteId);
  const scanId = scanRow.id;
  let scanResult;
  try {
    scanResult = await scan(hostname);
  } catch (e) {
    if (e instanceof Error) {
      await updateScanState(pool, scanId, ScanState.FAILED, e.message);
      throw new ScanFailedError(e);
    } else {
      const unknownError = new Error("Unknown error occurred");
      await updateScanState(
        pool,
        scanId,
        ScanState.FAILED,
        unknownError.message
      );
      throw new ScanFailedError(unknownError);
    }
  }
  scanRow = await insertTestResults(pool, siteId, scanId, scanResult);
  return scanRow;
}
