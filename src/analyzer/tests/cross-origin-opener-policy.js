import { CROSS_ORIGIN_OPENER_POLICY } from "../../headers.js";
import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";
import { getHttpHeaders, parseStructuredFieldToken } from "../utils.js";

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

  /**
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
  }
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

    if (policy === "same-origin") {
      output.result = Expectation.CoopImplementedWithSameOrigin;
    } else if (policy === "same-origin-allow-popups") {
      output.result = Expectation.CoopImplementedWithSameOriginAllowPopups;
    } else if (policy === "noopener-allow-popups") {
      output.result = Expectation.CoopImplementedWithNoopenerAllowPopups;
    } else if (policy === "unsafe-none") {
      output.result = Expectation.CoopImplementedWithUnsafeNone;
    } else {
      output.result = Expectation.CoopHeaderInvalid;
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
