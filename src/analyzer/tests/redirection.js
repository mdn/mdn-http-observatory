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
  const response = requests.responses.http;

  if (requests.responses.httpRedirects.length > 0) {
    output.destination =
      requests.responses.httpRedirects[
        requests.responses.httpRedirects.length - 1
      ].url.href;
  } else if (requests.responses.httpsRedirects.length > 0) {
    output.destination =
      requests.responses.httpsRedirects[
        requests.responses.httpsRedirects.length - 1
      ].url.href;
  }
  output.statusCode = response ? response.status : null;

  if (!response) {
    output.result = Expectation.RedirectionNotNeededNoHttp;
  } else if (!response.verified) {
    output.result = Expectation.RedirectionInvalidCert;
  } else {
    const route = requests.responses.httpRedirects;
    output.route = route.map((r) => r.url.href);

    // Check to see if every redirection was covered by the preload list
    const allRedirectsPreloaded = route.every((re) =>
      isHstsPreloaded(re.url.hostname)
    );
    if (allRedirectsPreloaded) {
      output.result = Expectation.RedirectionAllRedirectsPreloaded;
    } else if (route.length === 1) {
      // No redirection, so you just stayed on the http website
      output.result = Expectation.RedirectionMissing;
      output.redirects = false;
    } else if (route[route.length - 1].url.protocol !== "https:") {
      // Final destination wasn't an https website
      output.result = Expectation.RedirectionNotToHttps;
    } else if (route[1].url.protocol === "http:") {
      // http should never redirect to another http location -- should always go to https first
      output.result = Expectation.RedirectionNotToHttpsOnInitialRedirection;
      output.statusCode = route[route.length - 1].status;
    } else if (
      route[0].url.protocol === "http:" &&
      route[1].url.protocol === "https:" &&
      route[0].url.hostname !== route[1].url.hostname
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
