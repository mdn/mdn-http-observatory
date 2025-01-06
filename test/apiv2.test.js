import { createServer } from "../src/api/server.js";
import { assert } from "chai";
import { ALGORITHM_VERSION } from "../src/constants.js";
import { migrateDatabase } from "../src/database/migrate.js";
import {
  createPool,
  refreshMaterializedViews,
} from "../src/database/repository.js";
import { EventEmitter } from "events";
import { NUM_TESTS } from "../src/constants.js";
import fs from "node:fs";

const pool = createPool();
EventEmitter.defaultMaxListeners = 20;

let describeOrSkip;
if (process.env.SKIP_DB_TESTS) {
  describeOrSkip = describe.skip;
} else {
  describeOrSkip = describe;
}

describeOrSkip("API V2", function () {
  this.beforeEach(async () => {
    await migrateDatabase("0", pool);
    await migrateDatabase("max", pool);
  });

  it("serves the version path", async function () {
    process.env.RUN_ID = "buildinfo";
    process.env.GIT_SHA = "commitinfo";
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v2/version",
    });
    assert.equal(response.statusCode, 200);
    const j = response.json();
    const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
    assert.deepEqual(j, {
      version: p.version,
      commit: "commitinfo",
      build: "buildinfo",
      source: "https://github.com/mdn/mdn-http-observatory",
    });
  });

  it("serves the root path with a greeting", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    assert.equal(response.statusCode, 200);
    assert.include(response.body, "Welcome");
  });

  it("responds to POST /analyze", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "POST",
      url: "/api/v2/analyze?host=www.mozilla.org",
    });
    assert.equal(response.statusCode, 200);

    assert(response.body);
    const responseJson = JSON.parse(response.body);
    const scan = responseJson.scan;

    assert.isNumber(scan.id);
    assert.isNumber(scan.tests_quantity);
    assert.isNumber(scan.tests_passed);
    assert.isNumber(scan.tests_failed);
    assert.isNull(scan.error);
    assert.isNumber(scan.score);
    assert.equal(scan.status_code, 200);
    assert.isObject(scan.response_headers);
    assert.isString(scan.grade);
    assert.isString(scan.scanned_at);
    const d = new Date(scan.scanned_at);
    assert.notEqual(d.toString(), "Invalid Date");
    assert.equal(scan.algorithm_version, ALGORITHM_VERSION);

    const history = responseJson.history;
    assert.isArray(history);
    assert.isAbove(history.length, 0);
    const historyItem = history[0];
    assert.isNumber(historyItem.id);
    assert.isString(historyItem.scanned_at);
    assert.notEqual(
      new Date(historyItem.scanned_at).toString(),
      "Invalid Date"
    );
    assert.isString(historyItem.grade);
    assert.isNumber(historyItem.score);

    const tests = responseJson.tests;
    assert.isObject(tests);
    assert.equal(Object.keys(tests).length, NUM_TESTS);
    const test = tests[Object.keys(tests)[0]];
    assert.isString(test.expectation);
    assert.isBoolean(test.pass);
    assert.isString(test.result);
    assert.isString(test.score_description);
    assert.isNumber(test.score_modifier);
    assert(test.data);

    // check csp policy structure
    assert(tests["content-security-policy"]);
    assert(tests["content-security-policy"].policy);
    assert(tests["content-security-policy"].policy.unsafeObjects);

    const unsafeObjects = tests["content-security-policy"].policy.unsafeObjects;
    assert.isString(unsafeObjects.description);
    assert.isString(unsafeObjects.info);
    assert.isBoolean(unsafeObjects.pass);
  }).timeout(6000);

  it("refuses to analyze an ip address", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "POST",
      url: "/api/v2/analyze?host=141.1.1.1",
    });
    assert.equal(response.statusCode, 422);
    assert(response.body);
    const responseJson = JSON.parse(response.body);
    assert.equal(responseJson.error, "invalid-hostname-ip");
  });

  it("refuses to analyze a non-existent domain", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "POST",
      url: "/api/v2/analyze?host=some.non-existent.domain.err",
    });
    assert.equal(response.statusCode, 422);
    assert(response.body);
    const responseJson = JSON.parse(response.body);
    assert.equal(responseJson.error, "invalid-hostname-lookup");
  });

  it("refuses to analyze special domains", async function () {
    const app = await createServer();
    const hosts = [
      "test",
      "foo.test",
      "example",
      "foo.example",
      "invalid",
      "foo.invalid",
      "localhost",
      "foo.localhost",
      "local",
      "foo.local",
      "foo.local.",
    ];
    for (const host of hosts) {
      const response = await app.inject({
        method: "POST",
        url: `/api/v2/analyze?host=${encodeURIComponent(host)}`,
      });
      assert.equal(response.statusCode, 422);
      assert(response.body);
      const responseJson = JSON.parse(response.body);
      assert.equal(responseJson.error, "invalid-hostname");
    }
  });

  it("responds to GET /analyze of a known host", async function () {
    const app = await createServer();
    // create a scan first
    const _ = await app.inject({
      method: "POST",
      url: "/api/v2/analyze?host=www.mozilla.org",
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v2/analyze?host=www.mozilla.org",
    });
    assert.equal(response.statusCode, 200);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    const scan = r.scan;

    assert.isNumber(scan.id);
    assert.isNumber(scan.tests_quantity);
    assert.isNumber(scan.tests_passed);
    assert.isNumber(scan.tests_failed);
    assert.isNull(scan.error);
    assert.isNumber(scan.score);
    assert.equal(scan.status_code, 200);
    assert.isObject(scan.response_headers);
    assert.isString(scan.grade);
    assert.isString(scan.scanned_at);
    const d = new Date(scan.scanned_at);
    assert.notEqual(d.toString(), "Invalid Date");
    assert.equal(scan.algorithm_version, ALGORITHM_VERSION);

    const history = r.history;
    assert.isArray(history);
    assert.isAbove(history.length, 0);
    const historyItem = history[0];
    assert.isNumber(historyItem.id);
    assert.isString(historyItem.scanned_at);
    assert.notEqual(
      new Date(historyItem.scanned_at).toString(),
      "Invalid Date"
    );
    assert.isString(historyItem.grade);
    assert.isNumber(historyItem.score);

    const tests = r.tests;
    assert.isObject(tests);
    assert.equal(Object.keys(tests).length, NUM_TESTS);
    const test = tests[Object.keys(tests)[0]];
    assert.isString(test.expectation);
    assert.isBoolean(test.pass);
    assert.isString(test.result);
    assert.isString(test.score_description);
    assert.isNumber(test.score_modifier);
    assert(test.data);
  }).timeout(6000);

  it("responds to GET /analyze of an unknown host", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v2/analyze?host=somethingorother1234.mozilla.net",
    });
    // we do scan that host
    assert.equal(response.statusCode, 422);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    assert.equal(r.error, "invalid-hostname-lookup");
    assert.equal(
      r.message,
      "www.somethingorother1234.mozilla.net cannot be resolved"
    );
  }).timeout(6000);

  it("responds to GET /analyze of an ip address", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v2/analyze?host=141.1.1.1",
    });
    assert.equal(response.statusCode, 422);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    assert.equal(r.error, "invalid-hostname-ip");
  }).timeout(6000);

  it("responds to GET /analyze of a non-existent doman", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v2/analyze?host=some.non-existent.domain.err",
    });
    assert.equal(response.statusCode, 422);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    assert.equal(r.error, "invalid-hostname-lookup");
  }).timeout(6000);

  it("responds to GET /analyze of localhost", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v2/analyze?host=localhost",
    });
    assert.equal(response.statusCode, 422);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    assert.equal(r.error, "invalid-hostname");
  }).timeout(6000);

  it("responds to GET /grade_distribution", async function () {
    const app = await createServer();
    // create a scan
    const sr = await app.inject({
      method: "POST",
      url: "/api/v2/analyze?host=www.mozilla.org",
    });
    const srJson = JSON.parse(sr.body);
    const grade = srJson.scan.grade;
    // refresh the mat views
    const pool = createPool();
    await refreshMaterializedViews(pool);

    const response = await app.inject({
      method: "GET",
      url: `/api/v2/grade_distribution`,
    });
    assert.equal(response.statusCode, 200);
    const responseJson = JSON.parse(response.body);
    assert.equal(responseJson.length, 1);
    assert.equal(responseJson[0].grade, grade);
    assert.equal(responseJson[0].count, 1);
  });

  it("responds to GET /recommendation_matrix", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: `/api/v2/recommendation_matrix`,
    });
    assert.equal(response.statusCode, 200);
    const responseJson = JSON.parse(response.body);
    assert.equal(responseJson.length, NUM_TESTS);
    for (const entry of responseJson) {
      assert.isString(entry.name);
      assert.isString(entry.title);
      assert.isString(entry.mdnLink);
      assert.isArray(entry.results);
      for (const result of entry.results) {
        assert.isString(result.name);
        assert.isNumber(result.scoreModifier);
        assert.isString(result.description);
        assert.isString(result.recommendation);
      }
    }
  });

  it("responds to GET /scan", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "POST",
      url: "/api/v2/scan?host=www.mozilla.org",
    });
    assert.equal(response.statusCode, 200);

    assert(response.body);
    const scan = JSON.parse(response.body);

    assert.isNumber(scan.id);
    assert.isString(scan.details_url);
    const url = new URL(scan.details_url);
    assert.equal(url.hostname, "developer.mozilla.org");
    assert.equal(url.searchParams.get("host"), "www.mozilla.org");
    assert.isNumber(scan.tests_quantity);
    assert.isNumber(scan.tests_passed);
    assert.isNumber(scan.tests_failed);
    assert.isNull(scan.error);
    assert.isNumber(scan.score);
    assert.equal(scan.status_code, 200);
    assert.isString(scan.grade);
    assert.isString(scan.scanned_at);
    const d = new Date(scan.scanned_at);
    assert.notEqual(d.toString(), "Invalid Date");
    assert.equal(scan.algorithm_version, ALGORITHM_VERSION);
  }).timeout(6000);
});
