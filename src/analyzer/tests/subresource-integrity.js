import { BaseOutput, Expectation, HTML_TYPES, Requests } from "../../types.js";
import { JSDOM } from "jsdom";
import { parse } from "tldts";
import { onlyIfWorse } from "../utils.js";

export class SubresourceIntegrityOutput extends BaseOutput {
  /** @type {import("../../types.js").ScriptMap} */
  data;

  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
    this.data = {};
    this.name = "subresource-integrity";
    this.title = "Subresource Integrity";
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
  const mime = resp.headers["content-type"]?.split(";")[0];
  if (!HTML_TYPES.has(mime)) {
    // If the content isn't HTML, there's no scripts to load; this is okay
    output.result = Expectation.SriNotImplementedResponseNotHtml;
  } else {
    // Try to parse the HTML
    let dom;
    try {
      dom = new JSDOM(requests.resources.path);
    } catch (e) {
      // severe parser error
      output.result = Expectation.HtmlNotParseable;
      return output;
    }
    // Track to see if any scripts were on foreign TLDs.
    let scriptsOnForeignOrigin = false;
    const scripts = dom.window.document.querySelectorAll("script");
    for (const script of scripts) {
      if (script.src) {
        const src = parse(script.src);
        const integrity = script.getAttribute("integrity");
        const crossorigin = script.crossOrigin;

        let relativeOrigin = false;
        let relativeProtocol = false;
        let sameSecondLevelDomain = false;

        const relativeProtocolRegex = /^(\/\/)[^\/]/;
        const fullUrlRegex = /^https?:\/\//;

        if (relativeProtocolRegex.test(script.src)) {
          // relative protocol(src="//example.com/script.js")
          relativeProtocol = true;
          sameSecondLevelDomain = true;
        } else if (fullUrlRegex.test(script.src)) {
          // full URL (src="https://example.com/script.js")
          sameSecondLevelDomain =
            src.domain === parse(requests.hostname).domain;
        } else {
          // relative URL (src="/path" etc.)
          relativeOrigin = true;
          sameSecondLevelDomain = true;
        }

        // Check to see if it is the same origin or second level domain
        let secureOrigin = false;
        if (relativeOrigin || (sameSecondLevelDomain && !relativeProtocol)) {
          secureOrigin = true;
        } else {
          secureOrigin = false;
          scriptsOnForeignOrigin = true;
        }

        // Check if it is a secure scheme
        let scheme = null;
        if (!relativeProtocol && !relativeOrigin) {
          scheme = new URL(script.src).protocol;
        }
        let secureScheme = false;
        if (
          scheme === "https:" ||
          (relativeOrigin && requests.session.url.protocol === "https:")
        ) {
          secureScheme = true;
        }

        // Add it to the scripts data result, if it's not a relative URI
        if (!secureOrigin) {
          output.data[script.src] = { crossorigin, integrity };

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
    } else if (
      scripts.length > 0 &&
      !scriptsOnForeignOrigin &&
      !output.result
    ) {
      output.result =
        Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin;
    } else if (scripts.length > 0 && scriptsOnForeignOrigin && !output.result) {
      output.result = onlyIfWorse(
        Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
        output.result,
        goodness
      );
    }
  }
  // Code defensively on the size of the data
  output.data = JSON.stringify(output.data).length < 32768 ? output.data : {};
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
