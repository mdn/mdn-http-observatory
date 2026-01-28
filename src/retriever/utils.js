import {
  collectElements,
  getAttribute,
  hasAttribute,
} from "../utils/html-parser.js";
import { CONTENT_SECURITY_POLICY, REFERRER_POLICY } from "../headers.js";

/**
 *
 * @param {string} html
 * @param {string} _baseUrl
 * @returns {Map<string, string[]>}
 */
export function parseHttpEquivHeaders(html, _baseUrl) {
  /** @type {Map<string, string[]>} */
  const httpEquivHeaders = new Map([[CONTENT_SECURITY_POLICY, []]]);

  try {
    const metas = collectElements(html, "meta");

    for (const meta of metas) {
      if (hasAttribute(meta, "http-equiv") && hasAttribute(meta, "content")) {
        const httpEquiv = getAttribute(meta, "http-equiv")
          ?.toLowerCase()
          .trim();
        const content = getAttribute(meta, "content");
        if (content && httpEquiv === CONTENT_SECURITY_POLICY) {
          httpEquivHeaders.get(CONTENT_SECURITY_POLICY)?.push(content);
        }
      } else if (
        // Technically not HTTP Equiv, but we're treating it that way
        getAttribute(meta, "name")?.toLowerCase().trim() === "referrer"
      ) {
        const attr = getAttribute(meta, "content");
        if (attr) {
          httpEquivHeaders.set(REFERRER_POLICY, [attr]);
        }
      }
    }
  } catch (e) {
    console.error("Error parsing HTTP Equiv headers", e);
  }
  return httpEquivHeaders;
}
