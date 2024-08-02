import { assert } from "chai";
import { AxiosHeaders } from "axios";
import { getFirstHttpHeader, getHttpHeaders } from "../src/analyzer/utils.js";

function emptyResponse() {
  return {
    headers: new AxiosHeaders("Content-Type: text/html"),
    request: {
      headers: new AxiosHeaders(),
    },
    status: 200,
    statusText: "OK",
    verified: true,
    data: "",
    config: {
      headers: new AxiosHeaders(),
    },
  };
}

describe("getHttpHeaders", () => {
  it("gets all http headers for a header name", function () {
    const response = emptyResponse();
    let headers = getHttpHeaders(response, "content-type");
    assert.isArray(headers);
    assert.lengthOf(headers, 1);
    assert.equal(headers[0], "text/html");
    headers = getHttpHeaders(response, "Content-Type");
    assert.isArray(headers);
    assert.lengthOf(headers, 1);
    assert.equal(headers[0], "text/html");
    headers = getHttpHeaders(response, "Non-Existing");
    assert.isArray(headers);
    assert.lengthOf(headers, 0);
  });

  it("gets headers correctly when set multiple times", function () {
    const response = emptyResponse();
    response.headers.set("X-Test", "hello");
    let headers = getHttpHeaders(response, "x-test");
    assert.isArray(headers);
    assert.lengthOf(headers, 1);
    response.headers.set("X-Test", ["hello", "world", "1234"]);
    headers = getHttpHeaders(response, "x-test");
    assert.isArray(headers);
    assert.lengthOf(headers, 3);
    assert.equal(headers[0], "hello");
    assert.equal(headers[1], "world");
    assert.equal(headers[2], "1234");
  });

  it("returns an empty array if the passed in value is `null`", function () {
    const headers = getHttpHeaders(null, "content-type");
    assert.isArray(headers);
    assert.lengthOf(headers, 0);
  });
});

describe("getFirstHttpHeader", () => {
  it("gets the first header", function () {
    const response = emptyResponse();
    const header = getFirstHttpHeader(response, "content-Type");
    assert.isNotNull(header);
    assert.isString(header);
    assert.equal(header, "text/html");
  });

  it("gets the first header on multiple values", function () {
    const response = emptyResponse();
    response.headers.set("X-test", ["hello", "world", "1234"]);
    const header = getFirstHttpHeader(response, "x-test");
    assert.isNotNull(header);
    assert.isString(header);
    assert.equal(header, "hello");
  });
});
