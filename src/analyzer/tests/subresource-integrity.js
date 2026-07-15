import { parse } from "tldts";

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
    // Track to see if any scripts were on foreign TLDs.
    let scriptsOnForeignOrigin = false;

    // Protocol-relative URLs (//cdn.example.com/…) inherit the page's scheme.
    // Per the security team's analysis (issue #464), only an off-origin
    // sub-resource on an HTTP-reachable document adds risk (an attacker could
    // MITM its origin and serve it over HTTP). So HTTP is "never served" — and
    // such a URL is safe — only when there is no HTTP server, or every redirect
    // hop after the initial HTTP request is already HTTPS (no downgradeable hop).
    const httpRedirects = requests.responses.httpRedirects;
    const httpEnforcesHttps =
      !requests.responses.http ||
      (httpRedirects.length > 1 &&
        httpRedirects.slice(1).every((r) => r.url.protocol === "https:"));

    const siteDomain = parse(requests.site.hostname).domain;

    for (const script of scripts) {
      const scriptSrc = getAttribute(script, "src");
      if (scriptSrc) {
        const src = parse(scriptSrc);
        const integrity = getAttribute(script, "integrity") || null;
        const crossorigin = getAttribute(script, "crossorigin") || null;

        let relativeOrigin = false;
        let relativeProtocol = false;
        let sameSecondLevelDomain;

        const relativeProtocolRegex = /^(\/\/)[^/]/;
        const fullUrlRegex = /^https?:\/\//;

        if (relativeProtocolRegex.test(scriptSrc)) {
          // relative protocol(src="//example.com/script.js")
          relativeProtocol = true;
          sameSecondLevelDomain =
            parse("https:" + scriptSrc).domain === siteDomain;
        } else if (fullUrlRegex.test(scriptSrc)) {
          // full URL (src="https://example.com/script.js")
          sameSecondLevelDomain = src.domain === siteDomain;
        } else {
          // relative URL (src="/path" etc.)
          relativeOrigin = true;
          sameSecondLevelDomain = true;
        }

        // Check to see if it is the same origin or second level domain
        let secureOrigin;
        if (relativeOrigin || sameSecondLevelDomain) {
          secureOrigin = true;
        } else {
          secureOrigin = false;
          scriptsOnForeignOrigin = true;
        }

        // Check if it is a secure scheme
        let scheme = null;
        if (!relativeProtocol && !relativeOrigin) {
          scheme = new URL(scriptSrc).protocol;
        }
        let secureScheme = false;
        if (
          scheme === "https:" ||
          (relativeOrigin && requests.session?.url.protocol === "https:") ||
          (relativeProtocol && httpEnforcesHttps)
        ) {
          secureScheme = true;
        }

        // Add it to the scripts data result, if it's not a relative URI
        if (!secureOrigin) {
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
          } else if (!integrity && !secureScheme && sameSecondLevelDomain) {
            output.result = onlyIfWorse(
              Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
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
          // Grant bonus even if they use SRI on the same origin
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
