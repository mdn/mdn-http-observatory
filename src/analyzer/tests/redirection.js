import { Site } from "../../site.js";
import { BaseOutput, Requests } from "../../types.js";
import { Expectation } from "../../types.js";
import { isHstsPreloaded } from "../hsts.js";

export class RedirectionOutput extends BaseOutput {
  /** @type {string | null} */
  destination = null;
  redirects = true;
  /** @type {string[]} */
  route = [];
  /** @type {number | null} */
  statusCode = null;
  static name = "redirection";
  static title = "Redirection";
  static possibleResults = [
    Expectation.RedirectionAllRedirectsPreloaded,
    Expectation.RedirectionToHttps,
    Expectation.RedirectionNotNeededNoHttp,
    Expectation.RedirectionOffHostFromHttp,
    Expectation.RedirectionNotToHttpsOnInitialRedirection,
    Expectation.RedirectionNotToHttps,
    Expectation.RedirectionMissing,
    Expectation.RedirectionInvalidCert,
  ];

  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    super(expectation);
  }
}

/**
 *
 * @param {Requests} requests
 * @param {Expectation} expectation
 * @returns {RedirectionOutput}
 */
export function redirectionTest(
  requests,
  expectation = Expectation.RedirectionToHttps
) {
  const output = new RedirectionOutput(expectation);
  const httpResponse = requests.responses.http;

  const httpRoute = requests.responses.httpRedirects;
  const httpsRoute = requests.responses.httpsRedirects;

  // For display only: prefer the HTTP chain, fall back to HTTPS chain when HTTP is absent
  const displayRoute = httpRoute.length > 0 ? httpRoute : httpsRoute;

  const destination = displayRoute.at(-1)?.url?.href;
  if (destination) {
    output.destination = destination;
  }
  output.statusCode = httpResponse ? httpResponse.status : null;

  if (!httpResponse) {
    output.result = Expectation.RedirectionNotNeededNoHttp;
  } else if (!httpResponse.verified) {
    output.result = Expectation.RedirectionInvalidCert;
  } else {
    output.route = displayRoute.map((r) => r.url.href);

    // Check to see if every redirection was covered by the preload list.
    // Guard httpRoute.length > 1 to avoid vacuous truth on an empty array.
    const allRedirectsPreloaded =
      httpRoute.length > 1 &&
      httpRoute.every((re) =>
        isHstsPreloaded(Site.fromSiteString(re.url.hostname))
      );
    if (allRedirectsPreloaded) {
      output.result = Expectation.RedirectionAllRedirectsPreloaded;
    } else if (httpRoute.length < 2) {
      // No redirection, so you just stayed on the http website
      output.result = Expectation.RedirectionMissing;
      output.redirects = false;
    } else if (
      httpRoute.at(-1)?.url.protocol !== "https:" ||
      (httpsRoute.length > 0 && httpsRoute.at(-1)?.url.protocol !== "https:")
    ) {
      // Final destination wasn't https — checked for both the HTTP chain and
      // the independent HTTPS chain (catches HTTPS redirecting back to HTTP)
      output.result = Expectation.RedirectionNotToHttps;
    } else if (httpRoute[1]?.url.protocol === "http:") {
      // http should never redirect to another http location -- should always go to https first
      output.result = Expectation.RedirectionNotToHttpsOnInitialRedirection;
      output.statusCode = httpRoute.at(-1)?.status || null;
    } else if (
      httpRoute[0]?.url.protocol === "http:" &&
      httpRoute[1]?.url.protocol === "https:" &&
      httpRoute[0]?.url.hostname !== httpRoute[1]?.url.hostname
    ) {
      output.result = Expectation.RedirectionOffHostFromHttp;
    } else {
      // Yeah, you're good
      output.result = Expectation.RedirectionToHttps;
    }
  }
  // Code defensively against infinite routing loops and other shenanigans
  output.route = JSON.stringify(output.route).length > 8192 ? [] : output.route;
  output.statusCode =
    `${output.statusCode}`.length < 5 ? output.statusCode : null;

  // Check to see if the test passed or failed
  if (
    [
      Expectation.RedirectionNotNeededNoHttp,
      Expectation.RedirectionAllRedirectsPreloaded,
      expectation,
    ].includes(output.result)
  ) {
    output.pass = true;
  }

  return output;
}
