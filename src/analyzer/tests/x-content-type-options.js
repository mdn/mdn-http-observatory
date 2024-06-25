import { BaseOutput, Expectation, Requests } from "../../types.js";

export class XContentTypeOptionsOutput extends BaseOutput {
  /** @type {string | null} */
  data = null;

  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
    this.name = "x-content-type-options";
    this.title = "X-Content-Type-Options";
  }
}

/**
 *
 * @param {Requests} requests
 * @param {Expectation} expectation
 * @returns {XContentTypeOptionsOutput}
 */
export function xContentTypeOptionsTest(
  requests,
  expectation = Expectation.XContentTypeOptionsNosniff
) {
  const output = new XContentTypeOptionsOutput(expectation);
  const resp = requests.responses.auto;

  if (resp.headers["x-content-type-options"]) {
    output.data = resp.headers["x-content-type-options"].slice(0, 256);
    if (output.data.trim().toLowerCase() === "nosniff") {
      output.result = Expectation.XContentTypeOptionsNosniff;
    } else {
      output.result = Expectation.XContentTypeOptionsHeaderInvalid;
    }
  } else {
    output.result = Expectation.XContentTypeOptionsNotImplemented;
  }

  // Check to see if the test passed or failed
  output.pass = output.result === expectation;
  return output;
}
