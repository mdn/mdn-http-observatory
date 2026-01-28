/**
 * HTML parsing utilities using htmlparser2's SAX-style streaming API.
 * Uses onopentag callbacks to collect only the tags of interest,
 * avoiding building a full DOM tree for better memory efficiency.
 */

import { Parser } from "htmlparser2";

/**
 * @typedef {Object.<string, string>} Attributes
 * An object mapping attribute names to their values
 */

/**
 * Collects all elements matching a tag name from HTML using streaming parsing.
 * Only builds minimal data structures for the tags of interest.
 *
 * @param {string} html - HTML string to parse
 * @param {string} tagName - Tag name to collect (case-insensitive)
 * @returns {Attributes[]} Array of attribute objects for matching elements
 */
export function collectElements(html, tagName) {
  const targetTag = tagName.toLowerCase();
  /** @type {Attributes[]} */
  const elements = [];

  const parser = new Parser(
    {
      onopentag(name, attributes) {
        if (name === targetTag) {
          elements.push(attributes);
        }
      },
    },
    {
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
      decodeEntities: true,
    }
  );

  parser.write(html);
  parser.end();

  return elements;
}

/**
 * Gets an attribute value from an attributes object
 * @param {Attributes} attributes - Attributes object from collectElements
 * @param {string} name - Attribute name (case-insensitive)
 * @returns {string | undefined} Attribute value or undefined if not present
 */
export function getAttribute(attributes, name) {
  return attributes[name.toLowerCase()];
}

/**
 * Checks if an attributes object has a specific attribute
 * @param {Attributes} attributes - Attributes object from collectElements
 * @param {string} name - Attribute name (case-insensitive)
 * @returns {boolean} True if attribute exists
 */
export function hasAttribute(attributes, name) {
  return name.toLowerCase() in attributes;
}
