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

  it("checks header validity", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-embedder-policy"] = "whimsy";
    const result = crossOriginEmbedderPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoepHeaderInvalid);
    assert.isFalse(result.pass);
  });

  it("checks for require-corp", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-embedder-policy"] =
      "require-corp";
    const result = crossOriginEmbedderPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoepImplementedWithRequireCorp);
    assert.isTrue(result.pass);
  });

  it("checks for credentialless", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-embedder-policy"] =
      "credentialless";
    const result = crossOriginEmbedderPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoepImplementedWithCredentialless);
    assert.isTrue(result.pass);
  });

  it("checks for unsafe-none", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["cross-origin-embedder-policy"] = "unsafe-none";
    const result = crossOriginEmbedderPolicyTest(reqs);
    assert.equal(result.result, Expectation.CoepImplementedWithUnsafeNone);
    assert.isTrue(result.pass);
  });
});
