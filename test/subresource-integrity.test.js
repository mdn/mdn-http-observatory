import { beforeEach, describe, it } from "node:test";

import { assert } from "chai";

import { subresourceIntegrityTest } from "../src/analyzer/tests/subresource-integrity.js";
import { Expectation } from "../src/types.js";

import { emptyRequests } from "./helpers.js";

describe("Subresource Integrity", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests("test_content_sri_no_scripts.html");
  });

  it("checks for no scripts", function () {
    reqs = emptyRequests("test_content_sri_no_scripts.html");
    const result = subresourceIntegrityTest(reqs);
    assert.equal(result.result, "sri-not-implemented-but-no-scripts-loaded");
  });

  it("checks for not html", function () {
    reqs.resources.path = `{"foo": "bar"}`;
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.headers["content-type"] = "application/json";
    const result = subresourceIntegrityTest(reqs);
    assert.equal(result.result, Expectation.SriNotImplementedResponseNotHtml);
    assert.isTrue(result.pass);
  });

  it("checks for same origin", function () {
    // On the same origin with relative path
    reqs = emptyRequests("test_content_sri_sameorigin_relative.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);

    // On the same origin, but without a protocol
    reqs = emptyRequests("test_content_sri_sameorigin_noproto.html");
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);

    // On the same origin, but with https:// specified
    reqs = emptyRequests("test_content_sri_sameorigin_https.html");
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);

    // And the same, but with a 404 status code
    assert.isNotNull(reqs.responses.auto);
    reqs.responses.auto.status = 404;
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);
  });

  it("skips a src that fails to resolve instead of crashing", function () {
    // A malformed src like "//" cannot be resolved into a URL; it is not a
    // loadable sub-resource, so it must be skipped rather than throwing.
    reqs = emptyRequests("test_content_sri_malformed_src.html");
    const result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);
  });

  for (const { name, file, expected } of [
    {
      name: "treats a different subdomain as a distinct origin",
      file: "test_content_sri_cross_origin_subdomain.html",
      expected: Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
    },
    {
      name: "scores a cross-origin protocol-relative script as foreign",
      file: "test_content_sri_cross_origin_noproto.html",
      expected:
        Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
    },
  ]) {
    it(name, function () {
      reqs = emptyRequests(file);
      const result = subresourceIntegrityTest(reqs);
      assert.equal(result.result, expected);
      assert.isFalse(result.pass);
    });
  }

  it("derives the base origin from the final redirect", function () {
    // The www.mozilla.org script is foreign against the requested
    // mozilla.org origin, but same-origin once the page redirects to
    // www.mozilla.org, as the base origin follows the final served URL.
    reqs = emptyRequests("test_content_sri_www_subdomain.html");
    assert.isNotNull(reqs.session);
    reqs.session.redirectHistory = [
      { url: new URL("https://www.mozilla.org/"), status: 200 },
    ];
    const result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);
  });

  it("checks if implemented with external scripts and https", function () {
    // load from a remote site
    reqs = emptyRequests("test_content_sri_impl_external_https1.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriImplementedAndExternalScriptsLoadedSecurely
    );
    assert.isTrue(result.pass);

    // load from an intranet / localhost
    reqs = emptyRequests("test_content_sri_impl_external_https2.html");
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriImplementedAndExternalScriptsLoadedSecurely
    );
    assert.isTrue(result.pass);
  });

  it("checks if implemented with same origin", function () {
    reqs = emptyRequests("test_content_sri_impl_sameorigin.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriImplementedAndAllScriptsLoadedSecurely
    );
    assert.isTrue(result.pass);
  });

  it("checks if not implemented with external scripts and https", function () {
    reqs = emptyRequests("test_content_sri_notimpl_external_https.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButExternalScriptsLoadedSecurely
    );
    assert.isFalse(result.pass);
  });

  it("checks if implemented with external scripts and http", function () {
    reqs = emptyRequests("test_content_sri_impl_external_http.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriImplementedButExternalScriptsNotLoadedSecurely
    );
    assert.isFalse(result.pass);
  });

  it("checks if implemented with external scripts and no protocol", function () {
    reqs = emptyRequests("test_content_sri_impl_external_noproto.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriImplementedButExternalScriptsNotLoadedSecurely
    );
    assert.isFalse(result.pass);
  });

  it("checks if not implemented with external scripts and http", function () {
    reqs = emptyRequests("test_content_sri_notimpl_external_http.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely
    );
    assert.isFalse(result.pass);
  });

  it("checks if not implemented with external scripts and no protocol", function () {
    reqs = emptyRequests("test_content_sri_notimpl_external_noproto.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely
    );
    assert.isFalse(result.pass);
  });
});
