import { assert } from "chai";
import { scan } from "../src/scanner/index.js";
import { Site } from "../src/site.js";
import { fixtureRequests, scanWithRequests } from "./helpers.js";

/** @typedef {import("../src/scanner/index.js").ScanResult} ScanResult */

describe("Scanner", () => {
  it("returns an error on an unknown host", async function () {
    const domain =
      Array(223)
        .fill(0)
        .map(() => String.fromCharCode(Math.random() * 26 + 97))
        .join("") + ".net";
    const site = Site.fromSiteString(domain);
    try {
      await scan(site);
      throw new Error("scan should throw");
    } catch (e) {
      if (e instanceof Error) {
        assert.equal(e.message, "The site seems to be down.");
      } else {
        throw new Error("Unexpected error type");
      }
    }
  });

  it("returns expected results on observatory.mozilla.org", function () {
    const requests = fixtureRequests("observatory-mozilla-org");
    const scanResult = scanWithRequests(requests);

    assert.equal(scanResult.scan.algorithmVersion, 5);
    assert.equal(scanResult.scan.grade, "A+");
    assert.equal(scanResult.scan.score, 110);
    assert.equal(scanResult.scan.testsFailed, 0);
    assert.equal(scanResult.scan.testsPassed, 10);
    assert.equal(scanResult.scan.testsQuantity, 10);
    assert.equal(scanResult.scan.statusCode, 200);
    assert.equal(scanResult.scan.responseHeaders["content-type"], "text/html");
  });

  it("returns expected results on mozilla.org", function () {
    const requests = fixtureRequests("mozilla-org");
    const scanResult = scanWithRequests(requests);

    assert.equal(scanResult.scan.algorithmVersion, 5);
    assert.equal(scanResult.scan.grade, "B");
    assert.equal(scanResult.scan.score, 75);
    assert.equal(scanResult.scan.testsFailed, 2);
    assert.equal(scanResult.scan.testsPassed, 8);
    assert.equal(scanResult.scan.testsQuantity, 10);
    assert.equal(scanResult.scan.statusCode, 200);
    assert.equal(
      scanResult.scan.responseHeaders["content-type"],
      "text/html; charset=utf-8"
    );
  });
});
