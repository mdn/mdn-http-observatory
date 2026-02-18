import { assert } from "chai";
import { parseHeadersOption } from "../src/scan.js";

describe("parseHeadersOption", () => {
  it("converts a JSON object to header strings", () => {
    const result = parseHeadersOption(
      '{"X-Foo": "bar", "Authorization": "Bearer tok"}'
    );
    assert.deepEqual(result, ["X-Foo: bar", "Authorization: Bearer tok"]);
  });

  it("handles an empty object", () => {
    assert.deepEqual(parseHeadersOption("{}"), []);
  });

  it("throws on invalid JSON", () => {
    assert.throws(() => parseHeadersOption("not-json"), /Invalid JSON/);
  });

  it("handles a single header", () => {
    assert.deepEqual(parseHeadersOption('{"X-Custom": "value"}'), [
      "X-Custom: value",
    ]);
  });
});
