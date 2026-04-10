import { CROSS_ORIGIN_EMBEDDER_POLICY } from "../../headers.js";
import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";
import { getFirstHttpHeader } from "../utils.js";

export class CrossOriginEmbedderPolicyOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;
  http = false;
  static name = "cross-origin-embedder-policy";
  static title = "Cross Origin Embedder Policy";
  static possibleResults = [
    Expectation.CoepNotImplemented,
    Expectation.CoepImplementedWithRequireCorp,
    Expectation.CoepImplementedWithCredentialless,
    Expectation.CoepImplementedWithUnsafeNone,
    Expectation.CoepHeaderInvalid,
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
 * @returns {CrossOriginEmbedderPolicyOutput}
 */
export function crossOriginEmbedderPolicyTest(
  requests,
  expectation = Expectation.CoepNotImplemented
) {
  const output = new CrossOriginEmbedderPolicyOutput(expectation);
  output.result = Expectation.CoepNotImplemented;

  const resp = requests.responses.auto;
  if (!resp) {
    return output;
  }

  const httpHeader = getFirstHttpHeader(resp, CROSS_ORIGIN_EMBEDDER_POLICY);
  output.http = !!httpHeader;

  if (httpHeader) {
    const headerValue = httpHeader.slice(0, 256).trim().toLowerCase();
    output.data = headerValue;

    if (headerValue === "require-corp") {
      output.result = Expectation.CoepImplementedWithRequireCorp;
    } else if (headerValue === "credentialless") {
      output.result = Expectation.CoepImplementedWithCredentialless;
    } else if (headerValue === "unsafe-none") {
      output.result = Expectation.CoepImplementedWithUnsafeNone;
    } else {
      output.result = Expectation.CoepHeaderInvalid;
    }
  }

  output.pass = [
    expectation,
    Expectation.CoepNotImplemented,
    Expectation.CoepImplementedWithRequireCorp,
    Expectation.CoepImplementedWithCredentialless,
    Expectation.CoepImplementedWithUnsafeNone,
  ].includes(output.result ?? "");

  return output;
}
