import { CROSS_ORIGIN_RESOURCE_POLICY } from "../../headers.js";
import { BaseOutput } from "../../types.js";
/** @import { Requests } from "../../types.js" */
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
  /** @type {string | undefined}  */
  let corpHeader;
  if (output.http && httpHeader) {
    corpHeader = httpHeader.slice(0, 256).trim().toLowerCase();
  } else if (
    output.meta &&
    equivHeaders &&
    Array.isArray(equivHeaders) &&
    equivHeaders.length > 0
  ) {
    const h = equivHeaders.at(-1);
    if (h) {
      corpHeader = h.slice(0, 256).trim().toLowerCase();
    }
  }

  if (corpHeader) {
    output.data = corpHeader;
    switch (corpHeader) {
      case "same-site": {
        output.result =
          Expectation.CrossOriginResourcePolicyImplementedWithSameSite;

        break;
      }
      case "same-origin": {
        output.result =
          Expectation.CrossOriginResourcePolicyImplementedWithSameOrigin;

        break;
      }
      case "cross-origin": {
        output.result =
          Expectation.CrossOriginResourcePolicyImplementedWithCrossOrigin;

        break;
      }
      default: {
        output.result = Expectation.CrossOriginResourcePolicyHeaderInvalid;
      }
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
