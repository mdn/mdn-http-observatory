import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { xFrameOptionsTest } from "../src/analyzer/tests/x-frame-options.js";
import { Expectation } from "../src/types.js";

describe("X-Frame-Options", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests("test_content_sri_no_scripts.html");
  });

  it("checks for missing", function () {
    const result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsNotImplemented);
    assert.isFalse(result.pass);
  });

  it("checks validity", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["x-frame-options"] = "whimsy";
    let result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsHeaderInvalid);
    assert.isFalse(result.pass);

    // common to see this header sent multiple times
    reqs.responses.auto.headers["x-frame-options"] = "SAMEORIGIN, SAMEORIGIN";
    result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsHeaderInvalid);
    assert.isFalse(result.pass);
  });

  it("checks allow from origin", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["x-frame-options"] =
      "ALLOW-FROM https://mozilla.org";
    const result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsAllowFromOrigin);
    assert.isTrue(result.pass);
  });

  it("checks deny", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["x-frame-options"] = "DENY";
    let result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsSameoriginOrDeny);
    assert.isTrue(result.pass);

    reqs.responses.auto.headers["x-frame-options"] = "DENY ";
    result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsSameoriginOrDeny);
    assert.isTrue(result.pass);
  });

  it("checks implemented via CSP", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["x-frame-options"] = "DENY";
    reqs.responses.auto.headers["content-security-policy"] =
      "frame-ancestors https://mozilla.org";
    const result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsImplementedViaCsp);
    assert.isTrue(result.pass);
  });

  it("does not obey x-frame-options in meta equiv tags", function () {
    reqs = emptyRequests("test_parse_http_equiv_headers_x_frame_options.html");
    const result = xFrameOptionsTest(reqs);
    assert.equal(result.result, Expectation.XFrameOptionsNotImplemented);
    assert.isFalse(result.pass);
  });
});
