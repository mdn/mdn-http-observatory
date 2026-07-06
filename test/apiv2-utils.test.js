import { describe, it } from "node:test";
import { assert } from "chai";
import { isIp } from "../src/api/v2/utils.js";

describe("isIp", () => {
  it("returns true for valid IPv4 and IPv6 addresses", function () {
    assert.isTrue(isIp("1.2.3.4"));
    assert.isTrue(isIp("127.0.0.1"));
    assert.isTrue(isIp("::1"));
    assert.isTrue(isIp("2001:db8::1"));
  });

  it("returns false for hostnames and malformed addresses", function () {
    assert.isFalse(isIp("example.com"));
    assert.isFalse(isIp("999.1.1.1"));
    assert.isFalse(isIp("1.2.3.4.5"));
    assert.isFalse(isIp("1::2::3"));
    assert.isFalse(isIp(""));
  });
});
