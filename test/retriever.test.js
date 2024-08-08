import { assert } from "chai";

import { retrieve } from "../src/retriever/retriever.js";
import { Session } from "../src/retriever/session.js";
import { Resources } from "../src/types.js";

describe("TestRetriever", () => {
  it("test retrieve non-existent domain", async function () {
    const domain =
      Array(223)
        .fill(0)
        .map(() => String.fromCharCode(Math.random() * 26 + 97))
        .join("") + ".net";
    const requests = await retrieve(domain);
    assert.isNull(requests.responses.auto);
    assert.isNull(requests.responses.cors);
    assert.isNull(requests.responses.http);
    assert.isNull(requests.responses.https);
    assert.isNotNull(requests.session);
    assert.isNull(requests.session.response);
    assert.equal(domain, requests.hostname);
    assert.deepEqual(new Resources(), requests.resources);
  });

  it("test retrieve mdn", async () => {
    const requests = await retrieve("developer.mozilla.org");
    assert.isNotNull(requests.resources.path);
    assert.isNotNull(requests.responses.auto);
    assert.isNotNull(requests.responses.http);
    assert.isNotNull(requests.responses.https);
    assert.isNumber(requests.responses.http.status);
    assert.isNumber(requests.responses.https.status);
    assert.instanceOf(requests.session, Session);
    assert.equal(requests.hostname, "developer.mozilla.org");
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
      ].url.href
    );
  }).timeout(10000);

  // test site seems to have outage from time to time, disable for now
  it.skip("test_retrieve_invalid_cert", async function () {
    const reqs = await retrieve("expired.badssl.com");
    assert.isNotNull(reqs.responses.auto);
    assert.isFalse(reqs.responses.auto.verified);
  }).timeout(10000);
});
