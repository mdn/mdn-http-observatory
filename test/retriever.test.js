import { assert } from "chai";

import { retrieve } from "../src/retriever/retriever.js";
import { Session } from "../src/retriever/session.js";
import { Resources } from "../src/types.js";
import { Site } from "../src/site.js";
import { detectTlsSupport } from "../src/retriever/url.js";
import { CONFIG } from "../src/config.js";

describe("TestRetriever", () => {
  if (CONFIG.tests.hostForPortAndPathChecks !== "") {
    it("detects tls on a custom port", async () => {
      let site = Site.fromSiteString(
        `${CONFIG.tests.hostForPortAndPathChecks}:8443`
      );
      let res = await detectTlsSupport(site);
      assert.isTrue(res);
      site = Site.fromSiteString(
        `${CONFIG.tests.hostForPortAndPathChecks}:8080`
      );
      res = await detectTlsSupport(site);
      assert.isFalse(res);
      site = Site.fromSiteString(
        `${CONFIG.tests.hostForPortAndPathChecks}:8684`
      );
      try {
        await detectTlsSupport(site);
        throw new Error("scan should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.equal(e.name, "site-down");
        } else {
          throw new Error("Unexpected error type");
        }
      }
    }).timeout(10000);
  }

  it("correctly uses port and path on retrieving", async () => {
    let site = Site.fromSiteString("generalmagic.space:8443/test");
    const requests = await retrieve(site);
    assert(requests.responses.auto);
    assert(requests.responses.auto.verified);
    assert.equal(requests.responses.httpRedirects.length, 3);
  }).timeout(10000);

  it("test retrieve mdn", async () => {
    const site = Site.fromSiteString("developer.mozilla.org/en-US");
    const requests = await retrieve(site);
    // console.log("REQUESTS", requests);
    assert.isNotNull(requests.resources.path);
    assert.isNotNull(requests.responses.auto);
    assert.isNotNull(requests.responses.http);
    assert.isNotNull(requests.responses.https);
    assert.isNumber(requests.responses.http.status);
    assert.isNumber(requests.responses.https.status);
    assert.instanceOf(requests.session, Session);
    assert.equal(requests.site.hostname, "developer.mozilla.org");
    assert.equal(requests.responses.httpRedirects.length, 3);
    assert.equal(
      "text/html",
      requests.responses.auto.headers["content-type"].substring(0, 9)
    );
    assert.equal(200, requests.responses.auto.status);
    assert.equal(
      "https://developer.mozilla.org/en-US/",
      requests.responses.httpRedirects[
        requests.responses.httpRedirects.length - 1
      ]?.url.href
    );
  }).timeout(10000);

  it("test retrieve non-existent domain", async function () {
    const domain =
      Array(223)
        .fill(0)
        .map(() => String.fromCharCode(Math.random() * 26 + 97))
        .join("") + ".net";
    const site = Site.fromSiteString(domain);
    const requests = await retrieve(site);
    assert.isNull(requests.responses.auto);
    assert.isNull(requests.responses.cors);
    assert.isNull(requests.responses.http);
    assert.isNull(requests.responses.https);
    assert.isNotNull(requests.session);
    assert.isNull(requests.session.response);
    assert.equal(domain, requests.site.hostname);
    assert.deepEqual(new Resources(), requests.resources);
  }).timeout(10000);

  // test site seems to have outage from time to time, disable for now
  it("test_retrieve_invalid_cert", async function () {
    const site = Site.fromSiteString("expired.badssl.com");
    const reqs = await retrieve(site);
    assert.isNotNull(reqs.responses.auto);
    assert.isFalse(reqs.responses.auto.verified);
  }).timeout(10000);
});
