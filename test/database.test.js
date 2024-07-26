import { assert } from "chai";
import {
  createPool,
  ensureSite,
  insertScan,
  insertTestResults,
  refreshMaterializedViews,
  ScanState,
  selectGradeDistribution,
  selectScan,
  selectScanHostHistory,
  selectScanRecentScan,
  selectTestResults,
  updateScanState,
} from "../src/database/repository.js";
import { ALGORITHM_VERSION } from "../src/constants.js";
import { faker } from "@faker-js/faker";
import { migrateDatabase } from "../src/database/migrate.js";
import { insertSeeds } from "./helpers/db.js";

const pool = createPool();

let describeOrSkip;
if (process.env.SKIP_DB_TESTS) {
  describeOrSkip = describe.skip;
} else {
  describeOrSkip = describe;
}
describeOrSkip("Database repository", function () {
  this.beforeEach(async () => {
    await migrateDatabase("0", pool);
    await migrateDatabase("max", pool);
  });

  this.afterEach(async () => {});

  it("ensures a site record", async function () {
    const id = await ensureSite(pool, "www.mozilla.org");
    assert(id > 0);
    const id2 = await ensureSite(pool, "www.mozilla.org");
    assert.equal(id, id2);
  });

  it("creates a scan record", async function () {
    const siteId = await ensureSite(pool, "www.mozilla.org");
    const row = await insertScan(pool, siteId);
    assert(row);
    assert.isNumber(row.id);
    assert.equal(row.state, "RUNNING");
    assert.isNull(row.end_time);
    assert.equal(row.algorithm_version, ALGORITHM_VERSION);
    assert.equal(row.tests_failed, 0);
    assert.equal(row.tests_passed, 0);
    assert.equal(row.tests_quantity, 0);
    assert.isNull(row.grade);
    assert.isNull(row.score);
    assert.isNull(row.error);
    assert.isNull(row.status_code);
  });

  it("inserts tests correctly", async function () {
    const scanResult = {
      scan: {
        algorithmVersion: 4,
        grade: "B+",
        score: 80,
        statusCode: 200,
        testsFailed: 1,
        testsPassed: 8,
        testsQuantity: 9,
        error: "",
        responseHeaders: {
          "content-type": "text/html; charset=utf-8",
          "transfer-encoding": "chunked",
          connection: "close",
          server: "gunicorn",
          date: "Tue, 23 Apr 2024 15:08:55 GMT",
          "x-frame-options": "DENY",
          "content-security-policy":
            "style-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org 'unsafe-inline'; script-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org 'unsafe-inline' 'unsafe-eval' www.googletagmanager.com www.google-analytics.com tagmanager.google.com www.youtube.com s.ytimg.com js.stripe.com; default-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org; connect-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org www.googletagmanager.com www.google-analytics.com region1.google-analytics.com sentry.prod.mozaws.net o1069899.sentry.io o1069899.ingest.sentry.io https://accounts.firefox.com/ stage.cjms.nonprod.cloudops.mozgcp.net cjms.services.mozilla.com; font-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org; child-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org www.googletagmanager.com www.google-analytics.com trackertest.org www.surveygizmo.com accounts.firefox.com accounts.firefox.com.cn www.youtube.com js.stripe.com; img-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org data: mozilla.org www.googletagmanager.com www.google-analytics.com creativecommons.org images.ctfassets.net; frame-src 'self' *.mozilla.net *.mozilla.org *.mozilla.com *.mozilla.org www.googletagmanager.com www.google-analytics.com trackertest.org www.surveygizmo.com accounts.firefox.com accounts.firefox.com.cn www.youtube.com js.stripe.com",
          "cache-control": "max-age=600",
          expires: "Tue, 23 Apr 2024 15:18:55 GMT",
          "x-clacks-overhead": "GNU Terry Pratchett",
          etag: 'W/"cbfd8493a5f0ecbe046ddecb03e45155"',
          "x-backend-server": "bedrock-6b8866f6b9-tz2vw.gcp-eu-west1",
          "strict-transport-security": "max-age=31536000",
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin",
          "cross-origin-opener-policy": "same-origin",
          via: "1.1 google, 1.1 cf907dcd2ed697ac2b18d7b885308ecc.cloudfront.net (CloudFront)",
          vary: "Accept-Encoding,Accept-Language",
          "x-cache": "Hit from cloudfront",
          "x-amz-cf-pop": "MRS52-C1",
          "x-amz-cf-id":
            "a4DEvDvF0JFLc1G8ODRDWqUxBOQlTFhdDPQBwRJ1wOuQKTBa_8WZTg==",
          age: "298",
        },
      },
      tests: {
        "content-security-policy": {
          expectation: "csp-implemented-with-no-unsafe",
          pass: false,
          result: "csp-implemented-with-unsafe-inline",
          scoreDescription:
            "Content Security Policy (CSP) implemented unsafely. This includes 'unsafe-inline' or data: inside script-src, overly broad sources such as https: inside object-src or script-src, or not restricting the sources for object-src or script-src.",
          scoreModifier: -20,
          name: "content-security-policy",
          title: "Content Security Policy",
          data: {
            "style-src": [
              "'self'",
              "'unsafe-inline'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
            ],
            "script-src": [
              "'self'",
              "'unsafe-eval'",
              "'unsafe-inline'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
              "js.stripe.com",
              "s.ytimg.com",
              "tagmanager.google.com",
              "www.google-analytics.com",
              "www.googletagmanager.com",
              "www.youtube.com",
            ],
            "default-src": [
              "'self'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
            ],
            "connect-src": [
              "'self'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
              "cjms.services.mozilla.com",
              "https://accounts.firefox.com/",
              "o1069899.ingest.sentry.io",
              "o1069899.sentry.io",
              "region1.google-analytics.com",
              "sentry.prod.mozaws.net",
              "stage.cjms.nonprod.cloudops.mozgcp.net",
              "www.google-analytics.com",
              "www.googletagmanager.com",
            ],
            "font-src": [
              "'self'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
            ],
            "child-src": [
              "'self'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
              "accounts.firefox.com",
              "js.stripe.com",
              "trackertest.org",
              "www.google-analytics.com",
              "www.googletagmanager.com",
              "www.surveygizmo.com",
              "www.youtube.com",
            ],
            "img-src": [
              "'self'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
              "creativecommons.org",
              "data:",
              "images.ctfassets.net",
              "mozilla.org",
              "www.google-analytics.com",
              "www.googletagmanager.com",
            ],
            "frame-src": [
              "'self'",
              "*.mozilla.com",
              "*.mozilla.net",
              "*.mozilla.org",
              "accounts.firefox.com",
              "js.stripe.com",
              "trackertest.org",
              "www.google-analytics.com",
              "www.googletagmanager.com",
              "www.surveygizmo.com",
              "www.youtube.com",
            ],
          },
          http: true,
          meta: false,
          policy: {
            antiClickjacking: false,
            defaultNone: false,
            insecureBaseUri: true,
            insecureFormAction: true,
            insecureSchemeActive: false,
            insecureSchemePassive: false,
            strictDynamic: false,
            unsafeEval: true,
            unsafeInline: true,
            unsafeInlineStyle: true,
            unsafeObjects: false,
          },
          numPolicies: 1,
        },
        cookies: {
          expectation: "cookies-secure-with-httponly-sessions",
          pass: true,
          result: "cookies-not-found",
          scoreDescription: "No cookies detected",
          scoreModifier: 0,
          name: "cookies",
          title: "Cookies",
          // @ts-ignore
          data: null,
          sameSite: false,
        },
        "cross-origin-resource-sharing": {
          expectation: "cross-origin-resource-sharing-not-implemented",
          pass: true,
          result: "cross-origin-resource-sharing-not-implemented",
          scoreDescription:
            "Content is not visible via cross-origin resource sharing (CORS) files or headers",
          scoreModifier: 0,
          name: "cross-origin-resource-sharing",
          title: "CORS",
          // @ts-ignore
          data: null,
        },
        redirection: {
          expectation: "redirection-to-https",
          pass: true,
          result: "redirection-to-https",
          scoreDescription:
            "Initial redirection is to HTTPS on same host, final destination is HTTPS",
          scoreModifier: 0,
          name: "redirection",
          title: "Redirection",
          // @ts-ignore
          destination: null,
          redirects: true,
          route: ["http://www.mozilla.org/", "https://www.mozilla.org/"],
          statusCode: 200,
        },
        "referrer-policy": {
          expectation: "referrer-policy-private",
          pass: true,
          result: "referrer-policy-private",
          scoreDescription:
            "Referrer-Policy header set to 'no-referrer', 'same-origin', 'strict-origin' or 'strict-origin-when-cross-origin'",
          scoreModifier: 5,
          name: "referrer-policy",
          title: "Referrer Policy",
          data: "strict-origin-when-cross-origin",
          http: true,
          meta: false,
        },
        "strict-transport-security": {
          expectation: "hsts-implemented-max-age-at-least-six-months",
          pass: true,
          result: "hsts-implemented-max-age-at-least-six-months",
          scoreDescription:
            "HTTP Strict Transport Security (HSTS) header set to a minimum of six months (15768000)",
          scoreModifier: 0,
          name: "strict-transport-security",
          title: "HSTS",
          data: "max-age=31536000",
          includeSubDomains: false,
          maxAge: 31536000,
          preloaded: false,
        },
        "subresource-integrity": {
          expectation: "sri-implemented-and-external-scripts-loaded-securely",
          pass: true,
          result:
            "sri-not-implemented-but-all-scripts-loaded-from-secure-origin",
          scoreDescription:
            "Subresource Integrity (SRI) not implemented, but all scripts are loaded from a similar origin",
          scoreModifier: 0,
          name: "subresource-integrity",
          title: "Subresource Integrity",
          data: {},
        },
        "x-content-type-options": {
          expectation: "x-content-type-options-nosniff",
          pass: true,
          result: "x-content-type-options-nosniff",
          scoreDescription: "X-Content-Type-Options header set to 'nosniff'",
          scoreModifier: 0,
          name: "x-content-type-options",
          title: "X-Content-Type-Options",
          data: "nosniff",
        },
        "x-frame-options": {
          expectation: "x-frame-options-sameorigin-or-deny",
          pass: true,
          result: "x-frame-options-sameorigin-or-deny",
          scoreDescription:
            "X-Frame-Options (XFO) header set to SAMEORIGIN or DENY",
          scoreModifier: 0,
          name: "x-frame-options",
          title: "X-Frame-Options",
          data: "DENY",
        },
      },
    };
    const siteId = await ensureSite(pool, "www.mozilla.org");
    const scan = await insertScan(pool, siteId);
    const scanId = scan.id;

    const result = await insertTestResults(pool, siteId, scanId, scanResult);
    assert(result);
    assert.containsAllKeys(result, [
      "algorithm_version",
      "end_time",
      "grade",
      "response_headers",
      "score",
      "start_time",
      "state",
      "status_code",
      "tests_failed",
      "tests_passed",
      "tests_quantity",
    ]);
  });

  it("refreshes materialized views correctly", async function () {
    const siteId1 = await ensureSite(pool, "www.mozilla.org");
    const siteId2 = await ensureSite(pool, "developer.mozilla.org");
    const siteId3 = await ensureSite(pool, "security.mozilla.org");
    await pool.query(
      `INSERT INTO scans (site_id, state, start_time, end_time, tests_quantity, algorithm_version, grade, score)
      VALUES ($1, $2, NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', 0, $3, $4, $5)
      RETURNING *`,
      [siteId1, ScanState.FINISHED, ALGORITHM_VERSION, "A", 95]
    );
    await pool.query(
      `INSERT INTO scans (site_id, state, start_time, end_time, tests_quantity, algorithm_version, grade, score)
      VALUES ($1, $2, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', 0, $3, $4, $5)
      RETURNING *`,
      [siteId2, ScanState.FINISHED, ALGORITHM_VERSION, "B", 85]
    );
    // add an older entry with differing grade, this should be excluded because the newer one overrides this
    await pool.query(
      `INSERT INTO scans (site_id, state, start_time, end_time, tests_quantity, algorithm_version, grade, score)
      VALUES ($1, $2, NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', 0, $3, $4, $5)
      RETURNING *`,
      [siteId2, ScanState.FINISHED, ALGORITHM_VERSION, "C", 85]
    );
    // add one outside the year look back range, it should not be reflected in the result
    await pool.query(
      `INSERT INTO scans (site_id, state, start_time, end_time, tests_quantity, algorithm_version, grade, score)
      VALUES ($1, $2, NOW() - INTERVAL '400 days', NOW() - INTERVAL '400 days', 0, $3, $4, $5)
      RETURNING *`,
      [siteId3, ScanState.FINISHED, ALGORITHM_VERSION, "D", 65]
    );

    // now run the mv refresh
    const res = await refreshMaterializedViews(pool);
    assert(res);
    assert.equal(res.command, "REFRESH");

    // check the grade_distribution
    const gd = await selectGradeDistribution(pool);
    assert.equal(gd.length, 2);
    assert.equal(gd[0].grade, "A");
    assert.equal(gd[0].count, 1);
    assert.equal(gd[1].grade, "B");
    assert.equal(gd[1].count, 1);
  });

  it("gets the scan history for a site", async function () {
    // create our site
    const siteId = await ensureSite(pool, "www.mozilla.org");
    // related scans
    await Promise.all(
      [...Array(10).keys()].map((i) => {
        return pool.query(
          `INSERT INTO scans (site_id, state, start_time, end_time, grade, score, tests_quantity, algorithm_version)
          VALUES ($1, 
            $2, 
            NOW() - INTERVAL '${(i + 1) * 20000}', 
            NOW() - INTERVAL '${(i + 1) * 20000}', 
            'A', 
            100,
            9,
            $3) RETURNING *`,
          [siteId, ScanState.FINISHED, ALGORITHM_VERSION]
        );
      })
    );

    // create a bunch of other sites
    const otherIds = await Promise.all(
      [...Array(10).keys()].map((i) => {
        return ensureSite(pool, faker.internet.domainName());
      })
    );
    // make some random scans for those
    await Promise.all(
      [...Array(50).keys()].map((i) => {
        return pool.query(
          `INSERT INTO scans (site_id, state, start_time, end_time, grade, score, tests_quantity, algorithm_version)
          VALUES ($1, 
            $2, 
            NOW() - INTERVAL '${(i + 1) * 20000}', 
            NOW() - INTERVAL '${(i + 1) * 20000}', 
            'F', 
            0,
            9,
            $3) RETURNING *`,
          [
            otherIds[Math.floor(Math.random() * otherIds.length)],
            ScanState.FINISHED,
            ALGORITHM_VERSION,
          ]
        );
      })
    );

    // get the history of our site under test
    const res = await selectScanHostHistory(pool, siteId);
    assert(res);
    // this should reduce to a single entry because the score did not change
    assert.lengthOf(res, 1);
    assert(res.every((r) => r.grade === "A"));
    const entry = res[0];
    assert.isNumber(entry.id);
    assert.isString(entry.grade);
    assert.isNumber(entry.score);
  });

  // deprecated
  it("gets the scanner statistics", async function () {
    await insertSeeds(pool);

    // refresh all mat views
    await refreshMaterializedViews(pool);

    // get the scanner stats
    // let res = await selectScanScannerStatistics(pool, false);
    // assert(res);
    // assert.isObject(res.recent_scans);
    // assert.isObject(res.states);
    // assert.equal(Object.entries(res.states).length, 0);

    // // query with verbose to fill the recent scans and states objects
    // res = await selectScanScannerStatistics(pool, true);
    // assert(res);
    // assert.isObject(res.recent_scans);
    // assert.isAbove(Object.entries(res.recent_scans).length, 0);
    // assert.isObject(res.states);
    // assert.isAbove(Object.entries(res.states).length, 0);
    // assert.equal(res.scan_count, 20);
    // assert.equal(res.states["FINISHED"], 20);
    // assert.isAbove(Object.entries(res.recent_scans).length, 0);
  });

  it("gets the latest scan for a site", async function () {
    await insertSeeds(pool);
    const res = await selectScanRecentScan(pool, 1, 60 * 1000);
    assert(res);
    assert.isNumber(res.site_id);
    assert.isString(res.state);
    assert.isString(res.grade);
    assert.isNumber(res.score);
  });

  xit("gets test results for a scan", async function () {
    await insertSeeds(pool);
    const res = await selectTestResults(pool, 1);
    assert(res);
    assert.isArray(res);
    assert.isAbove(res.length, 0);
    const test = res[0];
    assert.equal(test.scan_id, 1);
    assert(test.id);
    assert.isNumber(test.site_id);
    assert.isNumber(test.scan_id);
    assert.isString(test.name);
    assert.isString(test.expectation);
    assert.isString(test.result);
    assert.isNumber(test.score_modifier);
    assert.isBoolean(test.pass);
    assert.isObject(test.output);
  });

  xit("updates a scan state", async function () {
    await insertSeeds(pool);
    {
      const res = await updateScanState(
        pool,
        1,
        ScanState.ABORTED,
        "TestError"
      );
      assert(res);
      assert.isObject(res);
      const check = await selectScan(pool, res.id);
      assert(check);
      assert.deepEqual(res, check);
    }
    {
      const res = await updateScanState(pool, 1, ScanState.FINISHED);
      assert(res);
      assert.isObject(res);
      const check = await selectScan(pool, res.id);
      assert(check);
      assert.deepEqual(res, check);
    }
  });
});
