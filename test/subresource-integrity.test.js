import { describe, it } from "node:test";

import { assert } from "chai";

import { subresourceIntegrityTest } from "../src/analyzer/tests/subresource-integrity.js";
import { Expectation } from "../src/types.js";

import { emptyRequests } from "./helpers.js";

/**
 * @typedef {object} Case
 * @property {string} name
 * @property {string} file
 * @property {(reqs: import("../src/types.js").Requests) => void} [setup]
 * @property {Expectation} expected
 * @property {boolean} pass
 */

/**
 * @typedef {object} Scenario
 * @property {string} name
 * @property {Case["setup"]} [setup]
 * @property {boolean} secure
 */

/**
 * @param {Case[]} cases
 */
function runCases(cases) {
  for (const { name, file, setup, expected, pass } of cases) {
    it(name, function () {
      const reqs = emptyRequests(file);
      setup?.(reqs);
      const result = subresourceIntegrityTest(reqs);
      assert.equal(result.result, expected);
      assert.equal(result.pass, pass);
    });
  }
}

describe("Subresource Integrity", () => {
  describe("without scorable scripts", () => {
    runCases([
      {
        name: "no scripts",
        file: "test_content_sri_no_scripts.html",
        expected: Expectation.SriNotImplementedButNoScriptsLoaded,
        pass: true,
      },
      {
        name: "response is not HTML",
        file: "test_content_sri_no_scripts.html",
        setup: (reqs) => {
          reqs.resources.path = `{"foo": "bar"}`;
          assert.isNotNull(reqs.responses.auto);
          reqs.responses.auto.headers["content-type"] = "application/json";
        },
        expected: Expectation.SriNotImplementedResponseNotHtml,
        pass: true,
      },
      {
        // A src like "//" cannot be resolved, so it is skipped, not thrown on.
        name: "unresolvable src",
        file: "test_content_sri_malformed_src.html",
        expected:
          Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
        pass: true,
      },
    ]);
  });

  describe("same-origin scripts", () => {
    runCases([
      {
        name: "relative path",
        file: "test_content_sri_sameorigin_relative.html",
        expected:
          Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
        pass: true,
      },
      {
        name: "protocol-relative URL",
        file: "test_content_sri_sameorigin_noproto.html",
        expected:
          Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
        pass: true,
      },
      {
        name: "absolute https URL",
        file: "test_content_sri_sameorigin_https.html",
        expected:
          Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
        pass: true,
      },
      {
        name: "absolute https URL on a 404 response",
        file: "test_content_sri_sameorigin_https.html",
        setup: (reqs) => {
          assert.isNotNull(reqs.responses.auto);
          reqs.responses.auto.status = 404;
        },
        expected:
          Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
        pass: true,
      },
      {
        // The www.mozilla.org script is foreign to the requested mozilla.org,
        // but same-origin with the final redirect target.
        name: "base origin follows the final redirect",
        file: "test_content_sri_www_subdomain.html",
        setup: (reqs) => {
          assert.isNotNull(reqs.session);
          reqs.session.redirectHistory = [
            { url: new URL("https://www.mozilla.org/"), status: 200 },
          ];
        },
        expected:
          Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
        pass: true,
      },
      {
        name: "with SRI on all scripts",
        file: "test_content_sri_impl_sameorigin.html",
        expected: Expectation.SriImplementedAndAllScriptsLoadedSecurely,
        pass: true,
      },
      {
        name: "with SRI on only some scripts",
        file: "test_content_sri_impl_sameorigin_partial.html",
        expected:
          Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
        pass: true,
      },
      {
        name: "with SRI, plus a cross-origin script with SRI",
        file: "test_content_sri_impl_sameorigin_and_external.html",
        expected: Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
        pass: true,
      },
    ]);
  });

  // Only protocol-relative URLs depend on HTTP enforcement.
  describe("cross-origin scripts with explicit scheme", () => {
    runCases([
      {
        name: "with SRI over https (remote host)",
        file: "test_content_sri_impl_external_https_remote.html",
        expected: Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
        pass: true,
      },
      {
        name: "with SRI over https (localhost)",
        file: "test_content_sri_impl_external_https_localhost.html",
        expected: Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
        pass: true,
      },
      {
        name: "with SRI over http",
        file: "test_content_sri_impl_external_http.html",
        expected: Expectation.SriImplementedButExternalScriptsNotLoadedSecurely,
        pass: false,
      },
      {
        name: "without SRI over https",
        file: "test_content_sri_notimpl_external_https.html",
        expected: Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
        pass: false,
      },
      {
        name: "with SRI over https, HTTP stays on HTTP",
        file: "test_content_sri_impl_external_https_remote.html",
        setup: (reqs) => {
          reqs.responses.httpRedirects = [
            { url: new URL("http://mozilla.org/"), status: 200 },
          ];
        },
        expected: Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
        pass: true,
      },
      {
        name: "without SRI over https, HTTP stays on HTTP",
        file: "test_content_sri_notimpl_external_https.html",
        setup: (reqs) => {
          reqs.responses.httpRedirects = [
            { url: new URL("http://mozilla.org/"), status: 200 },
          ];
        },
        expected: Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
        pass: false,
      },
      {
        name: "without SRI over http",
        file: "test_content_sri_notimpl_external_http.html",
        expected:
          Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
        pass: false,
      },
      {
        name: "without SRI on a different subdomain",
        file: "test_content_sri_cross_origin_subdomain.html",
        expected: Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
        pass: false,
      },
    ]);
  });

  // A protocol-relative URL inherits the page scheme, so it is only insecure
  // when a visitor can end up on HTTP.
  describe("cross-origin protocol-relative scripts", () => {
    /** @type {Scenario[]} */
    const httpScenarios = [
      {
        name: "HTTP redirects to HTTPS",
        secure: true,
      },
      {
        name: "no HTTP server",
        setup: (reqs) => {
          reqs.responses.http = null;
          reqs.responses.httpRedirects = [];
        },
        secure: true,
      },
      {
        // The downgradeable hop is penalized by the redirection test instead.
        name: "HTTP redirects to HTTPS via an HTTP hop",
        setup: (reqs) => {
          reqs.responses.httpRedirects = [
            { url: new URL("http://mozilla.org/"), status: 301 },
            { url: new URL("http://www.mozilla.org/"), status: 301 },
            { url: new URL("https://www.mozilla.org/"), status: 200 },
          ];
        },
        secure: true,
      },
      {
        name: "HTTP stays on HTTP",
        setup: (reqs) => {
          reqs.responses.httpRedirects = [
            { url: new URL("http://mozilla.org/"), status: 200 },
          ];
        },
        secure: false,
      },
    ];

    const fixtures = [
      {
        name: "with SRI",
        file: "test_content_sri_impl_external_noproto.html",
        secure: {
          expected: Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
          pass: true,
        },
        insecure: {
          expected:
            Expectation.SriImplementedButExternalScriptsNotLoadedSecurely,
          pass: false,
        },
      },
      {
        name: "without SRI",
        file: "test_content_sri_notimpl_external_noproto.html",
        secure: {
          expected:
            Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
          pass: false,
        },
        insecure: {
          expected:
            Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
          pass: false,
        },
      },
      {
        name: "without SRI on a different subdomain",
        file: "test_content_sri_cross_origin_noproto.html",
        secure: {
          expected:
            Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
          pass: false,
        },
        insecure: {
          expected:
            Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
          pass: false,
        },
      },
    ];

    runCases(
      fixtures.flatMap((fixture) =>
        httpScenarios.map((scenario) => ({
          name: `${fixture.name}, ${scenario.name}`,
          file: fixture.file,
          setup: scenario.setup,
          ...(scenario.secure ? fixture.secure : fixture.insecure),
        }))
      )
    );
  });
});
