import {
  ACCESS_CONTROL_ALLOW_CREDENTIALS,
  ACCESS_CONTROL_ALLOW_ORIGIN,
  ORIGIN,
} from "../../headers.js";
import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";
import { getFirstHttpHeader, getHttpHeaders } from "../utils.js";

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
  const accessControlAllowOrigin = requests.responses.cors;

  const acaoHeader = getFirstHttpHeader(
    accessControlAllowOrigin,
    ACCESS_CONTROL_ALLOW_ORIGIN
  );
  const originHeader = getFirstHttpHeader(
    accessControlAllowOrigin?.request,
    ORIGIN
  );
  const credentialsHeader = getFirstHttpHeader(
    accessControlAllowOrigin,
    ACCESS_CONTROL_ALLOW_CREDENTIALS
  );

  if (accessControlAllowOrigin && acaoHeader) {
    output.data = acaoHeader.slice(0, 256).trim().toLowerCase();
    if (output.data === "*") {
      output.result =
        Expectation.CrossOriginResourceSharingImplementedWithPublicAccess;
    } else if (
      originHeader &&
      acaoHeader &&
      originHeader === acaoHeader &&
      credentialsHeader &&
      credentialsHeader.toLowerCase().trim() === "true"
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
