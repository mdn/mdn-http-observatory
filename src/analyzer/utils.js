import { Expectation } from "../types.js";

/**
 * Return the new result if it's worse than the existing result, otherwise just the current result.
 * @param {Expectation} newResult - The new result to compare.
 * @param {Expectation | null} oldResult - The existing result to compare against.
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

/**
 * @param {import("../types.js").Response | null} response
 * @param {string} name
 * @returns {string[]}
 */
export function getHttpHeaders(response, name) {
  if (!response) {
    return [];
  }
  const axiosHeaders = response.headers;
  if (!axiosHeaders) {
    return [];
  }
  const lcName = name.toLowerCase();
  const headers = Object.entries(axiosHeaders)
    .filter(([headerName, _value]) => {
      return headerName.toLowerCase() === lcName;
    })
    .map(([_headerName, value]) => value)
    .flat();
  return headers;
}

/**
 * @param {import("../types.js").Response | null} response
 * @param {string} name
 * @returns {string | null}
 */
export function getFirstHttpHeader(response, name) {
  if (!response) {
    return null;
  }
  return getHttpHeaders(response, name)[0] ?? null;
}
