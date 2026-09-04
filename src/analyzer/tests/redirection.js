import { Site } from "../../site.js";
import { BaseOutput, Expectation } from "../../types.js";
import { isHstsPreloaded } from "../hsts.js";

/** @import { Requests } from "../../types.js" */

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
  const {
    http: httpResponse,
    httpRedirects,
    httpsRedirects,
  } = requests.responses;

  // For display only: prefer the HTTP chain's destination, falling back to the
  // HTTPS chain when there is no HTTP response.
  const lastRedirect = httpRedirects.at(-1) ?? httpsRedirects.at(-1);
  const destination = lastRedirect?.url?.href;
  if (destination) {
    output.destination = destination;
  }
  output.statusCode = httpResponse ? httpResponse.status : null;

  if (!httpResponse) {
    output.result = Expectation.RedirectionNotNeededNoHttp;
  } else if (!httpResponse.verified) {
    output.result = Expectation.RedirectionInvalidCert;
  } else {
    output.route = httpRedirects.map((r) => r.url.href);

    if (httpRedirects.length === 1) {
      // No redirection, so you just stayed on the http website
      output.result = Expectation.RedirectionMissing;
      output.redirects = false;
    } else if (
      // Check to see if every redirection was covered by the preload list
      httpRedirects.every((re) =>
        isHstsPreloaded(Site.fromSiteString(re.url.hostname))
      )
    ) {
      output.result = Expectation.RedirectionAllRedirectsPreloaded;
    } else if (httpRedirects.at(-1)?.url.protocol !== "https:") {
      // Final destination wasn't an https website
      output.result = Expectation.RedirectionNotToHttps;
    } else if (httpRedirects[1]?.url.protocol === "http:") {
      // http should never redirect to another http location -- should always go to https first
      output.result = Expectation.RedirectionNotToHttpsOnInitialRedirection;
      output.statusCode = httpRedirects.at(-1)?.status || null;
    } else if (
      httpRedirects[0]?.url.protocol === "http:" &&
      httpRedirects[1]?.url.protocol === "https:" &&
      httpRedirects[0]?.url.hostname !== httpRedirects[1]?.url.hostname
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
