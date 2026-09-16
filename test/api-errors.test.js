import { describe, it } from "node:test";

import { assert } from "chai";

import {
  InvalidHostNameError,
  ScanFailedError,
  SiteIsDownError,
  UnexpectedStatusCodeError,
} from "../src/api/errors.js";

describe("ScanFailedError", () => {
  /**
   * @type {{ label: string, cause: Error, statusCode: number }[]}
   */
  const cases = [
    {
      label: "an unreachable site",
      cause: new SiteIsDownError(),
      statusCode: 422,
    },
    {
      label: "an unexpected response status code",
      cause: new UnexpectedStatusCodeError(503),
      statusCode: 422,
    },
    {
      label: "an invalid hostname",
      cause: new InvalidHostNameError(),
      statusCode: 422,
    },
    {
      label: "an unexpected internal failure",
      cause: new Error("something broke"),
      statusCode: 500,
    },
  ];

  for (const { label, cause, statusCode } of cases) {
    it(`reports ${statusCode} for ${label}`, function () {
      const error = new ScanFailedError(cause);
      assert.equal(error.statusCode, statusCode);
      assert.equal(error.name, "scan-failed");
      assert.equal(error.message, cause.message);
    });
  }
});
