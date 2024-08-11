import { MINIMUM_SCORE_FOR_EXTRA_CREDIT } from "../grader/charts.js";
import {
  getGradeForScore,
  getScoreDescription,
  getScoreModifier,
} from "../grader/grader.js";
import { retrieve } from "../retriever/retriever.js";
import { ALGORITHM_VERSION } from "../constants.js";
import { NUM_TESTS } from "../constants.js";
import { ALL_TESTS } from "../constants.js";

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

  // We allow 2xx, 3xx, 401 and 403 status codes
  const { status } = r.responses.auto;
  if (status < 200 || (status >= 400 && ![401, 403].includes(status))) {
    throw new Error(
      `Site did respond with an unexpected HTTP status code ${status}.`
    );
  }

  // Run all the tests on the result
  /**  @type {Output[]} */
  const results = ALL_TESTS.map((test) => {
    return test(r);
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
    if (result.result) {
      result.scoreDescription = getScoreDescription(result.result);
      result.scoreModifier = getScoreModifier(result.result);
      testsPassed += result.pass ? 1 : 0;
      scoreWithExtraCredit += result.scoreModifier;
      if (result.scoreModifier < 0) {
        uncurvedScore += result.scoreModifier;
      }
    }
  });

  // Only record the full score if the uncurved score already receives an A
  const score =
    uncurvedScore >= MINIMUM_SCORE_FOR_EXTRA_CREDIT
      ? scoreWithExtraCredit
      : uncurvedScore;

  const final = getGradeForScore(score);

  const tests = results.reduce((obj, result) => {
    const name = result.constructor.name;
    obj[name] = result;
    return obj;
  }, /** @type {TestMap} */ ({}));

  return {
    scan: {
      algorithmVersion: ALGORITHM_VERSION,
      grade: final.grade,
      error: null,
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
