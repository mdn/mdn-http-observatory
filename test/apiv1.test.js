import { createServer } from "../src/api/server.js";
import { assert } from "chai";
import { Expectation } from "../src/types.js";
import { ALGORITHM_VERSION } from "../src/constants.js";
import { migrateDatabase } from "../src/database/migrate.js";
import {
  createPool,
  refreshMaterializedViews,
} from "../src/database/repository.js";
import { insertSeeds } from "./helpers/db.js";
import { GRADES } from "../src/grader/charts.js";
import { EventEmitter } from "events";

const pool = createPool();
EventEmitter.defaultMaxListeners = 20;

// This is disabled because the v1 api does not exist any more.
// Keeping it for reference for now.

describe.skip("API V1", function () {
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
      url: "/api/v1/analyze?host=www.mozilla.org",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    assert.equal(response.statusCode, 200);
    assert(response.body);
    const responseJson = JSON.parse(response.body);
    assert.isNumber(responseJson.tests_quantity);
    assert.isNumber(responseJson.tests_passed);
    assert.isNumber(responseJson.tests_failed);
    assert.isNumber(responseJson.score);
    assert.equal(responseJson.state, "FINISHED");
    assert.equal(responseJson.status_code, 200);
    assert.isObject(responseJson.response_headers);
    assert.isString(responseJson.likelihood_indicator);
    assert(!responseJson.hidden);
    assert.isString(responseJson.grade);
    assert.isString(responseJson.end_time);
    assert.equal(responseJson.algorithm_version, ALGORITHM_VERSION);
  }).timeout(6000);

  it("responds to POST /analyze with additional parameters in the body", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/analyze?host=www.mozilla.org",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "hidden=true&rescan=true",
    });
    assert.equal(response.statusCode, 200);
    assert(response.body);
    const responseJson = JSON.parse(response.body);
    assert.isNumber(responseJson.tests_quantity);
    assert.isNumber(responseJson.tests_passed);
    assert.isNumber(responseJson.tests_failed);
    assert.isNumber(responseJson.score);
    assert.equal(responseJson.state, "FINISHED");
    assert.equal(responseJson.status_code, 200);
    assert.isObject(responseJson.response_headers);
    assert.isString(responseJson.likelihood_indicator);
    assert(responseJson.hidden);
    assert.isString(responseJson.grade);
    assert.isString(responseJson.end_time);
    assert.equal(responseJson.algorithm_version, ALGORITHM_VERSION);

    // check for misformed params
    const errResponse = await app.inject({
      method: "POST",
      url: "/api/v1/analyze?host=www.mozilla.org",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "hidden=void&rescan=rescan",
    });
    assert.equal(errResponse.statusCode, 400);
    assert.equal(JSON.parse(errResponse.body).info, "Validation error");
  }).timeout(6000);

  it("refuses to analyze an ip address", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/analyze?host=141.1.1.1",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    assert.equal(response.statusCode, 400);
    assert(response.body);
    const responseJson = JSON.parse(response.body);
    assert.equal(responseJson.error, "invalid-hostname-ip");
  });

  it("refuses to analyze a non-existent domain", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/analyze?host=some.non-existent.domain.err",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    assert.equal(response.statusCode, 400);
    assert(response.body);
    const responseJson = JSON.parse(response.body);
    assert.equal(responseJson.error, "invalid-hostname-lookup");
  });

  it("responds to GET /analyze", async function () {
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/analyze?host=www.mozilla.org",
    });
    // nothing in the database -> 404
    assert.equal(response.statusCode, 404);
    // make a scan that we can get afterwords
    await app.inject({
      method: "POST",
      url: "/api/v1/analyze?host=www.mozilla.org",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/analyze?host=www.mozilla.org",
      });
      assert.equal(response.statusCode, 200);
      const r = JSON.parse(response.body);
      assert(r);
      assert.equal(r.state, "FINISHED");
    }
  }).timeout(6000);

  it("responds to GET /getGradeDistribution", async function () {
    // we need some data
    await insertSeeds(pool);
    // update the mat views
    await refreshMaterializedViews(pool);

    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/getGradeDistribution",
    });
    assert.equal(response.statusCode, 200);
    const r = JSON.parse(response.body);
    assert(r);
    for (const [grade, count] of Object.entries(r)) {
      assert(GRADES.has(grade));
      assert.isNumber(count);
    }
  });

  it("responds to GET /getHostHistory", async function () {
    const app = await createServer();
    {
      // no parameter
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getHostHistory",
      });
      assert.equal(response.statusCode, 400);
    }
    {
      // empty database
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getHostHistory?host=www.mozilla.org",
      });
      assert.equal(response.statusCode, 200);
      const r = JSON.parse(response.body);
      assert(r);
      assert.isArray(r);
      assert.lengthOf(r, 0);
    }
    {
      // create some data in the db
      await insertSeeds(pool);
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getHostHistory?host=www.mozilla.org",
      });
      assert.equal(response.statusCode, 200);
      const r = JSON.parse(response.body);
      assert(r);
      assert.isAbove(r.length, 0);
      const entry = r[0];
      assert.isString(entry.end_time);
      assert.isNumber(entry.end_time_unix_timestamp);
      assert.isString(entry.grade);
      assert.isNumber(entry.score);
      assert.isNumber(entry.scan_id);
    }
  });

  it("responds to GET /getRecentScans", async function () {
    const app = await createServer();

    {
      // no data
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getRecentScans",
      });
      assert.equal(response.statusCode, 200);
      const r = JSON.parse(response.body);
      assert.isObject(r);
      assert.equal(Object.entries(r).length, 0);
    }
    {
      await insertSeeds(pool);
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getRecentScans",
      });
      assert.equal(response.statusCode, 200);
      const r = JSON.parse(response.body);
      assert.isObject(r);
      assert.isAbove(Object.entries(r).length, 0);
      for (const [_key, value] of Object.entries(r)) {
        assert.isString(value);
        assert.include([...GRADES], value);
      }
    }
  });

  it("responds to GET /__stats__", async function () {
    await insertSeeds(pool);
    await refreshMaterializedViews(pool);
    const app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/__stats__",
    });
    assert.equal(response.statusCode, 200);
    const r = JSON.parse(response.body);
    assert.isObject(r);
    assert.isObject(r.gradeDistribution);
    assert.isObject(r.gradeDistribution.latest);
    assert.isObject(r.gradeDistribution.all);
    assert.isObject(r.gradeImprovements);
    assert.isObject(r.misc);
    assert.isString(r.misc.mostRecentScanDate);
    assert.isNumber(r.misc.numHoursWithoutScansInLast24Hours);
    assert.isNumber(r.misc.numImprovedSites);
    assert.isNumber(r.misc.numScans);
    assert.isNumber(r.misc.numScansLast24Hours);
    assert.isNumber(r.misc.numSuccessfulScans);
    assert.isNumber(r.misc.numUniqueSites);
  });

  it("responds to GET /getScanResults", async function () {
    const app = await createServer();
    await insertSeeds(pool);
    {
      // no param
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getScanResults",
      });
      assert.equal(response.statusCode, 400);
    }
    {
      // not found
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getScanResults?scan=99999999",
      });
      assert.equal(response.statusCode, 404);
      const r = JSON.parse(response.body);
    }
    {
      // happy path
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/getScanResults?scan=1",
      });
      assert.equal(response.statusCode, 200);
      const r = JSON.parse(response.body);
      assert.isObject(r);
      for (const [_key, value] of Object.entries(r)) {
        assert.isObject(value);
        assert.include(Object.values(Expectation), value.expectation);
        assert.isString(value.name);
        assert(value.output);
        assert.isBoolean(value.pass);
        assert.isString(value.result);
        assert(value.score_description);
        assert.isNumber(value.score_modifier);
      }
    }
  });
});
