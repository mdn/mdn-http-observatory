import { createServer } from "../src/api/server.js";
import { assert } from "chai";
import { ALGORITHM_VERSION, Expectation } from "../src/types.js";
import { migrateDatabase } from "../src/database/migrate.js";
import {
  createPool,
  refreshMaterializedViews,
} from "../src/database/repository.js";
import { insertSeeds } from "./helpers/db.js";
import { GRADES } from "../src/grader/charts.js";
import { EventEmitter } from "events";
import { CONFIG } from "../src/config.js";
import { NUM_TESTS } from "../src/scanner/index.js";

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
      url: "/api/v2/analyze?host=httpbin.org",
    });
    assert.equal(response.statusCode, 404);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    assert.equal(r.error, "not-found");
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

  it("responds to GET /scan of an existing scan", async function () {
    const app = await createServer();
    // create a scan first
    const sr = await app.inject({
      method: "POST",
      url: "/api/v2/analyze?host=www.mozilla.org",
    });
    const s = JSON.parse(sr.body);

    const response = await app.inject({
      method: "GET",
      url: `/api/v2/scan?scan=${s.scan.id}`,
    });
    assert.equal(response.statusCode, 200);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    assert.deepEqual(s.scan, r.scan);
    assert.deepEqual(s.tests, r.tests);
    assert.isUndefined(r.history);
  }).timeout(6000);

  it("responds to GET /scan of a non-existing scan", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: `/api/v2/scan?scan=1234`,
    });
    assert.equal(response.statusCode, 404);
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
});
