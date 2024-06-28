import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";
import { contentSecurityPolicyTest } from "./csp.js";

export class XFrameOptionsOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;
  static name = "x-frame-options";
  static title = "X-Frame-Options";
  static possibleResults = [
    Expectation.XFrameOptionsImplementedViaCsp,
    Expectation.XFrameOptionsSameoriginOrDeny,
    Expectation.XFrameOptionsAllowFromOrigin,
    Expectation.XFrameOptionsNotImplemented,
    Expectation.XFrameOptionsHeaderInvalid,
  ];

  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
  }
}

/**
 *
 * @param {Requests} requests
 * @param {Expectation} expectation
 * @returns {XFrameOptionsOutput}
 */
export function xFrameOptionsTest(
  requests,
  expectation = Expectation.XFrameOptionsSameoriginOrDeny
) {
  const output = new XFrameOptionsOutput(expectation);
  const resp = requests.responses.auto;

  if (resp.headers["x-frame-options"]) {
    output.data = resp.headers["x-frame-options"].slice(0, 1024);
    const xfo = output.data.trim().toLowerCase();
    if (["deny", "sameorigin"].includes(xfo)) {
      output.result = Expectation.XFrameOptionsSameoriginOrDeny;
    } else if (xfo.startsWith("allow-from")) {
      output.result = Expectation.XFrameOptionsAllowFromOrigin;
    } else {
      output.result = Expectation.XFrameOptionsHeaderInvalid;
    }
  } else {
    output.result = Expectation.XFrameOptionsNotImplemented;
  }

  // Check to see if frame-ancestors is implemented in CSP; if it is, then it isn't needed
  const csp = contentSecurityPolicyTest(requests);
  if (csp.data && csp.data["frame-ancestors"]) {
    output.result = Expectation.XFrameOptionsImplementedViaCsp;
  }

  // Check to see if the test passed or failed

  if (
    [
      Expectation.XFrameOptionsAllowFromOrigin,
      Expectation.XFrameOptionsSameoriginOrDeny,
      Expectation.XFrameOptionsImplementedViaCsp,
      expectation,
    ].includes(output.result)
  ) {
    output.pass = true;
  }
  return output;
}
