import { CROSS_ORIGIN_RESOURCE_POLICY } from "../../headers.js";
import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";
import { getFirstHttpHeader } from "../utils.js";

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
  output.result = Expectation.CrossOriginResourcePolicyNotImplemented;

  const resp = requests.responses.auto;
  if (!resp) {
    return output;
  }

  const httpHeader = getFirstHttpHeader(resp, CROSS_ORIGIN_RESOURCE_POLICY);
  const equivHeaders =
    resp.httpEquiv?.get(CROSS_ORIGIN_RESOURCE_POLICY) ?? null;

  // Store whether the header or the meta tag were present
  output.http = !!httpHeader;
  output.meta = equivHeaders ? equivHeaders.length > 0 : false;

  // If it is both a header and a http-equiv, http-equiv has precedence (last value)
  let corpHeader;
  if (output.http && httpHeader) {
    corpHeader = httpHeader.slice(0, 256).trim().toLowerCase();
  } else if (output.meta) {
    // const headers = resp.httpEquiv?.get("cross-origin-resource-policy");
    if (equivHeaders && equivHeaders.length) {
      corpHeader = equivHeaders[equivHeaders.length - 1]
        .slice(0, 256)
        .trim()
        .toLowerCase();
    }
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
  ].includes(output.result ?? "");

  return output;
}
