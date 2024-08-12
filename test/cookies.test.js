import { assert } from "chai";
import { Requests } from "../src/types.js";
import { Expectation } from "../src/types.js";
import { emptyRequests } from "./helpers.js";
import { cookiesTest } from "../src/analyzer/tests/cookies.js";
import { Cookie } from "tough-cookie";

describe("Cookies", () => {
  it("detects no cookies found", async function () {
    const reqs = emptyRequests();
    const res = cookiesTest(reqs);
    assert.isTrue(res.pass);
    assert.equal("cookies-not-found", res.result);
  });

  it("checks secure with httponly sessions", async function () {
    const cookieStrings = [
      "SESSIONID=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly",
      "foo=bar; Domain=mozilla.org; Secure; Path=/",
      "heroku-session-affinity=bar; Domain=mozilla.org; Path=/",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    const res = cookiesTest(reqs);
    assert.equal(res.result, Expectation.CookiesSecureWithHttponlySessions);
    assert.isFalse(res.sameSite);
  });

  it("checks secure with httponly sessions and samesite", async function () {
    const cookieStrings = [
      "SESSIONID_SAMESITE_STRICT=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=Strict",
      "SESSIONID_SAMESITE_LAX=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=Lax",
      "SESSIONID_SAMESITE_NONE=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=None",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);
    assert.isNotNull(reqs.session);
    const retrieved = reqs.session.jar.getCookiesSync("https://mozilla.org", {
      http: true,
    });

    const res = cookiesTest(reqs);
    assert.isNotNull(res.data);
    for (const [key, c] of Object.entries(res.data)) {
      switch (key) {
        case "SESSIONID_SAMESITE_STRICT":
          assert.equal(c.samesite, "strict");
          break;
        case "SESSIONID_SAMESITE_LAX":
          assert.equal(c.samesite, "lax");
          break;
        case "SESSIONID_SAMESITE_NONE":
          assert.equal(c.samesite, "none");
          break;
        default:
          assert.fail("Unexpected cookie");
      }
    }

    assert.isTrue(res.pass);
    assert.isTrue(res.sameSite);
  });

  it("checks secure with httponly sessions and samesite not awarded if not all cookies samesite", async function () {
    const cookieStrings = [
      "SESSIONID_SAMESITE_STRICT=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=Strict",
      "SESSIONID_SAMESITE_NO_SAMESITE=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly",
      "SESSIONID_SAMESITE_LAX=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=Lax",
      "SESSIONID_SAMESITE_NONE=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=None",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    const res = cookiesTest(reqs);
    assert.isNotNull(res.data);
    for (const [key, c] of Object.entries(res.data)) {
      switch (key) {
        case "SESSIONID_SAMESITE_STRICT":
          assert.equal(c.samesite, "strict");
          break;
        case "SESSIONID_SAMESITE_LAX":
          assert.equal(c.samesite, "lax");
          break;
        case "SESSIONID_SAMESITE_NONE":
          assert.equal(c.samesite, "none");
          break;
        case "SESSIONID_SAMESITE_NO_SAMESITE":
          assert.isUndefined(c.samesite);
          break;
        default:
          assert.fail("Unexpected cookie");
      }
    }
    assert.isTrue(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks anticsrf without samesite", async function () {
    const cookieStrings = [
      "CSRFTOKEN=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    const res = cookiesTest(reqs);
    assert.equal(res.result, Expectation.CookiesAnticsrfWithoutSamesiteFlag);
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks samesite invalid empty", async function () {
    const cookieStrings = [
      "SESSIONID=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);
    const res = cookiesTest(reqs);
    assert.equal(res.result, Expectation.CookiesSamesiteFlagInvalid);
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks samesite invalid true", async function () {
    const cookieStrings = [
      "SESSIONID=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=True",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);
    const res = cookiesTest(reqs);
    assert.equal(res.result, Expectation.CookiesSamesiteFlagInvalid);
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks samesite invalid", async function () {
    const cookieStrings = [
      "SESSIONID=bar; Domain=mozilla.org; Path=/; Secure; HttpOnly; SameSite=Invalid",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    const res = cookiesTest(reqs);
    assert.equal(res.result, Expectation.CookiesSamesiteFlagInvalid);
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks regular cookie no secure but hsts", async function () {
    const cookieStrings = ["foo=bar; Domain=mozilla.org; Path=/"];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    assert.isNotNull(reqs.responses.https);
    reqs.responses.https.headers["strict-transport-security"] =
      "max-age=15768000";

    const res = cookiesTest(reqs);
    assert.equal(
      res.result,
      Expectation.CookiesWithoutSecureFlagButProtectedByHsts
    );
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks session cookie no secure but hsts", async function () {
    const cookieStrings = [
      "SESSIONID=bar; Domain=mozilla.org; Path=/; HttpOnly",
    ];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    assert.isNotNull(reqs.responses.https);
    reqs.responses.https.headers["strict-transport-security"] =
      "max-age=15768000";

    const res = cookiesTest(reqs);
    assert.equal(
      res.result,
      Expectation.CookiesSessionWithoutSecureFlagButProtectedByHsts
    );
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks no secure", async function () {
    const cookieStrings = ["foo=bar; Domain=mozilla.org; Path=/"];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    const res = cookiesTest(reqs);
    assert.equal(res.result, Expectation.CookiesWithoutSecureFlag);
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks session no httponly", async function () {
    const cookieStrings = ["SESSIONID=bar; Domain=mozilla.org; Path=/; Secure"];
    const reqs = emptyRequests();
    setCookieStrings(reqs, cookieStrings);

    const res = cookiesTest(reqs);
    assert.equal(res.result, Expectation.CookiesSessionWithoutHttponlyFlag);
    assert.isFalse(res.pass);
    assert.isFalse(res.sameSite);
  });

  it("checks session no secure", async function () {
    {
      const cookieStrings = [
        "SESSIONID=bar; Domain=mozilla.org; Path=/; HttpOnly",
      ];
      const reqs = emptyRequests();
      setCookieStrings(reqs, cookieStrings);

      const res = cookiesTest(reqs);
      assert.equal(res.result, Expectation.CookiesSessionWithoutSecureFlag);
      assert.isFalse(res.pass);
      assert.isFalse(res.sameSite);
    }
    // https://github.com/mozilla/http-observatory/issues/97
    {
      const cookieStrings = ["SESSIONID=bar; Domain=mozilla.org; Path=/"];
      const reqs = emptyRequests();
      setCookieStrings(reqs, cookieStrings);

      const res = cookiesTest(reqs);
      assert.equal(res.result, Expectation.CookiesSessionWithoutSecureFlag);
      assert.isFalse(res.pass);
      assert.isFalse(res.sameSite);
    }
  });
});

/**
 * @param {Requests} reqs
 * @param {string[]} cookieStrings
 */
function setCookieStrings(reqs, cookieStrings) {
  assert.isNotNull(reqs.responses.auto);
  reqs.responses.auto.headers["Set-Cookie"] = cookieStrings;
  for (const cookieString of cookieStrings) {
    const cookie = Cookie.parse(cookieString);
    assert(cookie);
    assert.isNotNull(reqs.session);
    reqs.session.jar.setCookieSync(cookie, reqs.session.url.href, {
      http: true,
    });
  }
}
