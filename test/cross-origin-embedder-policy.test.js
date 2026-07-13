import { describe, it, beforeEach } from "node:test";
import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { Expectation } from "../src/types.js";
import { crossOriginEmbedderPolicyTest } from "../src/analyzer/tests/cross-origin-embedder-policy.js";

describe("Cross Origin Embedder Policy", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("checks for missing", function () {
    const result = crossOriginEmbedderPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoepNotImplemented);
    assert.isTrue(result.pass);
  });

  const invalidHeaders = {
    "an unknown policy": "whimsy",
    "a quoted string": '"require-corp"',
    "a capitalized policy": "Require-Corp",
    "an uppercased policy": "REQUIRE-CORP",
    "a malformed structured field": "require-corp; report-to=coep endpoint",
  };
  for (const [description, value] of Object.entries(invalidHeaders)) {
    it(`rejects ${description}`, function () {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["cross-origin-embedder-policy"] = value;
      const result = crossOriginEmbedderPolicyTest(reqs);
      assert.equal(result.result, Expectation.CoepHeaderInvalid);
      assert.isFalse(result.pass);
    });
  }

  const validHeaders = [
    ["require-corp", Expectation.CoepImplementedWithRequireCorp],
    ["credentialless", Expectation.CoepImplementedWithCredentialless],
    ["unsafe-none", Expectation.CoepImplementedWithUnsafeNone],
    [
      'require-corp; report-to="coep-endpoint"',
      Expectation.CoepImplementedWithRequireCorp,
    ],
    [
      'credentialless; report-to="coep-endpoint"',
      Expectation.CoepImplementedWithCredentialless,
    ],
    // Note: An invalid report-to parameter doesn't invalidate the whole header.
    ["require-corp; report-to", Expectation.CoepImplementedWithRequireCorp],
  ];
  for (const [value, expected] of validHeaders) {
    it(`accepts ${value}`, function () {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["cross-origin-embedder-policy"] = value;
      const result = crossOriginEmbedderPolicyTest(reqs);
      assert.equal(result.result, expected);
      assert.isTrue(result.pass);
    });
  }

  it("checks for multiple headers", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-embedder-policy"] = [
      "require-corp",
      "unsafe-none",
    ];
    const result = crossOriginEmbedderPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoepHeaderInvalid);
    assert.isFalse(result.pass);
  });
});
