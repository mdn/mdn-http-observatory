import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";

export class CorsOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;
  static name = "cross-origin-resource-sharing";
  static title = "Cross Origin Resource Sharing (CORS)";
  static possibleResults = [
    Expectation.CrossOriginResourceSharingNotImplemented,
    Expectation.CrossOriginResourceSharingImplementedWithPublicAccess,
    Expectation.CrossOriginResourceSharingImplementedWithRestrictedAccess,
    Expectation.CrossOriginResourceSharingImplementedWithUniversalAccess,
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
 * @returns {CorsOutput}
 */
export function crossOriginResourceSharingTest(
  requests,
  expectation = Expectation.CrossOriginResourceSharingNotImplemented
) {
  const output = new CorsOutput(expectation);
  output.result = Expectation.CrossOriginResourceSharingNotImplemented;
  const resp = requests.responses.auto;
  const accessControlAllowOrigin = requests.responses.cors;

  if (
    accessControlAllowOrigin &&
    accessControlAllowOrigin.headers["access-control-allow-origin"]
  ) {
    output.data = accessControlAllowOrigin.headers[
      "access-control-allow-origin"
    ]
      .slice(0, 256)
      .trim()
      .toLowerCase();
    if (output.data === "*") {
      output.result =
        Expectation.CrossOriginResourceSharingImplementedWithPublicAccess;
    } else if (
      accessControlAllowOrigin.request?.headers?.["origin"] ===
        accessControlAllowOrigin.headers["access-control-allow-origin"] &&
      accessControlAllowOrigin.headers["access-control-allow-credentials"] &&
      accessControlAllowOrigin.headers["access-control-allow-credentials"]
        .toLowerCase()
        .trim() === "true"
    ) {
      output.result =
        Expectation.CrossOriginResourceSharingImplementedWithUniversalAccess;
    } else {
      output.result =
        Expectation.CrossOriginResourceSharingImplementedWithRestrictedAccess;
    }
  }

  // Check to see if the test passed or failed
  if (
    [
      Expectation.CrossOriginResourceSharingImplementedWithPublicAccess,
      Expectation.CrossOriginResourceSharingImplementedWithRestrictedAccess,
      expectation,
    ].includes(output.result)
  ) {
    output.pass = true;
  }
  return output;
}
