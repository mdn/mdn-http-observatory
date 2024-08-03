import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { Expectation } from "../src/types.js";
import { xContentTypeOptionsTest } from "../src/analyzer/tests/x-content-type-options.js";

describe("X-Content-Type-Options", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("checks for missing", function () {
    const result = xContentTypeOptionsTest(reqs);
    assert.equal(result.result, Expectation.XContentTypeOptionsNotImplemented);
    assert.isFalse(result.pass);
  });

  it("checks header validity", function () {
    const values = ["whimsy", "nosniff, nosniff"];
    assert.isNotNull(reqs.responses.auto);
    for (const value of values) {
      reqs.responses.auto.headers["x-content-type-options"] = value;
      const result = xContentTypeOptionsTest(reqs);
      assert.equal(result.result, Expectation.XContentTypeOptionsHeaderInvalid);
      assert.isFalse(result.pass);
    }
  });

  it("checks for nosniff", function () {
    const values = ["nosniff", "nosniff "];
    assert.isNotNull(reqs.responses.auto);
    for (const value of values) {
      reqs.responses.auto.headers["x-content-type-options"] = value;
      const result = xContentTypeOptionsTest(reqs);
      assert.equal(result.result, Expectation.XContentTypeOptionsNosniff);
      assert.isTrue(result.pass);
    }
  });
});
