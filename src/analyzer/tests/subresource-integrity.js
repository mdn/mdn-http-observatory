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
    // The origin the page was ultimately served from. Scripts are same-origin
    // only when their exact scheme + host + port match this, not merely when
    // they share the same registrable domain (e.g. a different subdomain is a
    // distinct origin).
    const baseUrl =
      requests.session?.redirectHistory.at(-1)?.url ?? requests.session?.url;
    const baseOrigin = baseUrl?.origin ?? null;

    // Track to see if any scripts were on foreign origins.
    let scriptsOnForeignOrigin = false;

    // Protocol-relative URLs (//cdn.example.com/…) inherit the page's scheme.
    // Per the security team's analysis (issue #464), only an off-origin
    // sub-resource on a document served over HTTP adds risk (an attacker could
    // MITM the sub-resource's origin and serve it over HTTP). So such a URL is
    // safe whenever a normal visitor ends up on HTTPS: when there is no HTTP
    // server, or the HTTP request ultimately redirects to HTTPS.
    //
    // A downgradeable intermediate hop (http → http → https) is not this test's
    // concern: the visitor still lands on HTTPS, so the script loads over HTTPS.
    // That insecure hop is already penalised by the redirection test
    // (RedirectionNotToHttpsOnInitialRedirection); judging it here as well would
    // dock one redirect flaw twice.
    const httpRedirects = requests.responses.httpRedirects;
    const httpEnforcesHttps =
      !requests.responses.http ||
      httpRedirects.at(-1)?.url.protocol === "https:";

    for (const script of scripts) {
      const scriptSrc = getAttribute(script, "src");
      if (scriptSrc) {
        const integrity = getAttribute(script, "integrity") || null;
        const crossorigin = getAttribute(script, "crossorigin") || null;

        // Only protocol-relative URLs (src="//example.com/script.js") need
        // special scheme handling: they inherit the page scheme, so their
        // security is judged by HTTP reachability below. Full and path-relative
        // URLs carry a concrete scheme that is read directly.
        const relativeProtocol = /^(\/\/)[^/]/.test(scriptSrc);

        // Same origin when the resolved script origin exactly matches the
        // page's (scheme + host + port). Resolving against baseUrl also covers
        // relative and protocol-relative URLs; without a session there is no
        // base to resolve against, so treat it as a foreign origin.
        const sameOrigin = baseUrl
          ? new URL(scriptSrc, baseUrl).origin === baseOrigin
          : false;
        if (!sameOrigin) {
          scriptsOnForeignOrigin = true;
        }

        // Check if it is a secure scheme. Protocol-relative URLs are secure
        // only when HTTP is never served (httpEnforcesHttps); other URLs are
        // secure when the scheme they resolve to — explicit for full URLs,
        // inherited from baseUrl for path-relative ones — is https.
        const resolvedScheme = baseUrl
          ? new URL(scriptSrc, baseUrl).protocol
          : null;
        const secureScheme =
          (relativeProtocol && httpEnforcesHttps) ||
          (!relativeProtocol && resolvedScheme === "https:");

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
