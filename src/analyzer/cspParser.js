const compareString = Intl.Collator("en").compare;

const SHORTEST_DIRECTIVE = "img-src";
const SHORTEST_DIRECTIVE_LENGTH = SHORTEST_DIRECTIVE.length - 1; // the shortest policy accepted by the CSP test
const DIRECTIVES_DISALLOWED_IN_META = [
  "frame-ancestors",
  "report-uri",
  "sandbox",
];
const ALLOWED_DUPLICATE_KEYS = new Set(["report-uri", "report-to"]);
export const DUPLICATE_WARNINGS_KEY = "_observatory_duplicate_key_warnings";

/**
 * Parse CSP from meta tags, weeding out directives
 * only allowed in headers.
 * See https://html.spec.whatwg.org/#attr-meta-http-equiv-content-security-policy
 * @param {string[]} cspList
 * @returns {Map<string, Set<string>>}
 */
export function parseCspMeta(cspList) {
  const ret = parseCsp(cspList);
  for (const directive of DIRECTIVES_DISALLOWED_IN_META) {
    ret.delete(directive);
  }
  return ret;
}

/**
 * The returned Map has the directive as the key and a Set of sources as the value.
 * If there are allowed duplicates detected, the first one is kept and the rest are discarded,
 * and an entry in the final Map is added with the key "_observatory_duplicate_key_warnings"
 * and the directive's name as the value.
 *
 * @param {string[]} cspList
 * @returns {Map<string, Set<string>>}
 */
export function parseCsp(cspList) {
  const cleanCspList = cspList.map((cspString) =>
    cspString.replaceAll(/[\r\n]/g, "").trim()
  );
  if (cleanCspList.length === 0) {
    return new Map();
  }

  for (const cspString of cleanCspList) {
    if (!cspString || cspString.length < SHORTEST_DIRECTIVE_LENGTH) {
      throw new Error(`Invalid policy: ${cspString}`);
    }
  }

  /**  @type {Map<string, {source: string, index: number, keep: boolean}[]>} */
  const csp = new Map();
  /**  @type {Set<string>} */
  const duplicate_warnings = new Set();

  for (const [policyIndex, policy] of cleanCspList.entries()) {
    const directiveSeenBeforeThisPolicy = new Set();

    // since we can have multiple policies, we need to iterate through each policy
    for (const [directiveEntry, ...valueEntries] of policy
      .split(";")
      .map((entry) => entry.trim().split(/\s+/))) {
      if (!directiveEntry) {
        continue;
      }
      // Using lower due to directives being case insensitive after CSP3
      const directive = directiveEntry.toLowerCase();

      // While technically valid in that you just use the first entry, we are saying that repeated
      // directives are invalid so that people notice it. The exception are duplicate report-uri
      // and report-to directives, which we allow.
      if (directiveSeenBeforeThisPolicy.has(directive)) {
        if (ALLOWED_DUPLICATE_KEYS.has(directive)) {
          duplicate_warnings.add(directive);
        } else {
          throw new Error(
            `Duplicate directive ${directive} in policy ${policyIndex}`
          );
        }
      } else {
        directiveSeenBeforeThisPolicy.add(directive);
      }

      const values = [];
      const keep = policyIndex === 0;
      if (valueEntries.length) {
        values.push(
          ...valueEntries.map((rawSource) => {
            const source = rawSource.trim().toLocaleLowerCase();
            return {
              source,
              index: policyIndex,
              keep,
            };
          })
        );
      } else if (valueEntries.length === 0 && directive.endsWith("-src")) {
        // if it's a source list with no values, it's 'none'
        values.push({
          source: "'none'",
          index: policyIndex,
          keep,
        });
      }
      const combinedSources =
        policyIndex === 0
          ? [...values]
          : [...(csp.get(directive) || []), ...values];
      combinedSources.sort((a, b) => compareString(a.source, b.source));

      if (combinedSources.length > 1) {
        for (let index = 1; index < combinedSources.length; index++) {
          const source = combinedSources[index];
          // convenience variable pointing to previous entry in the combined list
          const prev = combinedSources[index - 1];

          // if it's from the same policy and they start with the same thing, the longer one is
          // superfluous, e.g. https://example.com/foo and https://example.com/foobar
          if (
            source.index === prev.index &&
            source.source.startsWith(prev.source)
          ) {
            source.keep = false;
          }

          // a source _has_ to exist in both policies for it to count
          if (
            source.index !== prev.index &&
            pathPartMatch(prev.source, source.source)
          ) {
            source.keep = true;
          }
        }
      }
      // now we need to purge anything that's not necessary and store it into the policy
      csp.set(
        directive,
        combinedSources.filter((source) => source.keep)
      );

      // the first time through the loop is special case -- everything is marked as True to keep,
      // and only purged if it has a shorter match. however, if we are going to have more loops through
      // due to having multiple CSP policies, then everything needs to be marked False to keep and
      // then forcibly kept in future loops
      if (policyIndex === 0 && cspList.length > 1) {
        for (const source of csp.get(directive) || []) {
          source.keep = false;
        }
      }
    }
  }
  // now we need to flatten out all the CSP directives (e.g. (source, index, False) back into actual values
  // if they had defined a directive and didn't have a value remaining, then force it to none
  const finalCsp = new Map(
    [...csp.entries()].map(([directive, sources]) => [
      directive,
      sources.length
        ? new Set([...sources.values()].map((source) => source.source))
        : new Set(["'none'"]),
    ])
  );
  if (duplicate_warnings.size) {
    finalCsp.set(DUPLICATE_WARNINGS_KEY, duplicate_warnings);
  }
  return finalCsp;
}

/**
 *
 * @param {string} pathA
 * @param {string} pathB
 * @returns
 */
function pathPartMatch(pathA, pathB) {
  if (pathA.length === 0) {
    return true;
  }
  if (pathA === "/" && pathB.length === 0) {
    return true;
  }
  const exactMatch = !pathA.endsWith("/");
  const pathListA = pathA.split("/");
  const pathListB = pathB.split("/");
  if (pathListA.length > pathListB.length) {
    return false;
  }
  if (exactMatch && pathListA.length !== pathListB.length) {
    return false;
  }
  if (!exactMatch) {
    pathListA.pop();
  }
  for (let i = 0; i < pathListA.length; i++) {
    const pieceA = decodeURIComponent(pathListA[i]);
    const pieceB = decodeURIComponent(pathListB[i]);
    if (pieceA !== pieceB) {
      return false;
    }
  }
  return true;
}
