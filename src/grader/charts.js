import { Expectation } from "../types.js";

/**
 * @type {Map<number, string>}
 * */
export const GRADE_CHART = new Map([
  [100, "A+"],
  [95, "A"],
  [90, "A"],
  [85, "A-"],
  [80, "B+"],
  [75, "B"],
  [70, "B"],
  [65, "B-"],
  [60, "C+"],
  [55, "C"],
  [50, "C"],
  [45, "C-"],
  [40, "D+"],
  [35, "D"],
  [30, "D"],
  [25, "D-"],
  [20, "F"],
  [15, "F"],
  [10, "F"],
  [5, "F"],
  [0, "F"],
]);

export const MINIMUM_SCORE_FOR_EXTRA_CREDIT = 90;

/**
 * @type {Set<string>}
 * */
export const GRADES = new Set(GRADE_CHART.values());

/** @type {import("../types.js").StringMap} */
export const TEST_TITLES = {
  "cross-origin-resource-sharing": "Cross Origin Resource Sharing (CORS)",
  "cross-origin-resource-policy": "Cross Origin Resource Policy",
  "content-security-policy": "Content Security Policy (CSP)",
  redirection: "Redirection",
  "referrer-policy": "Referrer Policy",
  "strict-transport-security": "Strict Transport Security (HSTS)",
  "subresource-integrity": "Subresource Integrity",
  "x-content-type-options": "X-Content-Type-Options",
  "x-frame-options": "X-Frame-Options",
  cookies: "Cookies",
};

export const TEST_TOPIC_LINKS = new Map([
  [
    "content-security-policy",
    "/en-US/docs/Web/Security/Practical_implementation_guides/CSP",
  ],
  [
    "cookies",
    "/en-US/docs/Web/Security/Practical_implementation_guides/Cookies",
  ],
  [
    "cross-origin-resource-policy",
    "/en-US/docs/Web/Security/Practical_implementation_guides/CORP",
  ],
  [
    "cross-origin-resource-sharing",
    "/en-US/docs/Web/Security/Practical_implementation_guides/CORS",
  ],
  [
    "redirection",
    "/en-US/docs/Web/Security/Practical_implementation_guides/TLS#http_redirection",
  ],
  [
    "referrer-policy",
    "/en-US/docs/Web/Security/Practical_implementation_guides/Referrer_policy",
  ],
  [
    "strict-transport-security",
    "/en-US/docs/Web/Security/Practical_implementation_guides/TLS#http_strict_transport_security_implementation",
  ],
  ["subresource-integrity", "/en-US/docs/Web/Security/Subresource_Integrity"],
  [
    "x-content-type-options",
    "/en-US/docs/Web/Security/Practical_implementation_guides/MIME_types",
  ],
  [
    "x-frame-options",
    "/en-US/docs/Web/Security/Practical_implementation_guides/Clickjacking",
  ],
  // inactive, for historic records
  ["contribute", "/en-US/"],
  ["x-xss-protection", "/en-US/docs/Web/HTTP/Headers/X-XSS-Protection"],
]);

/**
 * @type {Map<Expectation, {description: string, modifier: number, recommendation: string}>}
 * */
export const SCORE_TABLE = new Map([
  // CSP
  [
    Expectation.CspImplementedWithNoUnsafeDefaultSrcNone,
    {
      description: `<p>
        Content Security Policy (CSP) implemented with <code>default-src 'none'</code>,
        no <code>'unsafe'</code> and form-action is set to <code>'none'</code> or <code>'self'</code>
        </p>`,
      modifier: 10,
      recommendation: ``,
    },
  ],
  [
    Expectation.CspImplementedWithNoUnsafe,
    {
      description: `<p>
        Content Security Policy (CSP) implemented without <code>'unsafe-inline'</code> or <code>'unsafe-eval'</code>
        </p>`,
      modifier: 5,
      recommendation: `<p>
      Set <code>default-src</code> to <code>'none'</code>
      </p>`,
    },
  ],
  [
    Expectation.CspImplementedWithUnsafeInlineInStyleSrcOnly,
    {
      description: `<p>
      Content Security Policy (CSP) implemented with unsafe sources inside style-src. This includes <code>'unsafe-inline'</code>, <code>data:</code> or overly broad sources such as <code>https</code>. <code>'form-action'</code> is set to <code>'self'</code>, <code>'none'</code> or <code>'specific source'</code>
      </p>`,
      modifier: 0,
      recommendation: `
        <p>
          Lock down <code>style-src</code> directive, removing <code>'unsafe-inline'</code>, <code>data:</code> and broad sources.
        </p>`,
    },
  ],
  [
    Expectation.CspImplementedWithInsecureSchemeInPassiveContentOnly,
    {
      description: `<p>
      Content Security Policy (CSP) implemented, but secure site allows images or media to be loaded over HTTP
      </p>`,
      modifier: -10,
      recommendation: `<p>
        Load images and media over HTTPS and prevent their loading over HTTP with the <code>img-src</code> and <code>media-src</code> or <code>default-src</code> directives
      </p>`,
    },
  ],
  [
    Expectation.CspImplementedWithUnsafeEval,
    {
      description: `<p>
      Content Security Policy (CSP) implemented, but allows <code>'unsafe-eval'</code> and allows forms to be submitted to any source.
      </p>`,
      modifier: -10,
      recommendation: `<p>First remove the use of <code>eval()</code> from the codebase and once completed, remove <code>'unsafe-eval'</code> from the CSP header.</p>`,
    },
  ],
  [
    Expectation.CspImplementedWithUnsafeInline,
    {
      description: `<p>
      Content Security Policy (CSP) implemented unsafely. This includes <code>'unsafe-inline'</code> or <code>data:</code> inside <code>script-src</code>, overly broad sources such as <code>https:</code> inside <code>object-src</code> or <code>script-src</code>, or not restricting the sources for <code>object-src</code> or <code>script-src</code>.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Remove <code>unsafe-inline</code> and <code>data:</code> from <code>script-src</code>, overly broad sources from <code>object-src</code> and <code>script-src</code>, and ensure <code>object-src</code> and <code>script-src</code> are set.
      </p>`,
    },
  ],
  [
    Expectation.CspImplementedWithInsecureScheme,
    {
      description: `<p>
      Content Security Policy (CSP) implemented, but secure site allows resources to be loaded over HTTP
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Load resources over HTTPS and remove any HTTP sources from your CSP.
      </p>`,
    },
  ],
  [
    Expectation.CspHeaderInvalid,
    {
      description: `<p>
        Content Security Policy (CSP) header cannot be parsed successfully
        </p>`,
      modifier: -25,
      recommendation: `<p>
      Check your CSP syntax with the <a href="https://csp-evaluator.withgoogle.com/" target="_blank" rel="noreferrer" class="external">CSP Evaluator</a>
      </p>.`,
    },
  ],
  [
    Expectation.CspNotImplemented,
    {
      description: `<p>
      Content Security Policy (CSP) header not implemented
      </p>`,
      modifier: -25,
      recommendation: `<p>
      Implement one, see <a href="/en-US/docs/Web/HTTP/CSP">MDN's Content Security Policy (CSP) documentation</a>.
      </p>`,
    },
  ],
  [
    Expectation.CspNotImplementedButReportingEnabled,
    {
      description: `<p>
      Content Security Policy (CSP) reporting implemented only, with <code>Content-Security-Policy-Report-Only</code> header.
      </p>`,
      modifier: -25,
      recommendation: `<p>
      Implement an enforced policy, see <a href="/en-US/docs/Web/HTTP/CSP">MDN's Content Security Policy (CSP) documentation</a>.
      </p>`,
    },
  ],
  [
    Expectation.CspImplementedButDuplicateDirectives,
    {
      description: `<p>
        Content Security Policy (CSP) implemented, but contains duplicate directives.
        </p>`,
      modifier: 0,
      recommendation: `<p>Remove duplicate directives from the CSP</p>`,
    },
  ],

  // Cookies
  [
    Expectation.CookiesSecureWithHttponlySessionsAndSamesite,
    {
      description: `<p>
        All cookies use the <code>Secure</code> flag, session cookies use the <code>HttpOnly</code> flag, and cross-origin restrictions are in place via the <code>SameSite</code> flag.
        </p>`,
      modifier: 5,
      recommendation: ``,
    },
  ],
  [
    Expectation.CookiesSecureWithHttponlySessions,
    {
      description: `<p>
        All cookies use the <code>Secure</code> flag and all session cookies use the <code>HttpOnly</code> flag.
        </p>`,
      modifier: 0,
      recommendation: `<p>
      Use <code>SameSite</code>.
      </p>`,
    },
  ],
  [
    Expectation.CookiesNotFound,
    {
      description: `<p>
      No cookies detected
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.CookiesWithoutSecureFlagButProtectedByHsts,
    {
      description: `<p>
        Cookies set without using the <code>Secure</code> flag, but transmission over HTTP prevented by HSTS.
        </p>`,
      modifier: -5,
      recommendation: `<p>
      Use <code>Secure</code> flag.
      </p>`,
    },
  ],
  [
    Expectation.CookiesSessionWithoutSecureFlagButProtectedByHsts,
    {
      description: `<p>
        Session cookie set without the <code>Secure</code> flag, but transmission over HTTP prevented by HSTS.
        </p>`,
      modifier: -10,
      recommendation: `<p>
      Use <code>Secure</code> flag.
      </p>`,
    },
  ],
  [
    Expectation.CookiesWithoutSecureFlag,
    {
      description: `<p>
      Cookies set without using the <code>Secure</code> flag or set over HTTP.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Use <code>Secure</code> flag and set up HSTS.
      </p>`,
    },
  ],
  [
    Expectation.CookiesSamesiteFlagInvalid,
    {
      description: `<p>
        Cookies use <code>SameSite</code> flag, but set to something other than <code>Strict</code> or <code>Lax</code>
        </p>`,
      modifier: -20,
      recommendation: `<p>
      Use <code>SameSite</code> <code>Strict</code> or <code>Lax</code>.
      </p>`,
    },
  ],
  [
    Expectation.CookiesAnticsrfWithoutSamesiteFlag,
    {
      description: `<p>
      Anti-CSRF tokens set without using the <code>SameSite</code> flag.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Use <code>SameSite</code> <code>Strict</code> or <code>Lax</code>.
      </p>`,
    },
  ],
  [
    Expectation.CookiesSessionWithoutHttponlyFlag,
    {
      description: `<p>
      Session cookie set without using the <code>HttpOnly</code> flag.
      </p>`,
      modifier: -30,
      recommendation: `<p>
      Use <code>HttpOnly</code>
      </p>`,
    },
  ],
  [
    Expectation.CookiesSessionWithoutSecureFlag,
    {
      description:
        "Session cookie set without using the <code>Secure</code> flag or set over HTTP.",
      modifier: -40,
      recommendation: `<p>
      Use <code>Secure</code> flag and set up HSTS.
      </p>`,
    },
  ],

  // CORS
  [
    Expectation.CrossOriginResourceSharingNotImplemented,
    {
      description: `<p>
      Content is not visible via cross-origin resource sharing (CORS) files or headers.
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.CrossOriginResourceSharingImplementedWithPublicAccess,
    {
      description: `<p>
        Public content is visible via cross-origin resource sharing (CORS) <code>Access-Control-Allow-Origin</code> header.
        </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.CrossOriginResourceSharingImplementedWithRestrictedAccess,
    {
      description: `<p>Content is visible via cross-origin resource sharing (CORS) files or headers, but is restricted to specific domains.</p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.CrossOriginResourceSharingImplementedWithUniversalAccess,
    {
      description: `<p>
      Content is visible via cross-origin resource sharing (CORS) file or headers, and credentials can be sent. <em>Your site could be vulnerable to CSRF attacks</em>.
      </p>`,
      modifier: -50,
      recommendation: `
        <p>
          If credentialed access is required from specific origins, ensure <code>Access-Control-Allow-Origin</code> can only be set to those origins, rather than reflecting the Origin header. If public non-credentialed access is required, set <code>Access-Control-Allow-Origin</code> to <code>*</code> and omit the <code>Access-Control-Allow-Credentials</code> header. Otherwise, omit both headers.
        </p>
        `,
    },
  ],

  // Redirection
  [
    Expectation.RedirectionAllRedirectsPreloaded,
    {
      description: `<p>
      All hosts redirected to are in the HTTP Strict Transport Security (HSTS) preload list.
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.RedirectionToHttps,
    {
      description: `<p>
      Initial redirection is to HTTPS on same host, final destination is HTTPS
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.RedirectionNotNeededNoHttp,
    {
      description: `<p>
      Not able to connect via HTTP, so no redirection necessary.
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.RedirectionOffHostFromHttp,
    {
      description: `<p>
      Initial redirection from HTTP to HTTPS is to a different host, preventing HSTS.
      </p>`,
      modifier: -5,
      recommendation: `<p>
      HSTS headers aren't recognized when set over HTTP, so redirect to the same host on HTTPS first, then redirect to the final host.
      </p>`,
    },
  ],
  [
    Expectation.RedirectionNotToHttpsOnInitialRedirection,
    {
      description: `<p>
      Redirects to HTTPS eventually, but initial redirection is to another HTTP URL.
      </p>`,
      modifier: -10,
      recommendation: `<p>
      Redirect to the same host on HTTPS first, then redirect to the final host on HTTPS.
      </p>`,
    },
  ],
  [
    Expectation.RedirectionNotToHttps,
    {
      description: `<p>
      Redirects, but final destination is not an HTTPS URL.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Redirect to the same host on HTTPS first, then redirect to the final host on HTTPS.
      </p>`,
    },
  ],
  [
    Expectation.RedirectionMissing,
    {
      description: `<p>
      Does not redirect to an HTTPS site.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Redirect to the same host on HTTPS first, then redirect to the final host on HTTPS.
      </p>`,
    },
  ],
  [
    Expectation.RedirectionInvalidCert,
    {
      description: `<p>
      Invalid certificate chain encountered during redirection.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Install a valid TLS certificate on the server. <a href="https://letsencrypt.org/" target="_blank" rel="noreferrer" class="external">Let's Encrypt</a> is a good choice, as are certificates managed by your cloud provider or commercially sold ones.
      </p>`,
    },
  ],

  // Referrer Policy
  [
    Expectation.ReferrerPolicyPrivate,
    {
      description: `<p>
        <code>Referrer-Policy</code> header set to <code>no-referrer</code>, <code>same-origin</code>, <code>strict-origin</code> or <code>strict-origin-when-cross-origin</code>.
        </p>`,
      modifier: 5,
      recommendation: `<p class="obs-none">None<p>`,
    },
  ],
  [
    Expectation.ReferrerPolicyNotImplemented,
    {
      description: `<p>
      <code>Referrer-Policy</code> header not implemented.
      </p>`,
      modifier: 0,
      recommendation: `<p>
      Set to <code>strict-origin-when-cross-origin</code> at a minimum.
      </p>`,
    },
  ],
  [
    Expectation.ReferrerPolicyUnsafe,
    {
      description: `<p>
        <code>Referrer-Policy</code> header set unsafely to <code>origin</code>, <code>origin-when-cross-origin</code>, <code>unsafe-url</code> or <code>no-referrer-when-downgrade</code>.
        </p>`,
      modifier: -5,
      recommendation: `<p>
      Set to strict-origin-when-cross-origin at a minimum
      </p>`,
    },
  ],
  [
    Expectation.ReferrerPolicyHeaderInvalid,
    {
      description: `<p>
      <code>Referrer-Policy</code> header cannot be recognized.
      </p>`,
      modifier: -5,
      recommendation: `<p>
      Set to strict-origin-when-cross-origin at a minimum
      </p>`,
    },
  ],

  // HSTS
  [
    Expectation.HstsPreloaded,
    {
      description: `<p>
        Preloaded via the HTTP Strict Transport Security (HSTS) preloading process.
        </p>`,
      modifier: 5,
      recommendation: ``,
    },
  ],
  [
    Expectation.HstsImplementedMaxAgeAtLeastSixMonths,
    {
      description: `<p>
        <code>Strict-Transport-Security</code> header set to a minimum of six months (15768000).
        </p>`,
      modifier: 0,
      recommendation: `<p>
      Consider preloading: this requires adding the <code>preload</code> and <code>includeSubDomains</code> directives and setting <code>max-age</code> to at least <code>31536000</code> (1 year), and submitting your site to <a href="https://hstspreload.org/" target="_blank" rel="noreferrer" class="external">https://hstspreload.org/</a>.
      </p>`,
    },
  ],
  [
    Expectation.HstsImplementedMaxAgeLessThanSixMonths,
    {
      description: `<p>
      <code>Strict-Transport-Security</code> header set to less than six months (15768000).
      </p>`,
      modifier: -10,
      recommendation: `<p>
      Increase HSTS period.
      </p>`,
    },
  ],
  [
    Expectation.HstsNotImplemented,
    {
      description: `<p>
      <code>Strict-Transport-Security</code> header not implemented.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Add HSTS. Consider rolling out with shorter periods first (as suggested on <a href="https://hstspreload.org/#deployment-recommendations" target="_blank" rel="noreferrer" class="external">https://hstspreload.org/</a>).
      </p>`,
    },
  ],
  [
    Expectation.HstsHeaderInvalid,
    {
      description: `<p>
        <code>Strict-Transport-Security</code> header cannot be recognized
        </p>`,
      modifier: -20,
      recommendation: `<p>
      Read <a href="/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security">MDN's documentation on HTTP Strict Transport Security</a>.
      </p>`,
    },
  ],
  [
    Expectation.HstsNotImplementedNoHttps,
    {
      description: `<p>
        <code>Strict-Transport-Security</code> header cannot be set for sites not available over HTTPS.
       </p>`,
      modifier: -20,
      recommendation: `<p>
      Make your site available over <a href="/en-US/docs/Glossary/HTTPS">HTTPS</a>. <a href="https://letsencrypt.org/getting-started/" target="_blank" rel="noreferrer" class="external">Let's Encrypt docs</a> are a good starting point.
      </p>`,
    },
  ],
  [
    Expectation.HstsInvalidCert,
    {
      description: `<p>
      <code>Strict-Transport-Security</code> header cannot be set, as site contains an invalid certificate chain.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      HSTS can only work with a valid TLS certificate on the server. <a href="https://letsencrypt.org/" target="_blank" rel="noreferrer" class="external">Let's Encrypt</a> is a good choice, as are certificates managed by your cloud provider or commercially sold ones.
      </p>`,
    },
  ],

  // SRI
  [
    Expectation.SriImplementedAndAllScriptsLoadedSecurely,
    {
      description: `<p>
      Subresource Integrity (SRI) is implemented and all scripts are loaded from a similar origin.
      </p>`,
      modifier: 5,
      recommendation: ``,
    },
  ],
  [
    Expectation.SriImplementedAndExternalScriptsLoadedSecurely,
    {
      description: `<p>
      Subresource Integrity (SRI) is implemented and all scripts are loaded securely.
      </p>`,
      modifier: 5,
      recommendation: ``,
    },
  ],
  [
    Expectation.SriNotImplementedResponseNotHtml,
    {
      description: `<p>
      Subresource Integrity (SRI) is only needed for HTML resources.
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.SriNotImplementedButNoScriptsLoaded,
    {
      description: `<p>
      Subresource Integrity (SRI) is not needed since site contains no script tags.
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.SriNotImplementedButAllScriptsLoadedFromSecureOrigin,
    {
      description: `<p>
      Subresource Integrity (SRI) not implemented, but all scripts are loaded from a similar origin.
      </p>`,
      modifier: 0,
      recommendation: `<p>
      Add SRI for bonus points.
      </p>`,
    },
  ],
  [
    Expectation.SriNotImplementedButExternalScriptsLoadedSecurely,
    {
      description: `<p>
      Subresource Integrity (SRI) not implemented, but all external scripts are loaded over HTTPS.
      </p>`,
      modifier: -5,
      recommendation: `<p>
      Add SRI to external scripts.
      </p>`,
    },
  ],
  [
    Expectation.SriImplementedButExternalScriptsNotLoadedSecurely,
    {
      description: `<p>
      Subresource Integrity (SRI) implemented, but external scripts are loaded over HTTP or use protocol-relative URLs via <code>src="//..."</code>.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Load external scripts over HTTPS.
      </p>`,
    },
  ],
  [
    Expectation.SriNotImplementedAndExternalScriptsNotLoadedSecurely,
    {
      description: `<p>
        Subresource Integrity (SRI) not implemented, and external scripts are loaded over HTTP or use protocol-relative URLs via <code>src="//..."</code>.
        </p>`,
      modifier: -50,
      recommendation: `<p>
      Load external scripts over HTTPS, and add SRI to them.
      </p>`,
    },
  ],

  // X-Content-Type-Options
  [
    Expectation.XContentTypeOptionsNosniff,
    {
      description: `<p>
      <code>X-Content-Type-Options</code> header set to <code>nosniff</code>.
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.XContentTypeOptionsNotImplemented,
    {
      description: `<p>
      <code>X-Content-Type-Options</code> header not implemented.
      </p>`,
      modifier: -5,
      recommendation: `<p>
      Set to <code>nosniff</code>.
      </p>`,
    },
  ],
  [
    Expectation.XContentTypeOptionsHeaderInvalid,
    {
      description: `<p>
      <code>X-Content-Type-Options</code> header cannot be recognized.
      </p>`,
      modifier: -5,
      recommendation: `<p>
      Set to <code>nosniff</code>.
      </p>`,
    },
  ],

  // X-Frame-Options
  [
    Expectation.XFrameOptionsImplementedViaCsp,
    {
      description: `<p>
      <code>X-Frame-Options</code> (XFO) implemented via the CSP frame-ancestors directive.
      </p>`,
      modifier: 5,
      recommendation: ``,
    },
  ],
  [
    Expectation.XFrameOptionsSameoriginOrDeny,
    {
      description: `<p>
      <code>X-Frame-Options</code> (XFO) header set to <code>SAMEORIGIN</code> or <code>DENY</code>.
      </p>`,
      modifier: 0,
      recommendation: `<p>
      Implement frame-ancestors CSP.
      </p>`,
    },
  ],
  [
    Expectation.XFrameOptionsAllowFromOrigin,
    {
      description: `<p>
      <code>X-Frame-Options</code> (XFO) header uses <code>ALLOW-FROM</code> uri directive.
      </p>`,
      modifier: 0,
      recommendation: `<p>
      Implement frame-ancestors CSP.
      </p>`,
    },
  ],
  [
    Expectation.XFrameOptionsNotImplemented,
    {
      description: `<p>
      <code>X-Frame-Options</code> (XFO) header not implemented.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Implement frame-ancestors CSP.
      </p>`,
    },
  ],
  [
    Expectation.XFrameOptionsHeaderInvalid,
    {
      description: `<p>
      <code>X-Frame-Options</code> (XFO) header cannot be recognized.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Implement frame-ancestors CSP.
      </p>`,
    },
  ],

  // Cross Origin Resource Policy

  [
    Expectation.CrossOriginResourcePolicyHeaderInvalid,
    {
      description: `<p>
        Cross-Origin-Resource-Policy (CORP) header cannot be recognized.
        </p>`,
      modifier: -5,
      recommendation: `<p>
      Implement <a href="/en-US/docs/Web/HTTP/Cross-Origin_Resource_Policy">Cross Origin Resource Policy</a>.
      </p>`,
    },
  ],
  [
    Expectation.CrossOriginResourcePolicyImplementedWithCrossOrigin,
    {
      description: `<p>
      Cross Origin Resource Policy (CORP) implemented, but allows cross-origin resource sharing by default.
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],
  [
    Expectation.CrossOriginResourcePolicyImplementedWithSameOrigin,
    {
      description: `<p>
      Cross Origin Resource Policy (CORP) implemented, prevents leaks into cross-origin contexts.
      </p>`,
      modifier: 10,
      recommendation: ``,
    },
  ],
  [
    Expectation.CrossOriginResourcePolicyImplementedWithSameSite,
    {
      description: `<p>
        Cross Origin Resource Policy (CORP) implemented, prevents leaks into cross-site contexts.
        </p>`,
      modifier: 10,
      recommendation: ``,
    },
  ],
  [
    Expectation.CrossOriginResourcePolicyNotImplemented,
    {
      description: `<p>
      Cross Origin Resource Policy (CORP) is not implemented (defaults to <code>cross-origin</code>).
      </p>`,
      modifier: 0,
      recommendation: ``,
    },
  ],

  // GENERIC
  [
    Expectation.HtmlNotParseable,
    {
      description: `<p>
      Claims to be html, but cannot be parsed.
      </p>`,
      modifier: -20,
      recommendation: `<p>
      Make sure the server returns correct HTML.
      </p>`,
    },
  ],
]);
