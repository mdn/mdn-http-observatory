import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { Expectation } from "../src/types.js";
import { crossOriginResourceSharingTest } from "../src/analyzer/tests/cors.js";

describe("Cross Origin Resource Sharing", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("checks for not implemented", function () {
    const result = crossOriginResourceSharingTest(reqs);
    assert.equal(
      result.result,
      Expectation.CrossOriginResourceSharingNotImplemented
    );
    assert.isTrue(result.pass);
  });

  it("checks for public access", function () {
    assert.isNotNull(reqs.responses.cors);
    reqs.responses.cors.headers["access-control-allow-origin"] = "*";
    const result = crossOriginResourceSharingTest(reqs);
    assert.equal(
      result.result,
      Expectation.CrossOriginResourceSharingImplementedWithPublicAccess
    );
    assert.equal(result.data, "*");
    assert.isTrue(result.pass);
  });

  it("checks for restricted access", function () {
    assert.isNotNull(reqs.responses.cors);
    reqs.responses.cors.request.headers["origin"] =
      "https://http-observatory.security.mozilla.org";
    reqs.responses.cors.headers["access-control-allow-origin"] =
      "https://mozilla.org";

    const result = crossOriginResourceSharingTest(reqs);
    assert.equal(
      result.result,
      Expectation.CrossOriginResourceSharingImplementedWithRestrictedAccess
    );
    assert.isTrue(result.pass);
  });

  it("checks for universal access", function () {
    assert.isNotNull(reqs.responses.cors);
    reqs.responses.cors.request.headers["origin"] =
      "https://http-observatory.security.mozilla.org";
    reqs.responses.cors.headers["access-control-allow-origin"] =
      "https://http-observatory.security.mozilla.org";
    reqs.responses.cors.headers["access-control-allow-credentials"] = "true";

    const result = crossOriginResourceSharingTest(reqs);
    assert.equal(
      result.result,
      Expectation.CrossOriginResourceSharingImplementedWithUniversalAccess
    );
    assert.isFalse(result.pass);
  });
});
