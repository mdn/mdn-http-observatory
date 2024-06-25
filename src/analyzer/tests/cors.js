import { BaseOutput, Expectation, Requests } from "../../types.js";

export class CorsOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;

  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
    this.name = "cross-origin-resource-sharing";
    this.title = "Cross Origin Resource Sharing (CORS)";
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
