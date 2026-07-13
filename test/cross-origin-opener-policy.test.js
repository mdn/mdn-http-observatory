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

  const invalidHeaders = {
    "an unknown policy": "whimsy",
    "a quoted string": '"same-origin"',
    "a capitalized policy": "Same-Origin",
    "an uppercased policy": "SAME-ORIGIN",
    "a malformed structured field": "same-origin; report-to=coop endpoint",
  };
  for (const [description, value] of Object.entries(invalidHeaders)) {
    it(`rejects ${description}`, function () {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["cross-origin-opener-policy"] = value;
      const result = crossOriginOpenerPolicyTest(reqs);
      assert.equal(result.result, Expectation.CoopHeaderInvalid);
      assert.isFalse(result.pass);
    });
  }

  const validHeaders = [
    ["same-origin", Expectation.CoopImplementedWithSameOrigin],
    [
      "same-origin-allow-popups",
      Expectation.CoopImplementedWithSameOriginAllowPopups,
    ],
    [
      "noopener-allow-popups",
      Expectation.CoopImplementedWithNoopenerAllowPopups,
    ],
    ["unsafe-none", Expectation.CoopImplementedWithUnsafeNone],
    [
      'same-origin; report-to="coop-endpoint"',
      Expectation.CoopImplementedWithSameOrigin,
    ],
    [
      'same-origin-allow-popups; report-to="coop-endpoint"',
      Expectation.CoopImplementedWithSameOriginAllowPopups,
    ],
    // Note: An invalid report-to parameter doesn't invalidate the whole header.
    ["same-origin; report-to", Expectation.CoopImplementedWithSameOrigin],
  ];
  for (const [value, expected] of validHeaders) {
    it(`accepts ${value}`, function () {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["cross-origin-opener-policy"] = value;
      const result = crossOriginOpenerPolicyTest(reqs);
      assert.equal(result.result, expected);
      assert.isTrue(result.pass);
    });
  }

  it("checks for multiple headers", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-opener-policy"] = [
      "same-origin",
      "unsafe-none",
    ];
    const result = crossOriginOpenerPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoopHeaderInvalid);
    assert.isFalse(result.pass);
  });
});
