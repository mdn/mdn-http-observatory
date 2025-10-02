import { assert } from "chai";
import { Site } from "../src/site.js";

describe("Site", () => {
  it("parses site strings", function () {
    {
      const site = Site.fromSiteString("example.com");
      assert.equal(site.hostname, "example.com");
      assert.isUndefined(site.port);
      assert.equal(site.path, "/");
    }
    {
      const site = Site.fromSiteString("EXAMPLE.COM");
      assert.equal(site.hostname, "example.com");
      assert.isUndefined(site.port);
      assert.equal(site.path, "/");
    }
    {
      const site = Site.fromSiteString("example.com:8443");
      assert.equal(site.hostname, "example.com");
      assert.equal(site.port, 8443);
      assert.equal(site.path, "/");
    }
    {
      const site = Site.fromSiteString("example.com/some/path");
      assert.equal(site.hostname, "example.com");
      assert.isUndefined(site.port);
      assert.equal(site.path, "/some/path");
    }
    {
      const site = Site.fromSiteString("example.com:8443/some/path");
      assert.equal(site.hostname, "example.com");
      assert.equal(site.port, 8443);
      assert.equal(site.path, "/some/path");
    }
    {
      const site = Site.fromSiteString("example.com/some/path?q=bla");
      assert.equal(site.hostname, "example.com");
      assert.isUndefined(site.port);
      assert.equal(site.path, "/some/path");
    }
    {
      const site = Site.fromSiteString("example.com/some/path#hash");
      assert.equal(site.hostname, "example.com");
      assert.isUndefined(site.port);
      assert.equal(site.path, "/some/path");
    }
    {
      const site = Site.fromSiteString("ëxämplë.côm");
      assert.equal(site.hostname, "xn--xmpl-loa4bf.xn--cm-8ja");
      assert.isUndefined(site.port);
      assert.equal(site.path, "/");
    }
  });

  it("throws errors on invalid site strings", function () {
    assert.throws(() => Site.fromSiteString(""));
    assert.throws(() => Site.fromSiteString("."));
    assert.throws(() => Site.fromSiteString(".x"));
    assert.throws(() => Site.fromSiteString("x."));
    assert.throws(() =>
      Site.fromSiteString(
        "äöüäöüöäöüöäöüöäöüäöüöäöüöäöääüöäößßäöäöüßßドメインドメインドメインkljadlkjaslドメインドメインドメインsdjkfhskdjfhhドメインドメインäöüäドメインドメインドメインäöüöäüöドメインドメインドメインドメインドメインäööüäöüドメインドメインドメインドメインäöüäölドメインドメインドメインドメインドメインドメインドメインドメインäöüääöüöäドメインa.com"
      )
    );
  });
});
