import { CONTENT_TYPE } from "../../headers.js";
import { BaseOutput, Expectation, HTML_TYPES } from "../../types.js";
import { collectElements, getAttribute } from "../../utils/html-parser.js";
import { getFirstHttpHeader, onlyIfWorse } from "../utils.js";

/** @import { Requests } from "../../types.js" */

export class SubresourceIntegrityOutput extends BaseOutput {
  /** @type {import("../../types.js").ScriptMap} */
  data;
  static name = "subresource-integrity";
  static title = "Subresource Integrity";
  static possibleResults = [
    Expectation.SriImplementedAndAllScriptsLoadedSecurely,
    Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
    Expectation.SriNotImplementedResponseNotHtml,
    Expectation.SriNotImplementedButNoScriptsLoaded,
    Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
    Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
    Expectation.SriImplementedButExternalScriptsNotLoadedSecurely,
    Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
  ];

  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
    this.data = {};
  }
}

/**
 *
 * @param {Requests} requests
 * @param {Expectation} expectation
 * @returns {SubresourceIntegrityOutput}
 */
export function subresourceIntegrityTest(
  requests,
  expectation = Expectation.SriImplementedAndExternalScriptsLoadedSecurely
) {
  const output = new SubresourceIntegrityOutput(expectation);
  const goodness = [
    Expectation.SriImplementedAndAllScriptsLoadedSecurely,
    Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
    Expectation.SriImplementedButExternalScriptsNotLoadedSecurely,
    Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
    Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
    Expectation.SriNotImplementedResponseNotHtml,
  ];

  const resp = requests.responses.auto;

  if (!resp) {
    output.result = Expectation.SriNotImplementedButNoScriptsLoaded;
    return output;
  }

  const mime = (getFirstHttpHeader(resp, CONTENT_TYPE) ?? "").split(";")[0];
  if (mime && !HTML_TYPES.has(mime)) {
    // If the content isn't HTML, there's no scripts to load; this is okay
    output.result = Expectation.SriNotImplementedResponseNotHtml;
  } else {
    // Parse the HTML and collect script tags
    let scripts;
    try {
      scripts = collectElements(requests.resources.path || "", "script");
    } catch {
      // severe parser error
      output.result = Expectation.HtmlNotParseable;
      return output;
    }
    // Origin the page was ultimately served from. Same-origin requires an exact
    // scheme + host + port match, so a different subdomain is a distinct origin.
    const baseUrl =
      requests.session?.redirectHistory.at(-1)?.url ?? requests.session?.url;
    const baseOrigin = baseUrl?.origin ?? null;

    let scriptsOnForeignOrigin = false;

    // A protocol-relative URL (//cdn.example.com/…) inherits the page's scheme,
    // so it only adds risk when an off-origin sub-resource is served over HTTP
    // (an attacker could MITM the sub-resource origin) — see issue #464. It is
    // safe whenever a visitor lands on HTTPS: no HTTP server, or the HTTP request
    // ultimately redirects to HTTPS. A downgradeable intermediate hop
    // (http → http → https) still lands on HTTPS and is penalized by the
    // redirection test, so it is not docked again here.
    const httpRedirects = requests.responses.httpRedirects;
    const httpEnforcesHttps =
      !requests.responses.http ||
      httpRedirects.at(-1)?.url.protocol === "https:";

    for (const script of scripts) {
      const scriptSrc = getAttribute(script, "src");
      if (scriptSrc) {
        const integrity = getAttribute(script, "integrity") || null;
        const crossorigin = getAttribute(script, "crossorigin") || null;

        // Protocol-relative URLs inherit the page scheme, so their security is
        // judged by httpEnforcesHttps below; other URLs carry a concrete scheme.
        const relativeProtocol = /^(\/\/)[^/]/.test(scriptSrc);

        // Resolving against baseUrl covers relative and protocol-relative URLs;
        // without a session there is no base, so treat the script as foreign.
        // A src that fails to resolve (e.g. src="//") is not a loadable
        // sub-resource, so skip it rather than crashing the whole scan.
        let scriptUrl = null;
        if (baseUrl) {
          try {
            scriptUrl = new URL(scriptSrc, baseUrl);
          } catch {
            continue;
          }
        }

        const sameOrigin = scriptUrl?.origin === baseOrigin;
        if (!sameOrigin) {
          scriptsOnForeignOrigin = true;
        }

        // Protocol-relative URLs are secure only when httpEnforcesHttps; others
        // are secure when their resolved scheme is https.
        const secureScheme = relativeProtocol
          ? httpEnforcesHttps
          : scriptUrl?.protocol === "https:";

        // Record and score off-origin scripts; same-origin ones are trusted.
        if (!sameOrigin) {
          output.data[scriptSrc] = { crossorigin, integrity };

          if (integrity && !secureScheme) {
            output.result = onlyIfWorse(
              Expectation.SriImplementedButExternalScriptsNotLoadedSecurely,
              output.result,
              goodness
            );
          } else if (!integrity && secureScheme) {
            output.result = onlyIfWorse(
              Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
              output.result,
              goodness
            );
          } else if (!integrity && !secureScheme) {
            output.result = onlyIfWorse(
              Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
              output.result,
              goodness
            );
          }
        } else {
          // Reward SRI on same-origin scripts too, even if not required.
          if (integrity && secureScheme && !output.result) {
            output.result =
              Expectation.SriImplementedAndAllScriptsLoadedSecurely;
          }
        }
      }
    }

    if (scripts.length === 0) {
      output.result = Expectation.SriNotImplementedButNoScriptsLoaded;
    } else {
      if (!output.result) {
        if (scriptsOnForeignOrigin) {
          output.result =
            Expectation.SriImplementedAndExternalScriptsLoadedSecurely;
        } else {
          output.result =
            Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin;
        }
      }
    }
  }

  // Code defensively on the size of the data
  output.data = JSON.stringify(output.data).length < 32_768 ? output.data : {};
  // Check to see if the test passed or failed
  if (
    [
      Expectation.SriImplementedAndAllScriptsLoadedSecurely,
      Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
      Expectation.SriNotImplementedResponseNotHtml,
      Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
      Expectation.SriNotImplementedButNoScriptsLoaded,
      expectation,
    ].includes(output.result)
  ) {
    output.pass = true;
  }
  return output;
}
