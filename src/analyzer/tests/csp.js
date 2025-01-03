import {
  CONTENT_SECURITY_POLICY,
  CONTENT_SECURITY_POLICY_REPORT_ONLY,
} from "../../headers.js";
import { Requests, Policy, BaseOutput } from "../../types.js";
import { Expectation } from "../../types.js";
import {
  DUPLICATE_WARNINGS_KEY,
  parseCsp,
  parseCspMeta,
} from "../cspParser.js";
import { getHttpHeaders } from "../utils.js";

const DANGEROUSLY_BROAD = new Set([
  "ftp:",
  "http:",
  "https:",
  "*",
  "http://*",
  "http://*.*",
  "https://*",
  "https://*.*",
]);
const UNSAFE_INLINE = new Set(["'unsafe-inline'", "data:"]);
const DANGEROUSLY_BROAD_AND_UNSAFE_INLINE = new Set([
  ...DANGEROUSLY_BROAD,
  ...UNSAFE_INLINE,
]);

// Passive content check
const PASSIVE_DIRECTIVES = new Set(["img-src", "media-src"]);

//What do nonces and hashes start with?
const NONCES_HASHES = new Set(["'sha256-", "'sha384-", "'sha512-", "'nonce-"]);

export class CspOutput extends BaseOutput {
  /** @type {import("../../types.js").CspMap | null} */
  data = null;
  http = false;
  meta = false;
  /** @type {Policy | null} */
  policy = null;
  numPolicies = 0;
  static name = "content-security-policy";
  static title = "Content Security Policy (CSP)";
  static possibleResults = [
    Expectation.CspImplementedWithNoUnsafeDefaultSrcNone,
    Expectation.CspImplementedWithNoUnsafe,
    Expectation.CspImplementedWithUnsafeInlineInStyleSrcOnly,
    Expectation.CspImplementedWithInsecureSchemeInPassiveContentOnly,
    Expectation.CspImplementedWithUnsafeEval,
    Expectation.CspImplementedWithUnsafeInline,
    Expectation.CspImplementedWithInsecureScheme,
    Expectation.CspImplementedButDuplicateDirectives,
    Expectation.CspHeaderInvalid,
    Expectation.CspNotImplemented,
    Expectation.CspNotImplementedButReportingEnabled,
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
 * @param {string[]} sources
 * @returns {boolean}
 */
function startsWithNoncesHash(sources) {
  return sources.some((source) =>
    [...NONCES_HASHES].some((nonceHash) => source.startsWith(nonceHash))
  );
}

/**
 *
 * @param {Requests} requests
 * @param {Expectation} [expectation]
 * @returns {CspOutput}
 */
export function contentSecurityPolicyTest(
  requests,
  expectation = Expectation.CspImplementedWithNoUnsafe
) {
  const output = new CspOutput(expectation);
  const response = requests.responses.auto;
  const url = requests.session?.url;

  if (!response || !url) {
    output.result = Expectation.CspNotImplemented;
    return output;
  }

  const httpCspHeader = getHttpHeaders(response, CONTENT_SECURITY_POLICY);
  const equivCspHeader =
    response?.httpEquiv?.get(CONTENT_SECURITY_POLICY) ?? [];

  output.numPolicies = equivCspHeader.length + httpCspHeader.length;

  /** @type {Map<string, Set<string>>} */
  let csp;
  /** @type {Map<string, Set<string>>} */
  let httpHeaderOnlyCsp;
  /** @type {Map<string, Set<string>>} */
  let metaCsp;

  try {
    csp = parseCsp(
      [...httpCspHeader, ...equivCspHeader].filter((x) => x !== null)
    );
  } catch (e) {
    output.result = Expectation.CspHeaderInvalid;
    return output;
  }

  try {
    httpHeaderOnlyCsp = parseCsp(httpCspHeader);
  } catch (e) {
    httpHeaderOnlyCsp = new Map();
  }

  try {
    metaCsp = parseCspMeta(equivCspHeader);
  } catch (e) {
    metaCsp = new Map();
  }

  // We sum up the header and meta (filtered for validity) sizes,
  // so a single meta tag with a disallowed directive comes out
  // as csp-not-implemented
  if (httpHeaderOnlyCsp.size + metaCsp.size === 0) {
    // Content-Security-Policy-Report-Only is only allowed in headers, not in meta tags
    // see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only
    const httpCspReportOnly =
      // @ts-ignore
      response.headers.get(CONTENT_SECURITY_POLICY_REPORT_ONLY) ?? null;
    if (httpCspReportOnly) {
      output.result = Expectation.CspNotImplementedButReportingEnabled;
    } else {
      output.result = Expectation.CspNotImplemented;
    }
    return output;
  }

  output.policy = new Policy();

  // mark whether we saw csp there or not
  output.http = httpCspHeader?.length > 0;
  output.meta = equivCspHeader?.length > 0;

  // Get the various directives we look at
  const base_uri = csp.get("base-uri") || new Set(["*"]);
  // frame-ancherstors can only be set via header, not via http-equiv meta tag
  // see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
  const frame_ancestors =
    httpHeaderOnlyCsp.get("frame-ancestors") || new Set(["*"]);
  const form_action = csp.get("form-action") || new Set(["*"]);
  const object_src =
    csp.get("object-src") || csp.get("default-src") || new Set(["*"]);
  const script_src =
    csp.get("script-src") || csp.get("default-src") || new Set(["*"]);
  const style_src =
    csp.get("style-src") || csp.get("default-src") || new Set(["*"]);

  // Remove 'unsafe-inline' if nonce or hash are used in script-src or style-src
  for (const sourceList of [script_src, style_src]) {
    if (
      startsWithNoncesHash([...sourceList]) &&
      sourceList.has("'unsafe-inline'")
    ) {
      sourceList.delete("'unsafe-inline'");
    }
  }

  // If a script-src uses 'strict-dynamic', we need to:
  // 1. Check to make sure there's a valid nonce/hash source
  // 2. Remove any source that starts with as scheme
  // 3. Remove 'self' and 'unsafe-inline'
  if (
    startsWithNoncesHash([...script_src]) &&
    script_src.has("'strict-dynamic'")
  ) {
    for (const source of script_src) {
      if (
        [...DANGEROUSLY_BROAD].some((s) => source.startsWith(s)) ||
        source === "'self'" ||
        source === "'unsafe-inline'"
      ) {
        script_src.delete(source);
      }
    }
    output.policy.strictDynamic = true;
  } else if (script_src.has("'strict-dynamic'")) {
    if (output.result === null) {
      output.result = Expectation.CspHeaderInvalid;
    }
  }

  // Some checks look only at active/passive CSP directives
  // This could be inlined, but the code is quite hard to read at that point
  const active_csp_sources = [...csp.entries()]
    .filter(
      ([directive]) =>
        !PASSIVE_DIRECTIVES.has(directive) && directive !== "script-src"
    )
    .flatMap(([, sourceList]) => [...sourceList]);
  active_csp_sources.push(...script_src);

  const passive_csp_sources = [...PASSIVE_DIRECTIVES].flatMap((directive) => [
    ...(csp.get(directive) || csp.get("default-src") || new Set()),
  ]);

  // No 'unsafe-inline' or data: in script-src
  // Also don't allow overly broad schemes such as https: in either object-src or script-src
  // Likewise, if you don't have object-src or script-src defined, then all sources are allowed
  if (
    [...script_src].filter((src) =>
      DANGEROUSLY_BROAD_AND_UNSAFE_INLINE.has(src)
    ).length > 0 ||
    [...object_src].filter((src) => DANGEROUSLY_BROAD.has(src)).length > 0
  ) {
    if (output.result === null) {
      output.result = Expectation.CspImplementedWithUnsafeInline;
    }
    output.policy.unsafeInline = true;
  }

  // If the site is https, it shouldn't allow any http: as a source (active content)

  if (
    url.protocol === "https:" &&
    active_csp_sources.some(
      (source) => source.startsWith("http:") || source.startsWith("ftp:")
    )
  ) {
    if (output.result === null) {
      output.result = Expectation.CspImplementedWithInsecureScheme;
    }
    output.policy.insecureSchemeActive = true;
  }

  // Don't allow 'unsafe-eval' in script-src or style-src
  if (new Set([...script_src, ...style_src]).has("'unsafe-eval'")) {
    if (output.result === null) {
      output.result = Expectation.CspImplementedWithUnsafeEval;
    }
    output.policy.unsafeEval = true;
  }

  // If the site is https, it shouldn't allow any http: as a source (passive content)
  if (
    url.protocol === "https:" &&
    passive_csp_sources.some(
      (source) => source.startsWith("http:") || source.startsWith("ftp:")
    )
  ) {
    if (output.result === null) {
      output.result =
        Expectation.CspImplementedWithInsecureSchemeInPassiveContentOnly;
    }
    output.policy.insecureSchemePassive = true;
  }

  // Don't allow 'unsafe-inline', data:, or overly broad sources in style-src
  if (
    [...style_src].some((source) =>
      DANGEROUSLY_BROAD_AND_UNSAFE_INLINE.has(source)
    )
  ) {
    if (output.result === null) {
      output.result = Expectation.CspImplementedWithUnsafeInlineInStyleSrcOnly;
    }
    output.policy.unsafeInlineStyle = true;
  }

  if (
    csp.get("default-src")?.has("'none'") &&
    csp.get("default-src")?.size === 1
  ) {
    if (output.result === null) {
      output.result = Expectation.CspImplementedWithNoUnsafeDefaultSrcNone;
    }
    output.policy.defaultNone = true;
  } else {
    if (output.result === null) {
      output.result = Expectation.CspImplementedWithNoUnsafe;
    }
  }

  // Some other checks for the CSP analyzer
  output.policy.antiClickjacking = ![...frame_ancestors].some((source) =>
    DANGEROUSLY_BROAD.has(source)
  );
  output.policy.insecureBaseUri = [...base_uri].some((source) =>
    DANGEROUSLY_BROAD_AND_UNSAFE_INLINE.has(source)
  );
  output.policy.insecureFormAction = [...form_action].some((source) =>
    DANGEROUSLY_BROAD.has(source)
  );
  output.policy.unsafeObjects = [...object_src].some((source) =>
    DANGEROUSLY_BROAD.has(source)
  );

  // Check to see if the test passed or failed
  // If it passed, report any duplicate report-uri/report-to directives
  if (
    [
      expectation,
      Expectation.CspImplementedWithNoUnsafeDefaultSrcNone,
      Expectation.CspImplementedWithUnsafeInlineInStyleSrcOnly,
      Expectation.CspImplementedWithInsecureSchemeInPassiveContentOnly,
    ].includes(output.result)
  ) {
    output.pass = true;
    if (csp.has(DUPLICATE_WARNINGS_KEY)) {
      output.result = Expectation.CspImplementedButDuplicateDirectives;
    }
  }

  output.data = {};
  for (const [key, value] of csp) {
    // filter out the duplicate warnings key from the parsed CSP
    if (key === DUPLICATE_WARNINGS_KEY) {
      continue;
    }
    output.data[key] = [...value].sort();
  }

  return output;
}
