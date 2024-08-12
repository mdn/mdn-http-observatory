import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { Expectation } from "../src/types.js";
import { referrerPolicyTest } from "../src/analyzer/tests/referrer-policy.js";

describe("ReferrerPolicy", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;

  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("checks for private referrer header", function () {
    const privValues = [
      "no-referrer",
      "same-origin",
      "strict-origin",
      "STRICT-ORIGIN",
      "strict-origin-when-cross-origin",
    ];
    assert.isNotNull(reqs.responses.auto);
    for (const v of privValues) {
      reqs.responses.auto.headers["Referrer-Policy"] = v;
      const result = referrerPolicyTest(reqs);
      assert.equal(result.result, Expectation.ReferrerPolicyPrivate);
      assert.isTrue(result.http);
      assert.isFalse(result.meta);
      assert.isTrue(result.pass);
    }

    {
      // Test with a meta/http-equiv header
      reqs = emptyRequests("test_parse_http_equiv_headers_referrer1.html");
      const result = referrerPolicyTest(reqs);
      assert.equal(result.result, Expectation.ReferrerPolicyPrivate);
      assert.equal(result.data, "no-referrer, same-origin");
      assert.isFalse(result.http);
      assert.isTrue(result.meta);
      assert.isTrue(result.pass);
    }

    {
      // The meta/http-equiv header has precendence over the http header
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["referrer-policy"] = "unsafe-url";
      const result = referrerPolicyTest(reqs);
      assert.equal(result.result, Expectation.ReferrerPolicyPrivate);
      assert.equal(result.data, "unsafe-url, no-referrer, same-origin");
      assert.isTrue(result.http);
      assert.isTrue(result.meta);
      assert.isTrue(result.pass);
    }
  });

  it("checks for missing referrer header", function () {
    const result = referrerPolicyTest(reqs);
    assert.equal(result.result, Expectation.ReferrerPolicyNotImplemented);
    assert.isTrue(result.pass);
  });

  it("checks for invalid referrer header", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["referrer-policy"] = "whimsy";
    const result = referrerPolicyTest(reqs);
    assert.equal(result.result, Expectation.ReferrerPolicyHeaderInvalid);
    assert.isFalse(result.pass);
  });

  it("checks for unsafe referrer header", function () {
    const policies = ["origin", "origin-when-cross-origin", "unsafe-url"];
    for (const policy of policies) {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["referrer-policy"] = policy;
      const result = referrerPolicyTest(reqs);
      assert.equal(result.result, Expectation.ReferrerPolicyUnsafe);
      assert.isFalse(result.pass);
    }
  });

  it("checks for multiple valid referrer headers", function () {
    const valid_but_unsafe_policies = [
      "origin-when-cross-origin, no-referrer, unsafe-url", // safe middle value
      "no-referrer, unsafe-url", // safe first value
    ];
    for (const policy of valid_but_unsafe_policies) {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["referrer-policy"] = policy;
      const result = referrerPolicyTest(reqs);
      assert.equal(result.result, Expectation.ReferrerPolicyUnsafe);
      assert.isFalse(result.pass);
    }
  });

  it("checks for multiple referrer headers with valid and invalid mixed", function () {
    const mixed_valid_invalid_policies = ["no-referrer, whimsy"];
    for (const policy of mixed_valid_invalid_policies) {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["referrer-policy"] = policy;
      const result = referrerPolicyTest(reqs);
      assert.equal(result.result, Expectation.ReferrerPolicyPrivate);
      assert.isTrue(result.pass);
    }
  });

  it("checks for multiple invalid referrer headers", function () {
    const invalid_policies = ["whimsy, whimsy1, whimsy2"];
    for (const policy of invalid_policies) {
      assert.isNotNull(reqs.responses.auto);
      reqs.responses.auto.headers["referrer-policy"] = policy;
      const result = referrerPolicyTest(reqs);
      assert.equal(result.result, Expectation.ReferrerPolicyHeaderInvalid);
      assert.isFalse(result.pass);
    }
  });
});
