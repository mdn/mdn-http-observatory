import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { strictTransportSecurityTest } from "../src/analyzer/tests/strict-transport-security.js";
import { Expectation } from "../src/types.js";

describe("Strict Transport Security", () => {
  /**
   * @type {import("../src/types.js").Requests}
   */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("missing", function () {
    const result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsNotImplemented);
    assert.isFalse(result.pass);
  });

  it("header invalid", function () {
    assert.isNotNull(reqs.responses.https);
    reqs.responses.https.headers["strict-transport-security"] =
      "includeSubDomains; preload";
    let result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsHeaderInvalid);
    assert.isFalse(result.pass);

    reqs.responses.https.headers["strict-transport-security"] =
      "max-age=15768000; includeSubDomains, max-age=15768000; includeSubDomains";
    result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsHeaderInvalid);
    assert.isFalse(result.pass);
  });

  it("no https", function () {
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["strict-transport-security"] =
      "max-age=15768000";
    assert.isNotNull(reqs.responses.http);
    reqs.responses.http.headers["strict-transport-security"] =
      "max-age=15768000";
    reqs.responses.https = null;

    const result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsNotImplementedNoHttps);
    assert.isFalse(result.pass);
  });

  it("invalid cert", function () {
    assert.isNotNull(reqs.responses.https);
    reqs.responses.https.headers["strict-transport-security"] =
      "max-age=15768000; includeSubDomains; preload";
    reqs.responses.https.verified = false;

    const result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsInvalidCert);
    assert.isFalse(result.pass);
  });

  it("max age too low", function () {
    assert.isNotNull(reqs.responses.https);
    reqs.responses.https.headers["Strict-Transport-Security"] = "max-age=86400";

    const result = strictTransportSecurityTest(reqs);
    assert.equal(
      result.result,
      Expectation.HstsImplementedMaxAgeLessThanSixMonths
    );
    assert.isFalse(result.pass);
  });

  it("implemented", function () {
    assert.isNotNull(reqs.responses.https);
    reqs.responses.https.headers["strict-transport-security"] =
      "max-age=15768000; includeSubDomains; preload";

    const result = strictTransportSecurityTest(reqs);
    assert.equal(
      result.result,
      Expectation.HstsImplementedMaxAgeAtLeastSixMonths
    );
    assert.equal(result.maxAge, 15768000);
    assert.isTrue(result.includeSubDomains);
    assert.isTrue(result.preload);
    assert.isTrue(result.pass);
  });

  it("preloaded", function () {
    reqs.hostname = "bugzilla.mozilla.org";
    let result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsPreloaded);
    assert.isTrue(result.includeSubDomains);
    assert.isTrue(result.pass);
    assert.isTrue(result.preloaded);

    reqs.hostname = "facebook.com";
    result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsPreloaded);
    assert.isFalse(result.includeSubDomains);
    assert.isTrue(result.pass);
    assert.isTrue(result.preloaded);

    reqs.hostname = "dropboxusercontent.com";
    result = strictTransportSecurityTest(reqs);
    assert.equal(result.result, Expectation.HstsNotImplemented);
    assert.isFalse(result.includeSubDomains);
    assert.isFalse(result.pass);
    assert.isFalse(result.preloaded);
  });
});
