import { assert } from "chai";

import { parseCsp } from "../src/analyzer/cspParser.js";

describe("Content Security Policy Parser", function () {
  it("should parse policy correctly", function () {
    // one policy with one directive
    let policy = ["default-src 'none'"];
    assert.deepEqual(
      parseCsp(policy),
      new Map(Object.entries({ "default-src": new Set(["'none'"]) }))
    );

    // one policy with multiple directives
    policy = ["default-src 'none'; script-src 'self' https://mozilla.org"];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set(["'none'"]),
          "script-src": new Set(["'self'", "https://mozilla.org"]),
        })
      )
    );

    // two identical policies
    policy = [
      "default-src 'none'; script-src 'self' https://mozilla.org",
      "default-src 'none'; script-src 'self' https://mozilla.org",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set(["'none'"]),
          "script-src": new Set(["'self'", "https://mozilla.org"]),
        })
      )
    );

    // two policies, one of which has a source that isn't in the other
    policy = [
      "default-src 'none'; script-src 'self' https://mozilla.org",
      "default-src 'none'; script-src 'self' https://mozilla.org https://example.com",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set(["'none'"]),
          "script-src": new Set(["'self'", "https://mozilla.org"]),
        })
      )
    );

    // same thing as the previous policy, but the sources are in different orders
    policy = [
      "default-src 'none'; script-src 'self' https://mozilla.org",
      "default-src 'none'; script-src https://example.com 'self' https://mozilla.org",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set(["'none'"]),
          "script-src": new Set(["'self'", "https://mozilla.org"]),
        })
      )
    );

    // a policy with two differing websites that should end up with 'none'
    policy = [
      "default-src https://mozilla.org",
      "default-src https://mozilla.com",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(Object.entries({ "default-src": new Set(["'none'"]) }))
    );

    // a policy with four differing websites that should end up with 'none'
    policy = [
      "default-src https://mozilla.org https://mozilla.net",
      "default-src https://mozilla.com https://mozilla.io",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(Object.entries({ "default-src": new Set(["'none'"]) }))
    );

    // a policy with a bunch of websites, with only two in common
    policy = [
      "default-src https://mozilla.org https://mozilla.net https://mozilla.com https://mozilla.io",
      "default-src https://mozilla.pizza https://mozilla.ninja https://mozilla.net https://mozilla.org",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set([
            "https://mozilla.net",
            "https://mozilla.org",
          ]),
        })
      )
    );

    // a four policies with a bunch of websites, with only two in common
    policy = [
      "default-src https://mozilla.org https://mozilla.net https://mozilla.com https://mozilla.io",
      "default-src https://mozilla.pizza https://mozilla.ninja https://mozilla.net https://mozilla.org",
      "default-src https://mozilla.net https://mozilla.fox https://mozilla.fire https://mozilla.org",
      "default-src https://mozilla.browser https://mozilla.web https://mozilla.net https://mozilla.org",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set([
            "https://mozilla.net",
            "https://mozilla.org",
          ]),
        })
      )
    );

    // a policy with a overlapping paths
    policy = [
      "default-src https://mozilla.org/fire",
      "default-src https://mozilla.org/firefox/",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set(["'none'"]),
        })
      )
    );

    // another policy with a overlapping paths
    policy = [
      "default-src https://mozilla.org/firefox/",
      "default-src https://mozilla.org/firefox/download/",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set(["https://mozilla.org/firefox/download/"]),
        })
      )
    );

    // a policy with a overlapping paths
    policy = [
      "default-src https://mozilla.org/firefox/download/",
      "default-src https://mozilla.org/firefox/",
    ];
    assert.deepEqual(
      parseCsp(policy),
      new Map(
        Object.entries({
          "default-src": new Set(["https://mozilla.org/firefox/download/"]),
        })
      )
    );

    // a policy with http: and https:, two differing sources that should end up with 'none'
    policy = ["default-src http:", "default-src https:"];
    assert.deepEqual(
      parseCsp(policy),
      new Map(Object.entries({ "default-src": new Set(["'none'"]) }))
    );

    // a policy with http: and https:, two differing sources that should end up with 'none'
    policy = ["default-src http: http:", "default-src https: https:"];
    assert.deepEqual(
      parseCsp(policy),
      new Map(Object.entries({ "default-src": new Set(["'none'"]) }))
    );
  });

  it("should throw error for invalid policies", function () {
    const policies = [
      "  ",
      "\r\n",
      "\r\n\r\n\r\n\r\n\r\n\r\n",
      "",
      "default-src 'none'; default-src 'none'", // Repeated directives not allowed
      "default-src 'none'; img-src 'self'; default-src 'none'",
      "defa",
    ];
    for (let policy of policies) {
      assert.throws(() => parseCsp([policy]), Error);
    }
  });

  it("should parse this example header correctly", function () {
    let policy = [
      "default-src 'self' blob: https://*.cnn.com:* http://*.cnn.com:* *.cnn.io:* *.cnn.net:* *.turner.com:* *.turner.io:* *.ugdturner.com:* courageousstudio.com *.vgtf.net:*; script-src 'unsafe-eval' 'unsafe-inline' 'self' *; style-src 'unsafe-inline' 'self' blob: *; child-src 'self' blob: *; frame-src 'self' *; object-src 'self' *; img-src 'self' data: blob: *; media-src 'self' data: blob: *; font-src 'self' data: *; connect-src 'self' data: *; frame-ancestors 'self' https://*.cnn.com:* http://*.cnn.com https://*.cnn.io:* http://*.cnn.io:* *.turner.com:* courageousstudio.com;",
    ];
    const res = parseCsp(policy);
    assert(res);
  });

  it("should parse a policy with duplicate report-uri entries and report those duplicates", function () {
    let policy = [
      "report-uri https://www.dropbox.com/csp_log?policy_name=metaserver-whitelist ; report-uri https://www.dropbox.com/csp_log?policy_name=metaserver-dynamic",
    ];
    const res = parseCsp(policy);
    assert(res);
    assert(res.has("_observatory_duplicate_key_warnings"));
    assert(res.get("_observatory_duplicate_key_warnings")?.has("report-uri"));
  });
  it("should parse a policy with duplicate report-to entries and report those duplicates", function () {
    let policy = ["report-to some_name ; report-to some_other_name"];
    const res = parseCsp(policy);
    assert(res);
    assert(res.has("_observatory_duplicate_key_warnings"));
    assert(res.get("_observatory_duplicate_key_warnings")?.has("report-to"));
  });
});
