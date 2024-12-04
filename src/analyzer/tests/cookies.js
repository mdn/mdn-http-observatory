import { SET_COOKIE } from "../../headers.js";
import { Requests, BaseOutput } from "../../types.js";
import { Expectation } from "../../types.js";
import { getHttpHeaders, onlyIfWorse } from "../utils.js";
import { strictTransportSecurityTest } from "./strict-transport-security.js";
import { Cookie } from "tough-cookie";

// See: https://github.com/mozilla/http-observatory/issues/282 for the heroku-session-affinity insanity
const COOKIES_TO_DELETE = ["heroku-session-affinity"];

/**
 * @typedef {{ [key: string]: CookieDataItem }} CookieMap
 * /

/**
 * @typedef {object} CookieDataItem
 * @property {string} domain
 * @property {number} expires
 * @property {boolean} httponly
 * @property {number | "Infinity" | "-Infinity"} `max-age``
 * @property {string} path
 * @property {null} port
 * @property {string} samesite
 * @property {boolean} secure
 */

export class CookiesOutput extends BaseOutput {
  /** @type {CookieMap | null} */
  data = null;
  // Store whether or not we saw SameSite cookies, if cookies were set
  /** @type {boolean | null} */
  sameSite = null;
  static name = "cookies";
  static title = "Cookies";
  static possibleResults = [
    Expectation.CookiesSecureWithHttponlySessionsAndSamesite,
    Expectation.CookiesSecureWithHttponlySessions,
    Expectation.CookiesNotFound,
    Expectation.CookiesWithoutSecureFlagButProtectedByHsts,
    Expectation.CookiesSessionWithoutSecureFlagButProtectedByHsts,
    Expectation.CookiesWithoutSecureFlag,
    Expectation.CookiesSamesiteFlagInvalid,
    Expectation.CookiesAnticsrfWithoutSamesiteFlag,
    Expectation.CookiesSessionWithoutHttponlyFlag,
    Expectation.CookiesSessionWithoutSecureFlag,
  ];

  /** @param {Expectation} expectation */
  constructor(expectation) {
    super(expectation);
  }
}

/**
 *
 * @param {Requests} requests
 * @param {Expectation} expectation
 * @returns {CookiesOutput}
 */
export function cookiesTest(
  requests,
  expectation = Expectation.CookiesSecureWithHttponlySessions
) {
  const output = new CookiesOutput(expectation);
  const goodness = [
    Expectation.CookiesWithoutSecureFlagButProtectedByHsts,
    Expectation.CookiesWithoutSecureFlag,
    Expectation.CookiesSessionWithoutSecureFlagButProtectedByHsts,
    Expectation.CookiesSamesiteFlagInvalid,
    Expectation.CookiesAnticsrfWithoutSamesiteFlag,
    Expectation.CookiesSessionWithoutHttponlyFlag,
    Expectation.CookiesSessionWithoutSecureFlag,
  ];

  const hsts = strictTransportSecurityTest(requests)["pass"];

  output.sameSite = false;
  let hasMissingSameSite = false;

  // Check if we got a malformed SameSite on the raw headers
  if (requests.responses.auto) {
    const rawCookies = getHttpHeaders(requests.responses.auto, SET_COOKIE);
    if (rawCookies) {
      for (const rawCookie of rawCookies) {
        if (containsInvalidSameSiteCookie(rawCookie)) {
          output.result = onlyIfWorse(
            Expectation.CookiesSamesiteFlagInvalid,
            output.result,
            goodness
          );
        }
      }
    }
  }

  // get ALL the cookies from the store with serializeSync instead of using getCookiesSync
  const allCookies =
    requests.session?.jar?.serializeSync()?.cookies.filter(filterCookies) ?? [];

  if (!allCookies.length) {
    output.result = Expectation.CookiesNotFound;
    output.data = null;
  } else {
    // Now loop through all remaining cookies in the jar
    // and do the checks
    for (const cookie of allCookies) {
      // Is it a session identifier or an anti-csrf token?
      const sessionId = ["login", "sess"].some((i) =>
        cookie.key?.toLowerCase().includes(i)
      );
      const anticsrf = cookie.key?.toLowerCase().includes("csrf");

      if (
        !cookie.secure &&
        typeof cookie.sameSite === "string" &&
        cookie.sameSite.toLowerCase() === "none"
      ) {
        output.result = onlyIfWorse(
          Expectation.CookiesSamesiteFlagInvalid,
          output.result,
          goodness
        );
      }

      if (!cookie.secure && hsts) {
        output.result = onlyIfWorse(
          Expectation.CookiesWithoutSecureFlagButProtectedByHsts,
          output.result,
          goodness
        );
      } else if (!cookie.secure) {
        output.result = onlyIfWorse(
          Expectation.CookiesWithoutSecureFlag,
          output.result,
          goodness
        );
      }

      // Anti-CSRF tokens should be set using the SameSite option.
      if (anticsrf && !cookie.sameSite) {
        output.result = onlyIfWorse(
          Expectation.CookiesAnticsrfWithoutSamesiteFlag,
          output.result,
          goodness
        );
      }

      // Login and session cookies should be set with Secure.
      if (sessionId && !cookie.secure && hsts) {
        output.result = onlyIfWorse(
          Expectation.CookiesSessionWithoutSecureFlagButProtectedByHsts,
          output.result,
          goodness
        );
      } else if (sessionId && !cookie.secure) {
        output.result = onlyIfWorse(
          Expectation.CookiesSessionWithoutSecureFlag,
          output.result,
          goodness
        );
      }

      // Login and session cookies should be set with HttpOnly.
      if (sessionId && !cookie.httpOnly) {
        output.result = onlyIfWorse(
          Expectation.CookiesSessionWithoutHttponlyFlag,
          output.result,
          goodness
        );
      }
      if (!cookie.sameSite && !hasMissingSameSite) {
        hasMissingSameSite = true;
      }
    }

    if (!output.result) {
      if (hasMissingSameSite) {
        output.result = Expectation.CookiesSecureWithHttponlySessions;
        output.sameSite = false;
      } else {
        output.result =
          Expectation.CookiesSecureWithHttponlySessionsAndSamesite;
        output.sameSite = true;
      }
    }

    const cookieSize = allCookies.join("").length;
    if (cookieSize < 32768) {
      /** @type {cookieData} */
      let cookieData = {};
      cookieData = allCookies.reduce((acc, cookie) => {
        acc[cookie.key] = {
          domain: cookie.domain,
          expires: cookie.expires,
          httponly: cookie.httpOnly,
          "max-age": cookie.maxAge,
          path: cookie.path,
          port: null, // do we support ports? no.
          samesite: cookie.sameSite,
          secure: cookie.secure,
        };
        return acc;
      }, cookieData);
      output.data = cookieData;
    }
  }

  // Check to see if the test passed or failed
  if (
    [
      Expectation.CookiesNotFound,
      Expectation.CookiesSecureWithHttponlySessionsAndSamesite,
      expectation,
    ].includes(output.result)
  ) {
    output.pass = true;
  }
  return output;
}

/**
 *
 * @param {string} cookieString
 */
function containsInvalidSameSiteCookie(cookieString) {
  const parts = cookieString.trim().split(";");
  for (const p of parts) {
    const [key, value] = p.trim().split("=");
    if (key.trim().toLowerCase() === "samesite") {
      if (!value) {
        return true;
      }
      if (!["lax", "strict", "none"].includes(value.trim().toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

/**
 *
 * @param {import("tough-cookie").SerializedCookie} cookie
 */
function filterCookies(cookie) {
  const key = cookie.key;
  return key && !COOKIES_TO_DELETE.includes(key);
}
