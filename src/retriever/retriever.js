import { AxiosHeaders } from "axios";
import { CONFIG } from "../config.js";
import { HTML_TYPES, Requests } from "../types.js";
import { Session, getPageText } from "./session.js";
import { urls } from "./url.js";
import { parseHttpEquivHeaders } from "./utils.js";

const STANDARD_HEADERS = [
  "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
];
const ROBOTS_HEADERS = ["Accept: text/plain,*/*;q=0.8"];

/**
 *
 * @param {*} hostname
 * @param {import("../types.js").Options} options
 * @returns {Promise<Requests>}
 */
export async function retrieve(hostname, options = {}) {
  const retrievals = new Requests(hostname);

  const { http, https } = urls(hostname, options);
  const [httpSession, httpsSession] = await Promise.all([
    Session.fromUrl(http, { headers: STANDARD_HEADERS, ...options }),
    Session.fromUrl(https, { headers: STANDARD_HEADERS, ...options }),
  ]);

  if (!httpSession && !httpsSession) {
    return retrievals;
  }

  retrievals.responses.http = httpSession.response;
  retrievals.responses.https = httpsSession.response;

  // use the http redirect chain
  retrievals.responses.httpRedirects = httpSession.redirectHistory;
  retrievals.responses.httpsRedirects = httpSession.redirectHistory;

  if (httpsSession.clientInstanceRecordingRedirects) {
    retrievals.responses.auto = httpsSession.response;
    retrievals.session = httpsSession;
  } else {
    retrievals.responses.auto = httpSession.response;
    retrievals.session = httpSession;
  }

  // Store the contents of the "base" page
  retrievals.resources.path = getPageText(retrievals.responses.auto, true);

  // Get robots.txt to gather additional cookies, if any.
  await retrievals.session?.get({
    path: "/robots.txt",
    headers: new AxiosHeaders(ROBOTS_HEADERS.join("\n")),
  });

  // Do a CORS preflight request
  const corsUrl = retrievals.session.redirectHistory[
    retrievals.session.redirectHistory.length - 1
  ]
    ? retrievals.session.redirectHistory[
        retrievals.session.redirectHistory.length - 1
      ].url.href
    : retrievals.session.url.href;
  const cors_resp =
    (await retrievals.session?.options({
      url: corsUrl,
      headers: {
        "Access-Control-Request-Method": "GET",
        Origin: CONFIG.retriever.corsOrigin,
      },
    })) || null;

  if (cors_resp) {
    retrievals.responses.cors = {
      ...cors_resp,
      verified: retrievals.session.response?.verified ?? false,
    };
  } else {
    retrievals.responses.cors = null;
  }

  if (retrievals.responses.auto) {
    if (
      HTML_TYPES.has(
        retrievals.responses.auto.headers["content-type"]?.split(";")[0]
      ) &&
      retrievals.resources.path
    ) {
      retrievals.responses.auto.httpEquiv = parseHttpEquivHeaders(
        retrievals.resources.path,
        retrievals.session.url.href
      );
    } else {
      retrievals.responses.auto.httpEquiv = new Map();
    }
  }

  return retrievals;
}
