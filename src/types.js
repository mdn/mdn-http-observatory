/** @import { Session } from "./retriever/session.js" */
/** @import { Site } from "./site.js" */

/**
 * @typedef {object} HttpEquiv
 * @property {Map<string, string[]>} [httpEquiv]
 * @typedef {object} Verified
 * @property {boolean} verified
 * @typedef {import("axios").AxiosResponse & Verified} HttpResponse
 * @typedef {HttpResponse & Partial<HttpEquiv>} Response
 * @typedef {object} Hst
 * @property {boolean} includeSubDomains
 * @property {boolean} includeSubDomainsForPinning
 * @property {string} mode
 * @property {boolean} pinned
 * @typedef {Map<string, Hst>} Hsts
 * @typedef {object} RedirectEntry
 * @property {URL} url
 * @property {number} status
 */

export const ALGORITHM_VERSION = 4;

export class Responses {
  /** @type {Response | null} */
  auto = null;
  /** @type {HttpResponse | null} */
  cors = null;
  /** @type {HttpResponse | null} */
  http = null;
  /** @type {HttpResponse | null} */
  https = null;
  /** @type {RedirectEntry[]} */
  httpRedirects = [];
  /** @type {RedirectEntry[]} */
  httpsRedirects = [];
}

export class Resources {
  // /** @type {string | null} */
  // robots = null;
  /** @type {string | null} */
  path = null;
}

export class BaseOutput {
  /** @type {Expectation} */
  expectation;
  /** @type boolean | null */
  pass = false;
  /** @type {Expectation | null} */
  result = null;
  /** @type {string | null} */
  scoreDescription = null;
  /** @type {number | null} */
  scoreModifier = 0;
  /** @type {string} */
  static name = "base";
  /** @type {string} */
  static title = "Base";
  /** @type {Expectation[]} */
  static possibleResults = [];

  /**
   *
   * @param {Expectation} expectation
   */
  constructor(expectation) {
    this.expectation = expectation;
  }
}

export class Requests {
  /** @type {Site} */
  site;
  /** @type {number} */
  httpPort;
  /** @type {number} */
  httpsPort;
  /** @type {Resources} */
  resources;
  /** @type {Responses} */
  responses;
  /** @type {Session | null} */
  session;

  /**
   *
   * @param {Site} site
   */
  constructor(site) {
    this.site = site;
    this.httpPort = site.port || 80;
    this.httpsPort = site.port || 443;
    this.resources = new Resources();
    this.responses = new Responses();
    this.session = null;
  }
}

/** @enum { string } Expectation  */
export const Expectation = {
  // CONTENT SECURITY POLICY

  CspImplementedWithNoUnsafe: "csp-implemented-with-no-unsafe",
  CspImplementedWithNoUnsafeDefaultSrcNone:
    "csp-implemented-with-no-unsafe-default-src-none",
  CspImplementedWithUnsafeInlineInStyleSrcOnly:
    "csp-implemented-with-unsafe-inline-in-style-src-only",
  CspImplementedWithInsecureSchemeInPassiveContentOnly:
    "csp-implemented-with-insecure-scheme-in-passive-content-only",
  CspImplementedWithUnsafeInline: "csp-implemented-with-unsafe-inline",
  CspImplementedWithUnsafeEval: "csp-implemented-with-unsafe-eval",
  CspImplementedWithInsecureScheme: "csp-implemented-with-insecure-scheme",
  CspHeaderInvalid: "csp-header-invalid",
  CspNotImplemented: "csp-not-implemented",
  CspNotImplementedButReportingEnabled:
    "csp-not-implemented-but-reporting-enabled",
  CspImplementedButDuplicateDirectives:
    "csp-implemented-but-duplicate-directives",

  // SUBRESOURCE INTEGRITY

  SriImplementedAndAllScriptsLoadedSecurely:
    "sri-implemented-and-all-scripts-loaded-securely",
  SriImplementedAndExternalScriptsLoadedSecurely:
    "sri-implemented-and-external-scripts-loaded-securely",
  SriImplementedButExternalScriptsNotLoadedSecurely:
    "sri-implemented-but-external-scripts-not-loaded-securely",
  SriNotImplementedAndExternalScriptsNotLoadedSecurely:
    "sri-not-implemented-and-external-scripts-not-loaded-securely",
  SriNotImplementedButAllScriptsLoadedFromSecureOrigin:
    "sri-not-implemented-but-all-scripts-loaded-from-secure-origin",
  SriNotImplementedButExternalScriptsLoadedSecurely:
    "sri-not-implemented-but-external-scripts-loaded-securely",
  SriNotImplementedButNoScriptsLoaded:
    "sri-not-implemented-but-no-scripts-loaded",
  SriNotImplementedResponseNotHtml: "sri-not-implemented-response-not-html",

  // GENERIC

  HtmlNotParseable: "html-not-parseable",

  // HTTP STRICT TRANSPORT SECURITY

  HstsHeaderInvalid: "hsts-header-invalid",
  HstsImplementedMaxAgeAtLeastSixMonths:
    "hsts-implemented-max-age-at-least-six-months",
  HstsImplementedMaxAgeLessThanSixMonths:
    "hsts-implemented-max-age-less-than-six-months",
  HstsInvalidCert: "hsts-invalid-cert",
  HstsNotImplementedNoHttps: "hsts-not-implemented-no-https",
  HstsNotImplemented: "hsts-not-implemented",
  HstsPreloaded: "hsts-preloaded",

  // COOKIES

  CookiesAnticsrfWithoutSamesiteFlag: "cookies-anticsrf-without-samesite-flag",
  CookiesNotFound: "cookies-not-found",
  CookiesSamesiteFlagInvalid: "cookies-samesite-flag-invalid",
  CookiesSecureWithHttponlySessionsAndSamesite:
    "cookies-secure-with-httponly-sessions-and-samesite",
  CookiesSecureWithHttponlySessions: "cookies-secure-with-httponly-sessions",
  CookiesSessionWithoutHttponlyFlag: "cookies-session-without-httponly-flag",
  CookiesSessionWithoutSecureFlagButProtectedByHsts:
    "cookies-session-without-secure-flag-but-protected-by-hsts",
  CookiesSessionWithoutSecureFlag: "cookies-session-without-secure-flag",
  CookiesWithoutSecureFlagButProtectedByHsts:
    "cookies-without-secure-flag-but-protected-by-hsts",
  CookiesWithoutSecureFlag: "cookies-without-secure-flag",

  // X-FRAME OPTIONS

  XFrameOptionsAllowFromOrigin: "x-frame-options-allow-from-origin",
  XFrameOptionsHeaderInvalid: "x-frame-options-header-invalid",
  XFrameOptionsImplementedViaCsp: "x-frame-options-implemented-via-csp",
  XFrameOptionsNotImplemented: "x-frame-options-not-implemented",
  XFrameOptionsSameoriginOrDeny: "x-frame-options-sameorigin-or-deny",

  // REDIRECTION

  RedirectionToHttps: "redirection-to-https",
  RedirectionNotToHttps: "redirection-not-to-https",
  RedirectionNotToHttpsOnInitialRedirection:
    "redirection-not-to-https-on-initial-redirection",
  RedirectionMissing: "redirection-missing",
  RedirectionNotNeededNoHttp: "redirection-not-needed-no-http",
  RedirectionOffHostFromHttp: "redirection-off-host-from-http",
  RedirectionInvalidCert: "redirection-invalid-cert",
  RedirectionAllRedirectsPreloaded: "redirection-all-redirects-preloaded",

  // REFERRER POLICY

  ReferrerPolicyPrivate: "referrer-policy-private",
  ReferrerPolicyUnsafe: "referrer-policy-unsafe",
  ReferrerPolicyNotImplemented: "referrer-policy-not-implemented",
  ReferrerPolicyHeaderInvalid: "referrer-policy-header-invalid",

  // X-CONTENT-TYPE OPTIONS

  XContentTypeOptionsNosniff: "x-content-type-options-nosniff",
  XContentTypeOptionsNotImplemented: "x-content-type-options-not-implemented",
  XContentTypeOptionsHeaderInvalid: "x-content-type-options-header-invalid",

  // CROSS ORIGIN RESOURCE SHARING

  CrossOriginResourceSharingNotImplemented:
    "cross-origin-resource-sharing-not-implemented",
  CrossOriginResourceSharingImplementedWithPublicAccess:
    "cross-origin-resource-sharing-implemented-with-public-access",
  CrossOriginResourceSharingImplementedWithRestrictedAccess:
    "cross-origin-resource-sharing-implemented-with-restricted-access",
  CrossOriginResourceSharingImplementedWithUniversalAccess:
    "cross-origin-resource-sharing-implemented-with-universal-access",

  // CROSS ORIGIN RESOURCE POLICY

  CrossOriginResourcePolicyNotImplemented: "corp-not-implemented",
  CrossOriginResourcePolicyImplementedWithSameOrigin:
    "corp-implemented-with-same-origin",
  CrossOriginResourcePolicyImplementedWithSameSite:
    "corp-implemented-with-same-site",
  CrossOriginResourcePolicyImplementedWithCrossOrigin:
    "corp-implemented-with-cross-origin",
  CrossOriginResourcePolicyHeaderInvalid: "corp-header-invalid",
};

/**
 * @typedef {object} ScanOptions
 * @property {string[]} [customHeaders]
 * @property {boolean} [sendHeadersOverHttp]
 * @property {string[]} [cookies]
 * @property {number} [httpPort]
 * @property {number} [httpsPort]
 * @property {string} [path]
 */

// MIME types for HTML requests
export const HTML_TYPES = new Set(["text/html", "application/xhtml+xml"]);

/**
 * @typedef {{[key: string]: string[]}} CspMap
 */

/**
 * @typedef {{[key: string]: {crossorigin: string | null, integrity: string | null}}} ScriptMap
 */

export class Policy {
  antiClickjacking = false;
  defaultNone = false;
  insecureBaseUri = false;
  insecureFormAction = false;
  insecureSchemeActive = false;
  insecureSchemePassive = false;
  strictDynamic = false;
  unsafeEval = false;
  unsafeInline = false;
  unsafeInlineStyle = false;
  unsafeObjects = false;
}

/**
 * Union type for all Test Outputs
 * @typedef {import("./analyzer/tests/cookies.js").CookiesOutput
 * | import("./analyzer/tests/cors.js").CorsOutput
 * | import("./analyzer/tests/csp.js").CspOutput
 * | import("./analyzer/tests/redirection.js").RedirectionOutput
 * | import("./analyzer/tests/referrer-policy.js").ReferrerOutput
 * | import("./analyzer/tests/strict-transport-security.js").StrictTransportSecurityOutput
 * | import("./analyzer/tests/subresource-integrity.js").SubresourceIntegrityOutput
 * | import("./analyzer/tests/x-content-type-options.js").XContentTypeOptionsOutput
 * | import("./analyzer/tests/x-frame-options.js").XFrameOptionsOutput
 * } Output
 */

/**
 * Represents an object with string keys and number values
 * @typedef {{ [key: string]: number }} NumberMap
 */

/**
 * Represents an object with string keys and string values
 * @typedef {{ [key: string]: string }} StringMap
 */

/**
 * Represents an object with string keys and Output values
 * @typedef {{ [key: string]: Output }} TestMap
 */

/**
 * @typedef {object} AnalyzeResult
 * @property {number} algorithmVersion
 * @property {string | null} error
 * @property {string} grade
 * @property {StringMap} responseHeaders
 * @property {number} score
 * @property {number} testsFailed
 * @property {number} testsPassed
 * @property {number} testsQuantity
 * @property {number} statusCode
 */

/**
 * @typedef {object} ScanResult
 * @property {AnalyzeResult} scan
 * @property {TestMap} tests
 */

/**
 * @typedef {object} ScanHistoryRow
 * @property {number} id
 * @property {string} grade
 * @property {number} score
 * @property {string} end_time
 * @property {number} end_time_unix_timestamp
 */

/**
 * @typedef {object} ScannerStatisticsResult
 * @property {NumberMap} grade_distribution
 * @property {NumberMap} grade_distribution_all_scans
 * @property {NumberMap} scan_score_difference_distribution_summation
 * @property {string} most_recent_scan_datetime
 * @property {number} scan_count
 * @property {NumberMap} recent_scans
 * @property {NumberMap} states
 */

/**
 * @typedef {object} SiteHeadersResult
 * @property {StringMap} public_headers
 * @property {StringMap} private_headers
 * @property {StringMap} cookies
 */

/**
 * @typedef {object} TestResult
 * @property {number} id
 * @property {number} site_id
 * @property {number} scan_id
 * @property {string} name
 * @property {string} expectation
 * @property {string} result
 * @property {number} score_modifier
 * @property {boolean} pass
 * @property {Output} output
 */

/**
 * @typedef {object} ScanRow
 * @property {number} id
 * @property {number} site_id
 * @property {string} state
 * @property {string} start_time
 * @property {string} [end_time]
 * @property {number} algorithm_version
 * @property {number} tests_failed
 * @property {number} tests_passed
 * @property {number} tests_quantity
 * @property {string} [grade]
 * @property {number} [score]
 * @property {string} [error]
 * @property {StringMap} response_headers
 * @property {number} [status_code]
 */

/**
 * @typedef {object} GradeDistributionRow
 * @property {string} grade
 * @property {number} count
 */

/**
 * @typedef {object} VersionResponse
 * @property {string} commit
 * @property {string} version
 * @property {string} source
 * @property {string} build
 */
