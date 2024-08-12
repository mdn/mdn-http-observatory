import { JSDOM } from "jsdom";
import { CONTENT_SECURITY_POLICY, REFERRER_POLICY } from "../headers.js";

/**
 *
 * @param {string} html
 * @param {string} baseUrl
 * @returns {Map<string, string[]>}
 */
export function parseHttpEquivHeaders(html, baseUrl) {
  /** @type {Map<string, string[]>} */
  const httpEquivHeaders = new Map([[CONTENT_SECURITY_POLICY, []]]);

  try {
    const dom = JSDOM.fragment(html);
    const metas = [...dom.querySelectorAll("meta")];

    for (const meta of metas) {
      if (meta.hasAttribute("http-equiv") && meta.hasAttribute("content")) {
        const httpEquiv = meta.getAttribute("http-equiv")?.toLowerCase().trim();
        const content = meta.getAttribute("content");
        if (content && httpEquiv === CONTENT_SECURITY_POLICY) {
          httpEquivHeaders.get(CONTENT_SECURITY_POLICY)?.push(content);
        }
      } else if (
        // Technically not HTTP Equiv, but we're treating it that way
        meta.getAttribute("name")?.toLowerCase().trim() === "referrer"
      ) {
        const attr = meta.getAttribute("content");
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
