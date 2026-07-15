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

  it("treats a different subdomain as a distinct origin", function () {
    // A script on the same registrable domain but a different host
    // (cdn.mozilla.org vs. mozilla.org) is a distinct origin, so it must
    // not be exempted from the SRI penalty as if it were same-origin.
    reqs = emptyRequests("test_content_sri_cross_origin_subdomain.html");
    const result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButExternalScriptsLoadedSecurely
    );
    assert.isFalse(result.pass);
  });

  it("derives the base origin from the final redirect", function () {
    // The www.mozilla.org script is foreign against the requested
    // mozilla.org origin, but same-origin once the page redirects to
    // www.mozilla.org — the base origin must follow the final served URL.
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
    // When HTTP redirects to HTTPS, //cdn.example.com/script.js always resolves to https://,
    // so protocol-relative URLs should be treated the same as https:// (issue #464).
    reqs = emptyRequests("test_content_sri_impl_external_noproto.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriImplementedAndExternalScriptsLoadedSecurely
    );
    assert.isTrue(result.pass);

    // When HTTP does NOT redirect to HTTPS, //cdn.example.com/script.js can resolve to http://
    // on an HTTP visit, so it must still be penalised.
    reqs = emptyRequests("test_content_sri_impl_external_noproto.html");
    reqs.responses.httpRedirects = [
      { url: new URL("http://mozilla.org/"), status: 200 },
    ];
    result = subresourceIntegrityTest(reqs);
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
    // When HTTP redirects to HTTPS, //cdn.example.com/script.js always resolves to https://,
    // so it should score like https:// (-5), not like http:// (-50) (issue #464).
    reqs = emptyRequests("test_content_sri_notimpl_external_noproto.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButExternalScriptsLoadedSecurely
    );
    assert.isFalse(result.pass);

    // When HTTP does NOT redirect to HTTPS, //cdn.example.com/script.js can resolve to http://
    // on an HTTP visit, so it must still be penalised at -50.
    reqs = emptyRequests("test_content_sri_notimpl_external_noproto.html");
    reqs.responses.httpRedirects = [
      { url: new URL("http://mozilla.org/"), status: 200 },
    ];
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely
    );
    assert.isFalse(result.pass);

    // When there is no HTTP server at all, //cdn.example.com/script.js can only
    // resolve to https://, so it should score like https:// (-5) (issue #464).
    reqs = emptyRequests("test_content_sri_notimpl_external_noproto.html");
    reqs.responses.http = null;
    reqs.responses.httpRedirects = [];
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButExternalScriptsLoadedSecurely
    );
    assert.isFalse(result.pass);

    // When the redirect to HTTPS goes through an intermediate HTTP hop, a normal
    // visitor still lands on HTTPS, so //cdn.example.com/script.js resolves to
    // https:// and scores like https:// (-5). The downgradeable hop is penalised
    // by the redirection test, not double-counted here (issue #464).
    reqs = emptyRequests("test_content_sri_notimpl_external_noproto.html");
    reqs.responses.httpRedirects = [
      { url: new URL("http://mozilla.org/"), status: 301 },
      { url: new URL("http://www.mozilla.org/"), status: 301 },
      { url: new URL("https://www.mozilla.org/"), status: 200 },
    ];
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButExternalScriptsLoadedSecurely
    );
    assert.isFalse(result.pass);
  });
});
