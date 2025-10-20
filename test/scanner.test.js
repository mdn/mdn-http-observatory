import { assert } from "chai";
import { scan } from "../src/scanner/index.js";
import { Site } from "../src/site.js";

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

  it("returns expected results on observatory.mozilla.org", async function () {
    const domain = "observatory.mozilla.org";
    const site = Site.fromSiteString(domain);
    const scanResult = await scan(site);

    assert.equal(scanResult.scan.algorithmVersion, 5);
    assert.equal(scanResult.scan.grade, "A+");
    assert.equal(scanResult.scan.score, 110);
    assert.equal(scanResult.scan.testsFailed, 0);
    assert.equal(scanResult.scan.testsPassed, 10);
    assert.equal(scanResult.scan.testsQuantity, 10);
    assert.equal(scanResult.scan.statusCode, 200);
    assert.equal(scanResult.scan.responseHeaders["content-type"], "text/html");
  }).timeout(5000);

  it("returns expected results on mozilla.org", async function () {
    const domain = "mozilla.org";
    const site = Site.fromSiteString(domain);
    const scanResult = await scan(site);
    assert.equal(scanResult.scan.algorithmVersion, 5);
    assert.equal(scanResult.scan.grade, "B+");
    assert.equal(scanResult.scan.score, 80);
    assert.equal(scanResult.scan.testsFailed, 1);
    assert.equal(scanResult.scan.testsPassed, 9);
    assert.equal(scanResult.scan.testsQuantity, 10);
    assert.equal(scanResult.scan.statusCode, 200);
    assert.equal(
      // @ts-ignore
      scanResult.scan.responseHeaders["content-type"],
      "text/html; charset=utf-8"
    );
  }).timeout(5000);
});
