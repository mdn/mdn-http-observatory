import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { Expectation } from "../src/types.js";
import { crossOriginResourcePolicyTest } from "../src/analyzer/tests/cross-origin-resource-policy.js";

describe("Cross Origin Resource Policy", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("checks for missing", function () {
    const result = crossOriginResourcePolicyTest(reqs);
    assert.equal(
      result.result,
      Expectation.CrossOriginResourcePolicyNotImplemented
    );
    assert.isTrue(result.pass);
  });

  it("checks header validity", function () {
    const values = ["whimsy"];
    assert.isNotNull(reqs.responses.auto);
    for (const value of values) {
      reqs.responses.auto.headers["cross-origin-resource-policy"] = value;
      const result = crossOriginResourcePolicyTest(reqs);
      assert.equal(
        result.result,
        Expectation.CrossOriginResourcePolicyHeaderInvalid
      );
      assert.isFalse(result.pass);
    }
  });

  it("checks for same-site", function () {
    const values = ["same-site"];
    assert.isNotNull(reqs.responses.auto);
    for (const value of values) {
      reqs.responses.auto.headers["cross-origin-resource-policy"] = value;
      const result = crossOriginResourcePolicyTest(reqs);
      assert.equal(
        result.result,
        Expectation.CrossOriginResourcePolicyImplementedWithSameSite
      );
      assert.isTrue(result.pass);
    }
  });
  it("checks for same-origin", function () {
    const values = ["same-origin"];
    assert.isNotNull(reqs.responses.auto);
    for (const value of values) {
      reqs.responses.auto.headers["cross-origin-resource-policy"] = value;
      const result = crossOriginResourcePolicyTest(reqs);
      assert.equal(
        result.result,
        Expectation.CrossOriginResourcePolicyImplementedWithSameOrigin
      );
      assert.isTrue(result.pass);
    }
  });
  it("checks for cross-origin", function () {
    const values = ["cross-origin"];
    assert.isNotNull(reqs.responses.auto);
    for (const value of values) {
      reqs.responses.auto.headers["cross-origin-resource-policy"] = value;
      const result = crossOriginResourcePolicyTest(reqs);
      assert.equal(
        result.result,
        Expectation.CrossOriginResourcePolicyImplementedWithCrossOrigin
      );
      assert.isTrue(result.pass);
    }
  });
});
