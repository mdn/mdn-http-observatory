import { STRICT_TRANSPORT_SECURITY } from "../../headers.js";
import { Requests, BaseOutput } from "../../types.js";
import { Expectation } from "../../types.js";
import { isHstsPreloaded } from "../hsts.js";
import { getHttpHeaders } from "../utils.js";
export class StrictTransportSecurityOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;
  includeSubDomains = false;
  /** @type {number | null} */
  maxAge = null;
  preload = false;
  preloaded = false;
  static name = "strict-transport-security";
  static title = "Strict Transport Security (HSTS)";
  static possibleResults = [
    Expectation.HstsPreloaded,
    Expectation.HstsImplementedMaxAgeAtLeastSixMonths,
    Expectation.HstsImplementedMaxAgeLessThanSixMonths,
    Expectation.HstsNotImplemented,
    Expectation.HstsHeaderInvalid,
    Expectation.HstsNotImplementedNoHttps,
    Expectation.HstsInvalidCert,
  ];
  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
  }
}

// 15768000 is six months, but a lot of sites use 15552000, so a white lie is in order
const SIX_MONTHS = 15552000;

/**
 *
 * @param {Requests} requests
 * @param {Expectation} expectation
 * @returns {StrictTransportSecurityOutput}
 */
export function strictTransportSecurityTest(
  requests,
  expectation = Expectation.HstsImplementedMaxAgeAtLeastSixMonths
) {
  const output = new StrictTransportSecurityOutput(expectation);
  output.result = Expectation.HstsNotImplemented;
  const response = requests.responses.https;
  if (!response) {
    // If there's no HTTPS, we can't have HSTS
    output.result = Expectation.HstsNotImplementedNoHttps;
  } else if (!response.verified) {
    // Also need a valid certificate chain for HSTS
    output.result = Expectation.HstsInvalidCert;
  } else if (getHttpHeaders(response, STRICT_TRANSPORT_SECURITY).length > 0) {
    const header = getHttpHeaders(response, STRICT_TRANSPORT_SECURITY)[0];
    output.data = header.slice(0, 1024); // code against malicious headers

    try {
      let sts = output.data.split(";").map((i) => i.trim().toLowerCase());
      // Throw an error if the header is set twice
      if (output.data.includes(",")) {
        throw new Error("Header set multiple times");
      }
      sts.forEach((parameter) => {
        if (parameter.startsWith("max-age=")) {
          // Use slice to get the part of the string after 'max-age='
          // Parse it to an integer. We're slicing up to 128 characters as a defense mechanism.
          output.maxAge = parseInt(parameter.slice(8, 128), 10);
        } else if (parameter === "includesubdomains") {
          output.includeSubDomains = true;
        } else if (parameter === "preload") {
          output.preload = true;
        }
      });
      if (output.maxAge !== null) {
        if (output.maxAge < SIX_MONTHS) {
          output.result = Expectation.HstsImplementedMaxAgeLessThanSixMonths;
        } else {
          output.result = Expectation.HstsImplementedMaxAgeAtLeastSixMonths;
        }
      } else {
        throw new Error("MaxAge missing");
      }
    } catch (e) {
      output.result = Expectation.HstsHeaderInvalid;
    }
  }

  // If they're in the preloaded list, this overrides most anything else
  if (response) {
    const preloaded = isHstsPreloaded(requests.hostname);
    if (preloaded) {
      output.result = Expectation.HstsPreloaded;
      output.includeSubDomains = preloaded.includeSubDomains;
      output.preloaded = true;
    }
  }
  // Check to see if the test passed or failed
  if (
    [
      Expectation.HstsImplementedMaxAgeAtLeastSixMonths,
      Expectation.HstsPreloaded,
      expectation,
    ].includes(output.result)
  ) {
    output.pass = true;
  }
  return output;
}
