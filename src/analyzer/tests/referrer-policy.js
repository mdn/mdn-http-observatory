import { Requests, BaseOutput } from "../../types.js";
import { Expectation } from "../../types.js";
export class ReferrerOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;
  http = false;
  meta = false;
  static name = "referrer-policy";
  static title = "Referrer Policy";
  static possibleResults = [
    Expectation.ReferrerPolicyPrivate,
    Expectation.ReferrerPolicyNotImplemented,
    Expectation.ReferrerPolicyUnsafe,
    Expectation.ReferrerPolicyHeaderInvalid,
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
 * @returns {ReferrerOutput}
 */
export function referrerPolicyTest(
  requests,
  expectation = Expectation.ReferrerPolicyPrivate
) {
  const output = new ReferrerOutput(expectation);
  const goodness = [
    "no-referrer",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
  ];
  const badness = [
    "origin",
    "origin-when-cross-origin",
    "unsafe-url",
    "no-referrer-when-downgrade",
  ];
  const valid = goodness.concat(badness);

  const response = requests.responses.auto;

  // Store whether the header or the meta tag were present
  output.http = !!response.headers["referrer-policy"];
  output.meta = !!response.httpEquiv?.get("referrer-policy");

  // If it is both a header and a http-equiv, http-equiv has precedence (last value)
  if (output.http && output.meta) {
    output.data = [
      response.headers["referrer-policy"],
      response.httpEquiv?.get("referrer-policy")?.join(", "),
    ].join(", ");
  } else if (output.http) {
    output.data = response.headers["referrer-policy"];
  } else if (output.meta) {
    output.data = response.httpEquiv.get("referrer-policy").join(",");
  } else {
    output.result = Expectation.ReferrerPolicyNotImplemented;
    output.pass = true;
    return output;
  }

  // Find the last known valid policy value in the referrer policy
  let policy = output.data
    .split(",")
    .filter((e) => valid.includes(e.toLowerCase().trim()))
    .reverse()[0]
    ?.toLowerCase()
    .trim();

  if (goodness.includes(policy)) {
    output.result = Expectation.ReferrerPolicyPrivate;
  } else if (badness.includes(policy)) {
    output.result = Expectation.ReferrerPolicyUnsafe;
  } else {
    output.result = Expectation.ReferrerPolicyHeaderInvalid;
  }

  // Test if passed or fail
  output.pass = [
    Expectation.ReferrerPolicyPrivate,
    Expectation.ReferrerPolicyNotImplemented,
  ].includes(output.result);

  return output;
}
