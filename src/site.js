import { domainToASCII } from "url";

/**
 * A string representing a site that can be:
 * - A simple hostname: "example.com"
 * - A hostname with port: "example.com:8443"
 * - A hostname with path: "example.com/path/to/resource"
 * - A hostname with port and path: "example.com:8443/path/to/resource"
 * - Combinations of the above
 *
 * @typedef {string} SiteString
 */

/**
 * Represents a parsed site with hostname, optional port, and optional path components.
 *
 * This class provides a structured way to work with site information that may include
 * different combinations of hostname, port, and path. It can parse site strings in
 * various formats and extract the individual components.
 *
 * @example
 * // Create a site with just hostname
 * const site1 = new Site("example.com", undefined, undefined);
 *
 * @example
 * // Create a site with hostname and port
 * const site2 = new Site("example.com", 8443, undefined);
 *
 * @example
 * // Create a site with hostname and path
 * const site3 = new Site("example.com", undefined, "path/to/resource");
 *
 * @example
 * // Parse from a site string
 * const site4 = Site.fromSiteString("example.com:8443/api/v1");
 * console.log(site4.hostname); // "example.com"
 * console.log(site4.port);     // 8443
 * console.log(site4.path);     // "api/v1"
 */
export class Site {
  /** @type {string} The hostname component of the site */
  hostname;
  /** @type {number | undefined} The port number, if specified */
  port;
  /** @type {string | undefined} The path component, if specified */
  path;

  /**
   * @param {string} hostname
   * @param {number | undefined} port
   * @param {string} path
   */
  constructor(hostname, port, path) {
    this.hostname = hostname;
    this.port = port;
    this.path = path;
  }

  /**
   *
   * @returns a string suitable for the site field in the database
   */
  asSiteKey() {
    return `${this.hostname}${this.port ? `:${this.port}` : ""}${this.path === "/" ? "" : this.path || ""}`;
  }

  /**
   * Parses a site string and creates a Site instance.
   *
   * This method can parse various site string formats:
   * - Simple hostname: "example.com"
   * - Hostname with port: "example.com:8443"
   * - Hostname with path: "example.com/path/to/resource"
   * - Hostname with port and path: "example.com:8443/path/to/resource"
   *
   * @param {string} siteString - The site string to parse
   * @returns {Site} A new Site instance with parsed components
   * @throws {Error} Throws an error if the site string is invalid or empty
   *
   * @example
   * const site = Site.fromSiteString("api.example.com:3000/v1/users");
   * // Returns: Site { hostname: "api.example.com", port: 3000, path: "v1/users" }
   *
   * @example
   * const site = Site.fromSiteString("localhost:8080");
   * // Returns: Site { hostname: "localhost", port: 8080, path: undefined }
   */
  static fromSiteString(siteString) {
    try {
      // Add a protocol to make it a valid URL for parsing
      const url = new URL(`https://${siteString}`);

      const hostname = url.hostname;
      if (!hostname) {
        throw new Error("hostname cannot be empty");
      }

      // 253 bytes is the practical limit for DNS hostnames.
      // Take IDN notation into account.
      if (domainToASCII(hostname).length > 253) {
        throw new Error("hostname is too long");
      }

      // Ensure hostname has proper structure: at least one dot
      // with non-empty parts.
      const parts = hostname.split(".");
      if (parts.length < 2 || parts.some((part) => part.length === 0)) {
        throw new Error(
          "Invalid site string: hostname must have at least a host and TLD (e.g., example.com)"
        );
      }

      // URL.port returns empty string if no port, convert to
      // number or undefined.
      const port = url.port ? Number(url.port) : undefined;

      // URL.pathname is "/" by default
      const path = url.pathname;

      return new Site(hostname.toLowerCase(), port, path);
    } catch (error) {
      throw new Error("Invalid site string");
    }
  }
}
