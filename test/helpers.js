import fs from "node:fs";
import path from "node:path";

import { AxiosHeaders } from "axios";

import { Requests } from "../src/types.js";
import { Session } from "../src/retriever/session.js";
import { parseHttpEquivHeaders } from "../src/retriever/utils.js";
import { Site } from "../src/site.js";
import { analyzeScan } from "../src/scanner/index.js";

/**
 *
 * @param {import("../src/types.js").Response | null} response
 * @param {string} header
 * @param {string} value
 */
export function setHeader(response, header, value) {
  if (typeof response?.headers.set === "function") {
    response.headers.set(header, value);
  }
}

/**
 *
 * @param {string | null} [httpEquivFile]
 * @returns {Requests}
 */
export function emptyRequests(httpEquivFile = null) {
  const req = new Requests(Site.fromSiteString("mozilla.org"));

  // Parse the HTML file for its own headers, if requested
  if (httpEquivFile) {
    const html = fs.readFileSync(
      path.join("test", "files", httpEquivFile),
      "utf8"
    );

    // Load the HTML file into the object for content tests.
    req.resources.path = html;
  }

  req.responses.auto = {
    headers: new AxiosHeaders("Content-Type: text/html"),
    request: {
      headers: new AxiosHeaders(),
    },
    status: 200,
    statusText: "OK",
    verified: true,
    data: "",
    config: {
      headers: new AxiosHeaders(),
    },
  };

  req.responses.cors = structuredClone(req.responses.auto);
  req.responses.http = structuredClone(req.responses.auto);
  req.responses.https = structuredClone(req.responses.auto);

  req.responses.httpRedirects = [
    {
      url: new URL("http://mozilla.org/"),
      status: 301,
    },
    {
      url: new URL("https://mozilla.org/"),
      status: 301,
    },
    {
      url: new URL("https://www.mozilla.org/"),
      status: 200,
    },
  ];
  req.responses.httpsRedirects = [
    {
      url: new URL("https://mozilla.org/"),
      status: 301,
    },
    {
      url: new URL("https://www.mozilla.org/"),
      status: 200,
    },
    {
      url: new URL("https://mozilla.org/"),
      status: 301,
    },
    {
      url: new URL("https://www.mozilla.org/"),
      status: 200,
    },
    {
      url: new URL("https://mozilla.org/robots.txt"),
      status: 301,
    },
    {
      url: new URL("https://www.mozilla.org/robots.txt"),
      status: 200,
    },
  ];

  req.responses.auto.httpEquiv = new Map();

  req.session = new Session(new URL("https://mozilla.org/"));

  // Parse the HTML file for its own headers, if requested
  if (req.resources.path) {
    req.responses.auto.httpEquiv = parseHttpEquivHeaders(
      req.resources.path,
      req.session.url.href
    );
  }
  return req;
}

/**
 * @typedef {Object} SerializedRedirectEntry
 * @property {string} url
 * @property {number} status
 */

/**
 * @typedef {Object} SerializedResponse
 * @property {Record<string, string>} headers
 * @property {number} status
 * @property {string} statusText
 * @property {boolean} verified
 * @property {string} data
 * @property {Record<string, string[]>} [httpEquiv]
 */

/**
 * Reconstructs an axios response from serialized fixture data
 * @param {SerializedResponse | null | undefined} data - Serialized response data
 * @returns {import("../src/types.js").Response | null}
 */
function reconstructResponse(data) {
  if (!data) {
    return null;
  }

  return {
    headers: new AxiosHeaders(data.headers),
    status: data.status,
    statusText: data.statusText,
    verified: data.verified,
    data: data.data || "",
    config: { headers: new AxiosHeaders() },
    request: { headers: new AxiosHeaders() },
    httpEquiv: data.httpEquiv
      ? new Map(Object.entries(data.httpEquiv))
      : new Map(),
  };
}

/**
 * Loads a fixture and creates a Requests object from it
 * @param {string} fixtureName - Name of fixture file (without .json extension)
 * @returns {Requests}
 */
export function fixtureRequests(fixtureName) {
  const fixturePath = path.join("test", "fixtures", `${fixtureName}.json`);
  const fixtureData = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

  const site = Site.fromSiteString(fixtureData.site.hostname);
  if (fixtureData.site.port) {
    site.port = fixtureData.site.port;
  }
  if (fixtureData.site.path) {
    site.path = fixtureData.site.path;
  }

  const req = new Requests(site);

  // Reconstruct responses from fixture data
  req.responses.auto = reconstructResponse(fixtureData.responses.auto);
  req.responses.http = reconstructResponse(fixtureData.responses.http);
  req.responses.https = reconstructResponse(fixtureData.responses.https);
  req.responses.cors = reconstructResponse(fixtureData.responses.cors);

  // Reconstruct redirect chains
  req.responses.httpRedirects = (fixtureData.responses.httpRedirects || []).map(
    (/** @type {SerializedRedirectEntry} */ r) => ({
      url: new URL(r.url),
      status: r.status,
    })
  );
  req.responses.httpsRedirects = (
    fixtureData.responses.httpsRedirects || []
  ).map((/** @type {SerializedRedirectEntry} */ r) => ({
    url: new URL(r.url),
    status: r.status,
  }));

  // Set resources
  req.resources.path = fixtureData.resources.path || "";

  // Create session
  req.session = new Session(new URL(fixtureData.session.url));

  return req;
}

/**
 * Runs scan logic on a pre-loaded Requests object (for fixture-based testing)
 * This is a simple wrapper around analyzeScan() from the scanner module
 * @param {Requests} requests - Pre-loaded requests object (e.g., from fixtureRequests)
 * @returns {import("../src/types.js").ScanResult}
 */
export function scanWithRequests(requests) {
  return analyzeScan(requests);
}
