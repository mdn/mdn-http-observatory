import { describe, it, beforeEach } from "node:test";
import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { Expectation } from "../src/types.js";
import { crossOriginOpenerPolicyTest } from "../src/analyzer/tests/cross-origin-opener-policy.js";

describe("Cross Origin Opener Policy", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("checks for missing", function () {
    const result = crossOriginOpenerPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoopNotImplemented);
    assert.isTrue(result.pass);
  });

  it("checks header validity", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-opener-policy"] = "whimsy";
    const result = crossOriginOpenerPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoopHeaderInvalid);
    assert.isFalse(result.pass);
  });

  it("checks for same-origin", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-opener-policy"] = "same-origin";
    const result = crossOriginOpenerPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoopImplementedWithSameOrigin);
    assert.isTrue(result.pass);
  });

  it("checks for same-origin-allow-popups", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-opener-policy"] =
      "same-origin-allow-popups";
    const result = crossOriginOpenerPolicyTest(reqs);
    assert.equal(
      result.result,
      Expectation.CoopImplementedWithSameOriginAllowPopups
    );
    assert.isTrue(result.pass);
  });

  it("checks for noopener-allow-popups", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-opener-policy"] =
      "noopener-allow-popups";
    const result = crossOriginOpenerPolicyTest(reqs);
    assert.equal(
      result.result,
      Expectation.CoopImplementedWithNoopenerAllowPopups
    );
    assert.isTrue(result.pass);
  });

  it("checks for unsafe-none", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-opener-policy"] = "unsafe-none";
    const result = crossOriginOpenerPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoopImplementedWithUnsafeNone);
    assert.isTrue(result.pass);
  });
});
