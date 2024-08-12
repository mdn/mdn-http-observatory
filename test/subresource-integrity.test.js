import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { subresourceIntegrityTest } from "../src/analyzer/tests/subresource-integrity.js";
import { Expectation } from "../src/types.js";

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

  it("checks for no invalid html", function () {
    // Invalid html. For some reason this provokes a parser error,
    // whenever that is fixed on the JSDOM side, we have to find a new
    // magic html fragment.
    reqs.resources.path = `<div style="@media only screen{background-image: url(http://a.com/a.jpg)">`;
    const result = subresourceIntegrityTest(reqs);
    assert.equal(result.result, "html-not-parseable");
    assert.isFalse(result.pass);
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

    // On the same second-level domain, but without a protocol
    reqs = emptyRequests("test_content_sri_sameorigin3.html");
    result = subresourceIntegrityTest(reqs);
    assert.equal(
      result.result,
      Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely
    );
    assert.isFalse(result.pass);

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
