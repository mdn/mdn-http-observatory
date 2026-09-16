import { CROSS_ORIGIN_OPENER_POLICY } from "../../headers.js";
import { BaseOutput, Expectation } from "../../types.js";
import { getHttpHeaders, parseStructuredFieldToken } from "../utils.js";

/** @import { Requests } from "../../types.js" */

export class CrossOriginOpenerPolicyOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;
  http = false;
  static name = "cross-origin-opener-policy";
  static title = "Cross Origin Opener Policy";
  static possibleResults = [
    Expectation.CoopNotImplemented,
    Expectation.CoopImplementedWithSameOrigin,
    Expectation.CoopImplementedWithSameOriginAllowPopups,
    Expectation.CoopImplementedWithNoopenerAllowPopups,
    Expectation.CoopImplementedWithUnsafeNone,
    Expectation.CoopHeaderInvalid,
  ];
}

/**
 * @param {Requests} requests
 * @param {Expectation} expectation
 * @returns {CrossOriginOpenerPolicyOutput}
 */
export function crossOriginOpenerPolicyTest(
  requests,
  expectation = Expectation.CoopNotImplemented
) {
  const output = new CrossOriginOpenerPolicyOutput(expectation);
  output.result = Expectation.CoopNotImplemented;

  const resp = requests.responses.auto;
  if (!resp) {
    return output;
  }

  const httpHeaders = getHttpHeaders(resp, CROSS_ORIGIN_OPENER_POLICY);
  const [httpHeader] = httpHeaders;
  output.http = httpHeaders.length > 0;

  if (httpHeaders.length > 1) {
    output.result = Expectation.CoopHeaderInvalid;
  } else if (httpHeader) {
    const headerValue = httpHeader.slice(0, 1024).trim();
    output.data = headerValue;

    const policy = parseStructuredFieldToken(headerValue);

    switch (policy) {
      case "same-origin": {
        output.result = Expectation.CoopImplementedWithSameOrigin;

        break;
      }
      case "same-origin-allow-popups": {
        output.result = Expectation.CoopImplementedWithSameOriginAllowPopups;

        break;
      }
      case "noopener-allow-popups": {
        output.result = Expectation.CoopImplementedWithNoopenerAllowPopups;

        break;
      }
      case "unsafe-none": {
        output.result = Expectation.CoopImplementedWithUnsafeNone;

        break;
      }
      default: {
        output.result = Expectation.CoopHeaderInvalid;
      }
    }
  }

  output.pass = [
    expectation,
    Expectation.CoopNotImplemented,
    Expectation.CoopImplementedWithSameOrigin,
    Expectation.CoopImplementedWithSameOriginAllowPopups,
    Expectation.CoopImplementedWithNoopenerAllowPopups,
    Expectation.CoopImplementedWithUnsafeNone,
  ].includes(output.result ?? "");

  return output;
}
