import { beforeEach, describe, it } from "node:test";

import { assert } from "chai";

import { redirectionTest } from "../src/analyzer/tests/redirection.js";
import { Expectation } from "../src/types.js";

import { emptyRequests } from "./helpers.js";

describe("Redirections", () => {
  /** @type {import("../src/types.js").Requests} */
  let reqs;
  beforeEach(() => {
    reqs = emptyRequests();
  });

  it("checks for no http but does have https", function () {
    reqs.responses.http = null;
    reqs.responses.httpRedirects = [];
    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionNotNeededNoHttp);
    assert.isTrue(res.pass);
  });

  it("checks for redirection missing", function () {
    // the requests object has a single, non-redirecting successful
    // http request for this test.
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://mozilla.org"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);

    assert.equal(res.result, Expectation.RedirectionMissing);
    assert.isFalse(res.pass);
  });

  it("checks for redirection not to https", function () {
    // The requests object has only non-https redirects from http
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://mozilla.org"),
        status: 301,
      },
      {
        url: new URL("http://www.mozilla.org"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionNotToHttps);
    assert.isFalse(res.pass);

    // Longer redirect chains should "work" as well
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://mozilla.org"),
        status: 301,
      },
      {
        url: new URL("http://www.mozilla.org"),
        status: 302,
      },
      {
        url: new URL("http://www.mozilla.org/en/"),
        status: 200,
      },
    ];

    const res2 = redirectionTest(reqs);
    assert.equal(res2.result, Expectation.RedirectionNotToHttps);
    assert.isFalse(res2.pass);
  });

  it("checks for proper redirection to https", function () {
    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionToHttps);
    assert.isTrue(res.pass);
  });

  it("checks for proper redirection to https with port number", function () {
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://mozilla.org/"),
        status: 301,
      },
      {
        url: new URL("https://mozilla.org:8443/"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionToHttps);
    assert.isTrue(res.pass);
    assert.deepEqual(res.route, [
      "http://mozilla.org/",
      "https://mozilla.org:8443/",
    ]);
  });

  it("checks for first redirection to http", function () {
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://mozilla.org/"),
        status: 301,
      },
      {
        url: new URL("http://www.mozilla.org/"),
        status: 301,
      },
      {
        url: new URL("https://www.mozilla.org/"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(
      res.result,
      Expectation.RedirectionNotToHttpsOnInitialRedirection
    );
    assert.isFalse(res.pass);
  });

  it("checks for first redirection off host", function () {
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://mozilla.org/"),
        status: 301,
      },
      {
        url: new URL("https://www.mozilla.org/"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionOffHostFromHttp);
    assert.isFalse(res.pass);
  });

  it("uses the https chain for the destination when there is no http response", function () {
    // Without an HTTP response the HTTP redirect chain is empty, so the
    // destination falls back to the end of the HTTPS chain (display only).
    reqs.responses.http = null;
    reqs.responses.httpRedirects = [];
    reqs.responses.httpsRedirects = [
      {
        url: new URL("https://mozilla.org/"),
        status: 301,
      },
      {
        url: new URL("https://www.mozilla.org/"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionNotNeededNoHttp);
    assert.isTrue(res.pass);
    assert.equal(res.destination, "https://www.mozilla.org/");
    assert.deepEqual(res.route, []);
  });

  it("fails when https redirects back to http even if http redirects look fine", function () {
    // HTTP chain correctly redirects to HTTPS on the same hostname
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://mozilla.org/"),
        status: 301,
      },
      {
        url: new URL("https://mozilla.org/"),
        status: 200,
      },
    ];
    // But the independent HTTPS session ends on HTTP — that should be an error
    reqs.responses.httpsRedirects = [
      {
        url: new URL("https://mozilla.org/"),
        status: 301,
      },
      {
        url: new URL("http://mozilla.org/"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionNotToHttps);
    assert.isFalse(res.pass);
  });

  it("checks for all redirections preloaded", function () {
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://cloudflare.com/"),
        status: 301,
      },
      {
        url: new URL("https://cloudflare.com/"),
        status: 302,
      },
      {
        url: new URL("https://www.cloudflare.com/"),
        status: 302,
      },
      {
        url: new URL("https://baz.cloudflare.com/foo"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionAllRedirectsPreloaded);
    assert.isTrue(res.pass);
  });
});
