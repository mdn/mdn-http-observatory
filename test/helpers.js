import fs from "node:fs";

import { AxiosHeaders } from "axios";

import { Requests } from "../src/types.js";
import { Session } from "../src/retriever/session.js";
import path from "node:path";
import { parseHttpEquivHeaders } from "../src/retriever/utils.js";

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
  const req = new Requests("mozilla.org");

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
