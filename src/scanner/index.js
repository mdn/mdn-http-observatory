import { cookiesTest } from "../analyzer/tests/cookies.js";
import { crossOriginResourceSharingTest } from "../analyzer/tests/cors.js";
import { crossOriginResourcePolicyTest } from "../analyzer/tests/cross-origin-resource-policy.js";
import { contentSecurityPolicyTest } from "../analyzer/tests/csp.js";
import { redirectionTest } from "../analyzer/tests/redirection.js";
import { referrerPolicyTest } from "../analyzer/tests/referrer-policy.js";
import { strictTransportSecurityTest } from "../analyzer/tests/strict-transport-security.js";
import { subresourceIntegrityTest } from "../analyzer/tests/subresource-integrity.js";
import { xContentTypeOptionsTest } from "../analyzer/tests/x-content-type-options.js";
import { xFrameOptionsTest } from "../analyzer/tests/x-frame-options.js";
import { MINIMUM_SCORE_FOR_EXTRA_CREDIT } from "../grader/charts.js";
import {
  getGradeAndLikelihoodForScore,
  getScoreDescription,
  getScoreModifier,
} from "../grader/grader.js";
import { retrieve } from "../retriever/retriever.js";
import { ALGORITHM_VERSION } from "../types.js";

const allTests = [
  contentSecurityPolicyTest,
  cookiesTest,
  crossOriginResourceSharingTest,
  redirectionTest,
  referrerPolicyTest,
  strictTransportSecurityTest,
  subresourceIntegrityTest,
  xContentTypeOptionsTest,
  xFrameOptionsTest,
  crossOriginResourcePolicyTest,
];

export const NUM_TESTS = allTests.length;

/**
 * @typedef {Object} Options
 */

/**
 * @typedef {import("../types.js").ScanResult} ScanResult
 * @typedef {import("../types.js").Output} Output
 * @typedef {import("../types.js").StringMap} StringMap
 * @typedef {import("../types.js").TestMap} TestMap
 */

/**
 * @param {string} hostname
 * @param {Options} [options]
 * @returns {Promise<ScanResult>}
 */
export async function scan(hostname, options) {
  let r = await retrieve(hostname);
  if (!r.responses.auto) {
    // We cannot connect at all, abort the test.
    throw new Error("The site seems to be down.");
  }

  if (r.responses.auto.status < 200 || r.responses.auto.status >= 300) {
    throw new Error("Site did not respond with a 2xx HTTP status code.");
  }

  // Run all the tests on the result
  /**  @type {Output[]} */
  const results = allTests.map((test) => {
    return test.apply(this, [r]);
  });

  /** @type {StringMap} */
  const responseHeaders = Object.entries(r.responses.auto.headers).reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    /** @type {StringMap} */ ({})
  );
  const statusCode = r.responses.auto.status;

  let testsPassed = 0;
  let scoreWithExtraCredit = 100;
  let uncurvedScore = scoreWithExtraCredit;

  results.forEach((result) => {
    result.scoreDescription = getScoreDescription(result.result);
    result.scoreModifier = getScoreModifier(result.result);
    testsPassed += result.pass ? 1 : 0;
    scoreWithExtraCredit += result.scoreModifier;
    if (result.scoreModifier < 0) {
      uncurvedScore += result.scoreModifier;
    }
  });

  // Only record the full score if the uncurved score already receives an A
  const score =
    uncurvedScore >= MINIMUM_SCORE_FOR_EXTRA_CREDIT
      ? scoreWithExtraCredit
      : uncurvedScore;

  const final = getGradeAndLikelihoodForScore(score);

  const tests = results.reduce((obj, result) => {
    const name = result.name;
    obj[name] = result;
    return obj;
  }, /** @type {TestMap} */ ({}));

  return {
    scan: {
      algorithmVersion: ALGORITHM_VERSION,
      grade: final.grade,
      error: null,
      likelihoodIndicator: final.likelihoodIndicator,
      score: final.score,
      statusCode: statusCode,
      testsFailed: NUM_TESTS - testsPassed,
      testsPassed: testsPassed,
      testsQuantity: NUM_TESTS,
      responseHeaders: responseHeaders,
    },
    tests,
  };
}
