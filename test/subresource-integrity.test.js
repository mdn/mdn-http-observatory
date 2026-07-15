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
    reqs = emptyRequests("test_content_sri_sameorigin1.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);

    // On the same second-level domain, but with https:// specified
    reqs = emptyRequests("test_content_sri_sameorigin2.html");
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

  it("treats on-origin protocol-relative scripts as a secure origin regardless of HTTPS enforcement", function () {
    // On-origin sub-resources carry no additional risk, so enforcement is
    // irrelevant to the verdict (issue #464).
    reqs = emptyRequests("test_content_sri_sameorigin3.html");
    let result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin
    );
    assert.isTrue(result.pass);

    // Without HTTP→HTTPS enforcement:
    reqs = emptyRequests("test_content_sri_sameorigin3.html");
    reqs.responses.httpRedirects = [
      { url: new URL("http://mozilla.org/"), status: 200 },
    ];
    result = subresourceIntegrityTest(reqs);
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

    // When the redirect to HTTPS goes through an intermediate HTTP hop, that hop
    // could be downgraded, so HTTPS is not enforced and the URL is still penalised.
    reqs = emptyRequests("test_content_sri_notimpl_external_noproto.html");
    reqs.responses.httpRedirects = [
      { url: new URL("http://mozilla.org/"), status: 301 },
      { url: new URL("http://www.mozilla.org/"), status: 301 },
      { url: new URL("https://www.mozilla.org/"), status: 200 },
    ];
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely
    );
    assert.isFalse(result.pass);
  });
});
