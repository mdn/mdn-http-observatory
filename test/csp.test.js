import { assert } from "chai";

import { emptyRequests, setHeader } from "./helpers.js";
import { contentSecurityPolicyTest } from "../src/analyzer/tests/csp.js";
import { Expectation } from "../src/types.js";

describe("Content Security Policy", () => {
  it("missing", async () => {
    const requests = emptyRequests();
    const result = contentSecurityPolicyTest(requests);

    assert.equal(result["result"], Expectation.CspNotImplemented);
    assert.equal(result["numPolicies"], 0);
    assert.isFalse(result["pass"]);
  });

  {
    const values = [
      "  ",
      "\r\n",
      "",
      "default-src 'none'; default-src 'none'", // Repeated directives not allowed
      "default-src 'none'; img-src 'self'; default-src 'none'",
      "default-src 'none'; script-src 'strict-dynamic'", // strict dynamic without hash/nonce
      "defa",
    ];

    for (const value of values) {
      it("header invalid", async () => {
        const requests = emptyRequests();
        setHeader(requests.responses.auto, "Content-Security-Policy", value);

        const result = contentSecurityPolicyTest(requests);

        assert.equal(result["result"], Expectation.CspHeaderInvalid);
        assert.equal(result["numPolicies"], 1);
        assert.isFalse(result["pass"]);
      });
    }
  }

  it("insecure scheme broad and unsafe", async () => {
    const values = [
      "default-src 'none'; script-src https://*",
      "default-src 'none'; script-src 'unsafe-inline'",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);

      const result = contentSecurityPolicyTest(requests);

      assert.equal(
        result["result"],
        Expectation.CspImplementedWithUnsafeInline
      );
      assert.isFalse(result["pass"]);
      assert.isNotNull(result["policy"]);
      assert.isTrue(result["policy"]["unsafeInline"]);
    }
  });
  it("insecure scheme", async () => {
    const values = [
      "default-src http://mozilla.org",
      "default-src 'none'; script-src http://mozilla.org",
      "default-src 'none'; script-src http://mozilla.org",
      "default-src 'none'; script-src ftp://mozilla.org",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);

      const result = contentSecurityPolicyTest(requests);

      assert.equal(
        result["result"],
        Expectation.CspImplementedWithInsecureScheme
      );
      assert.isFalse(result["pass"]);
      assert.isNotNull(result["policy"]);
      assert.isTrue(result["policy"]["insecureSchemeActive"]);
    }
  });
  it("insecure scheme in passive content only", async () => {
    const values = [
      "default-src 'none'; img-src http://mozilla.org",
      "default-src 'self'; img-src ftp:",
      "default-src 'self'; img-src http:",
      "default-src 'none'; img-src https:; media-src http://mozilla.org",
      "default-src 'none'; img-src http: https:; script-src 'self'; style-src 'self'",
      "default-src 'none'; img-src 'none'; media-src http:; script-src 'self'; style-src 'self'",
      "default-src 'none'; img-src 'none'; media-src http:; script-src 'self'; style-src 'unsafe-inline'",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);

      const result = contentSecurityPolicyTest(requests);

      assert.equal(
        result["result"],
        Expectation.CspImplementedWithInsecureSchemeInPassiveContentOnly
      );
      assert.isTrue(result["pass"]);
      assert.isNotNull(result["policy"]);
      assert.isTrue(result["policy"]["insecureSchemePassive"]);
    }
  });
  it("unsafe inline", async () => {
    const values = [
      "script-src 'unsafe-inline'",
      "script-src data:", // overly broad
      "script-src http:",
      "script-src ftp:",
      "default-src 'unsafe-inline'",
      "default-src 'UNSAFE-INLINE'",
      "upgrade-insecure-requests",
      "script-src 'none'",
      "script-src https:",
      "script-src https://mozilla.org https:",
      "default-src https://mozilla.org https:",
      "default-src 'none'; script-src *",
      "default-src *; script-src *; object-src 'none'",
      "default-src 'none'; script-src 'none'; object-src *",
      "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'",
      "default-src 'none'; script-src 'unsafe-inline' http:",
      "object-src https:; script-src 'none'",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);

      const result = contentSecurityPolicyTest(requests);

      assert.equal(
        result["result"],
        Expectation.CspImplementedWithUnsafeInline
      );
      assert.isFalse(result["pass"]);
      assert.isNotNull(result["policy"]);
      assert.isTrue(result["policy"]["unsafeInline"]);
    }
  });
  it("unsafe eval", async () => {
    const requests = emptyRequests();

    setHeader(
      requests.responses.auto,
      "Content-Security-Policy",
      "default-src 'none'; script-src 'unsafe-eval'"
    );

    const result = contentSecurityPolicyTest(requests);

    assert.equal(result["result"], Expectation.CspImplementedWithUnsafeEval);
    assert.isNotNull(result.data);
    assert.deepEqual(result.data["script-src"], ["'unsafe-eval'"]);
    assert.isFalse(result["pass"]);
    assert.isNotNull(result["policy"]);
    assert.isTrue(result["policy"]["unsafeEval"]);
  });
  it("unsafe inline in style src only", async () => {
    const values = [
      "object-src 'none'; script-src 'none'; style-src 'unsafe-inline'",
      "default-src 'none'; script-src https://mozilla.org; style-src 'unsafe-inline'",
      "default-src 'unsafe-inline'; script-src https://mozilla.org",
      "default-src 'none';;; ;;;style-src 'self' 'unsafe-inline'",
      "default-src 'none'; style-src data:",
      "default-src 'none'; style-src *",
      "default-src 'none'; style-src https:",
      "default-src 'none'; style-src 'unsafe-inline'; " +
        "script-src 'sha256-hqBEA/HXB3aJU2FgOnYN8rkAgEVgyfi3Vs1j2/XMPBB=' " +
        "'unsafe-inline'",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);

      const result = contentSecurityPolicyTest(requests);

      assert.equal(
        result["result"],
        Expectation.CspImplementedWithUnsafeInlineInStyleSrcOnly
      );
      assert.isTrue(result["pass"]);
      assert.isNotNull(result["policy"]);
      assert.isTrue(result["policy"]["unsafeInlineStyle"]);
    }
  });
  it("no unsafe", async () => {
    // See https://github.com/mozilla/http-observatory/issues/88 and
    // https://github.com/mozilla/http-observatory/issues/277 for 'unsafe-inline' + hash/nonce
    const values = [
      "default-src https://mozilla.org",
      "default-src https://mozilla.org;;; ;;;script-src 'none'",
      "object-src 'none'; script-src https://mozilla.org; " +
        "style-src https://mozilla.org; upgrade-insecure-requests;",
      "object-src 'none'; script-src 'strict-dynamic' 'nonce-abc' 'unsafe-inline'; style-src 'none'",
      "object-src 'none'; style-src 'self';" +
        "script-src 'sha256-hqBEA/HXB3aJU2FgOnYN8rkAgEVgyfi3Vs1j2/XMPBA='",
      "object-src 'none'; style-src 'self'; script-src 'unsafe-inline' " +
        "'sha256-hqBEA/HXB3aJU2FgOnYN8rkAgEVgyfi3Vs1j2/XMPBA='" +
        "'sha256-hqBEA/HXB3aJU2FgOnYN8rkAgEVgyfi3Vs1j2/XMPBB='",
      "object-src 'none'; script-src 'unsafe-inline' 'nonce-abc123' 'unsafe-inline'; style-src 'none'",
      "default-src https://mozilla.org; style-src 'unsafe-inline' 'nonce-abc123' 'unsafe-inline'",
      "default-src https://mozilla.org; style-src 'unsafe-inline' " +
        "'sha256-hqBEA/HXB3aJU2FgOnYN8rkAgEVgyfi3Vs1j2/XMPBB=' 'unsafe-inline'",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);

      const result = contentSecurityPolicyTest(requests);

      assert.equal(result["result"], Expectation.CspImplementedWithNoUnsafe);
      assert.isTrue(result["pass"]);
    }
  });
  it("no unsafe default src none", async () => {
    // An HTTP header (default-src http:) and HTTP equiv (default-src https:), with differing values
    // that should end up as default-src 'none'
    let requests = emptyRequests("test_parse_http_equiv_headers_csp2.html");
    setHeader(
      requests.responses.auto,
      "Content-Security-Policy",
      "default-src http:"
    );
    let result = contentSecurityPolicyTest(requests);
    assert.equal(
      result["result"],
      Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
    );
    assert.equal(result["numPolicies"], 2);
    assert.isTrue(result["http"]);
    assert.isTrue(result["meta"]);
    assert.isTrue(result["pass"]);

    const values = [
      "default-src", // no value == 'none'  TODO: Fix this
      "default-src 'none'; script-src 'strict-dynamic' 'nonce-abc123' 'unsafe-inline'",
      "default-src 'none'; script-src https://mozilla.org; style-src https://mozilla.org; upgrade-insecure-requests;",
      "default-src 'none'; object-src https://mozilla.org",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);

      const result = contentSecurityPolicyTest(requests);

      assert.equal(
        result["result"],
        Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
      );
      assert.equal(result["numPolicies"], 1);
      assert.isTrue(result["http"]);
      assert.isFalse(result["meta"]);
      assert.isTrue(result["pass"]);
      assert.isNotNull(result["policy"]);
      assert.isTrue(result["policy"]["defaultNone"]);
    }

    // Do the same with an HTTP equiv
    requests = emptyRequests("test_parse_http_equiv_headers_csp1.html");
    result = contentSecurityPolicyTest(requests);
    assert.equal(
      result["result"],
      Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
    );
    assert.equal(result["numPolicies"], 1);
    assert.isFalse(result["http"]);
    assert.isTrue(result["meta"]);
    assert.isTrue(result["pass"]);

    // Do the same with an HTTP equiv that has multiple policies
    requests = emptyRequests(
      "test_parse_http_equiv_headers_csp_multiple_http_equiv1.html"
    );
    result = contentSecurityPolicyTest(requests);
    assert.equal(
      result["result"],
      Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
    );
    assert.equal(result["numPolicies"], 4);
    assert.isFalse(result["http"]);
    assert.isTrue(result["meta"]);
    assert.isTrue(result["pass"]);

    // With both a header and an HTTP equiv set to default-src 'none'
    requests = emptyRequests("test_parse_http_equiv_headers_csp1.html");
    setHeader(
      requests.responses.auto,
      "Content-Security-Policy",
      "default-src 'none'"
    );
    result = contentSecurityPolicyTest(requests);
    assert.equal(
      result["result"],
      Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
    );
    assert.equal(result["numPolicies"], 2);
    assert.isTrue(result["http"]);
    assert.isTrue(result["meta"]);
    assert.isTrue(result["pass"]);

    // With both a header (default-src 'none') and a conflicting HTTP equiv (default-src https:)
    requests = emptyRequests("test_parse_http_equiv_headers_csp2.html");
    setHeader(
      requests.responses.auto,
      "Content-Security-Policy",
      "default-src 'none'"
    );
    result = contentSecurityPolicyTest(requests);
    assert.equal(
      result["result"],
      Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
    );
    assert.equal(result["numPolicies"], 2);
    assert.isTrue(result["http"]);
    assert.isTrue(result["meta"]);
    assert.isTrue(result["pass"]);

    // An HTTP header (img-src 'none') and HTTP equiv (default-src 'none'), with differing values
    requests = emptyRequests("test_parse_http_equiv_headers_csp1.html");
    setHeader(
      requests.responses.auto,
      "Content-Security-Policy",
      "img-src 'none'"
    );
    result = contentSecurityPolicyTest(requests);
    assert.equal(
      result["result"],
      Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
    );
    assert.equal(result["numPolicies"], 2);
    assert.isTrue(result["http"]);
    assert.isTrue(result["meta"]);
    assert.isTrue(result["pass"]);
  });
  it("strict dynamic", async () => {
    const values = [
      "default-src 'none'; script-src 'strict-dynamic' 'nonce-abc123'",
      "default-src 'none'; script-src 'strict-dynamic' 'sha256-abc123'",
      // this is invalid: "default-src 'none'; script-src 'strict-dynamic' 'sha256-abc123' https://",
      "default-src 'none'; script-src 'strict-dynamic' 'sha256-abc123' https://*",
      "default-src 'none'; script-src 'strict-dynamic' 'sha256-abc123' 'unsafe-inline'",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);
      const result = contentSecurityPolicyTest(requests);

      assert.equal(
        result["result"],
        Expectation.CspImplementedWithNoUnsafeDefaultSrcNone
      );
      assert.isNotNull(result["policy"]);
      assert.isTrue(result["policy"]["strictDynamic"]);
    }
  });
  it("policy analysis", async () => {
    let values = [
      "default-src 'none'", // doesn't fall to frame-ancestors
      "frame-ancestors *",
      "frame-ancestors http:",
      "frame-ancestors https:",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);
      const policy = contentSecurityPolicyTest(requests)["policy"];
      assert.isNotNull(policy);
      assert.isFalse(policy["antiClickjacking"]);
    }

    // Now test where anticlickjacking is enabled
    const requests = emptyRequests();
    setHeader(
      requests.responses.auto,
      "Content-Security-Policy",
      "default-src *; frame-ancestors 'none'"
    );
    const policy = contentSecurityPolicyTest(requests)["policy"];
    assert.isNotNull(policy);
    assert.isTrue(policy["antiClickjacking"]);

    // Test unsafeObjects and insecureBaseUri
    values = [
      "default-src 'none'; base-uri *; object-src *",
      "default-src 'none'; base-uri https:; object-src https:",
      "default-src *",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);
      const policy = contentSecurityPolicyTest(requests)["policy"];
      assert.isNotNull(policy);
      assert.isTrue(policy["insecureBaseUri"]);
      assert.isTrue(policy["unsafeObjects"]);
    }

    // Other tests for insecureBaseUri
    values = [
      "default-src *; base-uri 'none'",
      "default-src 'none'; base-uri 'self'",
      "default-src 'none'; base-uri https://mozilla.org",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);
      const policy = contentSecurityPolicyTest(requests)["policy"];
      assert.isNotNull(policy);
      assert.isFalse(policy["insecureBaseUri"]);
    }

    // Test for insecureSchemePassive
    values = [
      "default-src * http: https: data: 'unsafe-inline' 'unsafe-eval'",
      "default-src 'none'; img-src http:",
      "default-src 'none' https://mozilla.org; img-src http://mozilla.org",
      "default-src https:; media-src http://mozilla.org; script-src http:",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);
      const policy = contentSecurityPolicyTest(requests)["policy"];
      assert.isNotNull(policy);
      assert.isTrue(policy["insecureSchemePassive"]);
    }

    // Test for insecureFormAction
    values = [
      "default-src *; form-action 'none'",
      "default-src *; form-action 'self'",
      "default-src 'none'; form-action 'self' https://mozilla.org",
      "form-action 'self' https://mozilla.org",
    ];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);
      const policy = contentSecurityPolicyTest(requests)["policy"];
      assert.isNotNull(policy);
      assert.isFalse(policy["insecureFormAction"]);
    }

    values = ["default-src *", "default-src 'none'", "form-action https:"];

    for (const value of values) {
      const requests = emptyRequests();
      setHeader(requests.responses.auto, "Content-Security-Policy", value);
      const policy = contentSecurityPolicyTest(requests)["policy"];
      assert.isNotNull(policy);
      assert.isTrue(policy["insecureFormAction"]);
    }
  });
  it("report only", async () => {
    const requests = emptyRequests();
    setHeader(
      requests.responses.auto,
      "Content-Security-Policy-Report-Only",
      "default-src 'none'; report-to /_/csp-reports"
    );
    const result = contentSecurityPolicyTest(requests);

    assert.equal(
      result["result"],
      Expectation.CspNotImplementedButReportingEnabled
    );
  });
  it("ignore frame-anchestors in http-equiv", async () => {
    let requests = emptyRequests(
      "test_parse_http_equiv_headers_not_allowed.html"
    );
    let result = contentSecurityPolicyTest(requests);
    assert.equal(result["result"], Expectation.CspNotImplemented);
    assert.isFalse(result["pass"]);
    setHeader(
      requests.responses.auto,
      "Content-Security-Policy",
      "frame-anchestors 'none'"
    );
    result = contentSecurityPolicyTest(requests);
    assert.equal(result["result"], Expectation.CspImplementedWithUnsafeInline);
    assert.isFalse(result["pass"]);
  });
});
