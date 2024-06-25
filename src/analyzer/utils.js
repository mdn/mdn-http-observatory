import { Expectation } from "../types.js";

/**
 * Return the new result if it's worse than the existing result, otherwise just the current result.
 * @param {Expectation} newResult - The new result to compare.
 * @param {Expectation} oldResult - The existing result to compare against.
 * @param {Expectation[]} order - An array defining the order of results from best to worst.
 * @returns {Expectation} - The worse of the two results.
 */
export function onlyIfWorse(newResult, oldResult, order) {
  if (!oldResult) {
    return newResult;
  } else if (order.indexOf(newResult) > order.indexOf(oldResult)) {
    return newResult;
  } else {
    return oldResult;
  }
}
