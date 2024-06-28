import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";

export class CrossOriginResourcePolicyOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;
  http = false;
  meta = false;
  static name = "cross-origin-resource-policy";
  static title = "Cross Origin Resource Policy";
  static possibleResults = [
    Expectation.CrossOriginResourcePolicyNotImplemented,
    Expectation.CrossOriginResourcePolicyImplementedWithSameOrigin,
    Expectation.CrossOriginResourcePolicyImplementedWithSameSite,
    Expectation.CrossOriginResourcePolicyImplementedWithCrossOrigin,
    Expectation.CrossOriginResourcePolicyHeaderInvalid,
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
 * @returns {CrossOriginResourcePolicyOutput}
 */
export function crossOriginResourcePolicyTest(
  requests,
  expectation = Expectation.CrossOriginResourcePolicyImplementedWithSameSite
) {
  const output = new CrossOriginResourcePolicyOutput(expectation);
  const resp = requests.responses.auto;

  output.result = Expectation.CrossOriginResourcePolicyNotImplemented;

  // Store whether the header or the meta tag were present
  output.http = !!resp.headers["cross-origin-resource-policy"];
  output.meta = !!resp.httpEquiv?.get("cross-origin-resource-policy");

  // If it is both a header and a http-equiv, http-equiv has precedence (last value)
  let corpHeader;
  if (output.http) {
    corpHeader = resp.headers["cross-origin-resource-policy"]
      .slice(0, 256)
      .trim()
      .toLowerCase();
  } else if (output.meta) {
    const headers = resp.httpEquiv.get("cross-origin-resource-policy");
    corpHeader = headers[headers.length - 1].slice(0, 256).trim().toLowerCase();
  }

  if (corpHeader) {
    output.data = corpHeader;
    if (corpHeader === "same-site") {
      output.result =
        Expectation.CrossOriginResourcePolicyImplementedWithSameSite;
    } else if (corpHeader === "same-origin") {
      output.result =
        Expectation.CrossOriginResourcePolicyImplementedWithSameOrigin;
    } else if (corpHeader === "cross-origin") {
      output.result =
        Expectation.CrossOriginResourcePolicyImplementedWithCrossOrigin;
    } else {
      output.result = Expectation.CrossOriginResourcePolicyHeaderInvalid;
    }
  }

  // Check to see if the test passed or failed
  output.pass = [
    expectation,
    Expectation.CrossOriginResourcePolicyNotImplemented,
    Expectation.CrossOriginResourcePolicyImplementedWithSameSite,
    Expectation.CrossOriginResourcePolicyImplementedWithSameOrigin,
    Expectation.CrossOriginResourcePolicyImplementedWithCrossOrigin,
  ].includes(output.result);

  return output;
}
