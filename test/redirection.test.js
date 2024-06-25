import { assert } from "chai";
import { emptyRequests } from "./helpers.js";
import { Expectation } from "../src/types.js";
import { redirectionTest } from "../src/analyzer/tests/redirection.js";

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

  it("checks for all redirections preloaded", function () {
    reqs.responses.httpRedirects = [
      {
        url: new URL("http://pokeinthe.io/"),
        status: 301,
      },
      {
        url: new URL("https://pokeinthe.io/"),
        status: 302,
      },
      {
        url: new URL("https://www.pokeinthe.io/"),
        status: 302,
      },
      {
        url: new URL("https://baz.pokeinthe.io/foo"),
        status: 200,
      },
    ];

    const res = redirectionTest(reqs);
    assert.equal(res.result, Expectation.RedirectionAllRedirectsPreloaded);
    assert.isTrue(res.pass);
  });
});
