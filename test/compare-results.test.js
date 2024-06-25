import { assert } from "chai";
import fs from "node:fs";
import path from "node:path";
import { migrateDatabase } from "../src/database/migrate.js";
import { createPool } from "../src/database/repository.js";
import { createServer } from "../src/api/server.js";
import axios from "axios";

const pool = createPool();

let describeOrSkip;
if (process.env.COMPARE_RESULT_TESTS) {
  describeOrSkip = describe;
} else {
  describeOrSkip = describe.skip;
}

describeOrSkip("Old and New Comparison", () => {
  beforeEach(async () => {
    await migrateDatabase("0", pool);
    await migrateDatabase("max", pool);
  });

  it("checks some sites", async function () {
    const domains = fs
      .readFileSync(path.join("test", "files", "domains.txt"), "utf8")
      .split("\n");

    console.log(`${domains.length} domains in list.`);

    const app = await createServer();

    for (let domain of domains) {
      if (domain.trim() === "") {
        continue;
      }
      // support #-commented lines
      if (domain.startsWith("#")) {
        continue;
      }
      domain = domain.split("#")[0].trim();
      console.log(`\n=== Checking ${domain} ===`);
      // analyze via new api
      let response, response2;
      try {
        [response, response2] = await Promise.all([
          app.inject({
            method: "POST",
            url: `/api/v2/analyze?host=${domain}`,
            headers: {
              "content-type": "application/x-www-form-urlencoded",
            },
          }),
          axios.post(
            `http://127.0.0.1:57001/api/v2/analyze?host=${domain}`,
            "",
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          ),
        ]);
      } catch (error) {
        console.log("ERROR", error.message);
        continue;
      }
      const resultNew = JSON.parse(response.body);
      const resultOld = response2.data;

      // console.log("NEW", resultNew.tests);
      // console.log("OLD", resultOld.tests);

      // remove name attribute from tests values
      if (resultNew.tests) {
        resultNew.tests = Object.entries(resultNew.tests).reduce(
          (acc, [key, value]) => {
            const newval = { ...value };
            delete newval.name;
            // @ts-ignore
            acc[key] = newval;
            return acc;
          },
          {}
        );
      }
      // console.log(resultNew);
      // console.log(resultOld);
      // remove the xss-protection test from old result
      delete resultOld.tests["x-xss-protection"];
      // remove the contribute test from old result
      delete resultOld.tests["contribute"];
      // downcase old result header keys
      if (resultOld.scan.response_headers !== null) {
        resultOld.scan.response_headers = Object.entries(
          resultOld.scan.response_headers
        ).reduce((acc, [key, value]) => {
          // @ts-ignore
          acc[key.toLowerCase()] = value;
          return acc;
        }, {});
      }
      // remove history
      for (const res of [resultOld, resultNew]) {
        delete res.history;
      }
      // remove expires and max-age from cookies, normalize samesite
      for (const res of [resultOld, resultNew]) {
        // console.log("COOKIES", res.tests.cookies.data);
        if (res.tests?.cookies?.data) {
          Object.keys(res.tests.cookies.data).forEach((key) => {
            const cookie = res.tests.cookies.data[key];
            delete cookie.expires;
            delete cookie["max-age"];
            // remove leading dot in domain on old result
            cookie.domain = cookie.domain.replace(/^\./, "");
            cookie.samesite = !!cookie.samesite;
          });
        }
      }
      // normalize global samesite
      if (resultNew.tests?.cookies) {
        resultNew.tests.cookies.sameSite = !!resultNew.tests.cookies.sameSite;
      }
      if (resultOld.tests?.cookies) {
        resultOld.tests.cookies.sameSite = !!resultOld.tests.cookies.sameSite;
      }
      // remove scan.algorithm_version from both
      delete resultNew.scan?.algorithm_version;
      delete resultOld.scan?.algorithm_version;
      // remove scan.end_time from both
      delete resultNew.scan?.end_time;
      delete resultOld.scan?.end_time;
      // remove scan.id, site_id from both
      delete resultNew.scan?.id;
      delete resultOld.scan?.id;
      delete resultNew.scan?.site_id;
      delete resultOld.scan?.site_id;
      // remove scan.response_headers from both (they tend to differ on subsequent requests)
      delete resultNew.scan?.response_headers;
      delete resultOld.scan?.response_headers;
      // remove scan.start_time from both
      delete resultNew.scan?.start_time;
      delete resultOld.scan?.start_time;
      // remove scan.tests_failed, scan.tests_passed, scan.tests_quantity from both
      delete resultNew.scan?.tests_failed;
      delete resultOld.scan?.tests_failed;
      delete resultNew.scan?.tests_passed;
      delete resultOld.scan?.tests_passed;
      delete resultNew.scan?.tests_quantity;
      delete resultOld.scan?.tests_quantity;
      // remove data from csp results because they contain a fix on trailing slashes
      // that makes them different in all cases
      delete resultNew.tests?.["content-security-policy"]?.data;
      delete resultOld.tests?.["content-security-policy"]?.data;
      // remove quotation differences on the score descriptions
      for (const res of [resultOld, resultNew]) {
        if (res.tests) {
          res.tests = Object.entries(res.tests).reduce((acc, [key, value]) => {
            const newval = {
              ...value,
              score_description: value.score_description.replace(/['"]/g, ""),
            };
            // @ts-ignore
            acc[key] = newval;
            return acc;
          }, {});
        }
      }
      // remove cors data, old version contains acao, crosdomain and clientaccesspolicy
      delete resultNew.tests?.["cross-origin-resource-sharing"]?.data;
      delete resultOld.tests?.["cross-origin-resource-sharing"]?.data;
      // remove status code from redirect test
      delete resultNew.tests?.["redirection"]?.status_code;
      delete resultOld.tests?.["redirection"]?.status_code;
      // remove CORP test since it is new
      delete resultNew.tests?.["cross-origin-resource-policy"];
      // in python, sometime the port sneaks in to th redirection destination and chain. remove it.
      if (resultOld.tests.redirection) {
        resultOld.tests.redirection.destination = normalizeUrl(
          resultOld.tests.redirection.destination
        );
        resultOld.tests.redirection.route =
          resultOld.tests.redirection.route.map(normalizeUrl);
      }
      // console.log("NEW", resultNew.tests["redirection"]);
      // console.log("OLD", resultOld.tests["redirection"]);
      // assert.equal(resultNew.scan.score, resultOld.scan.score);
      // assert.equal(resultNew.scan.grade, resultOld.scan.grade);
      // console.log("\nNEW SCORES");
      // for (const [name, test] of Object.entries(resultNew.tests)) {
      //   console.log(name, test.score_modifier);
      // }
      // console.log("\nOLD SCORES");
      // for (const [name, test] of Object.entries(resultOld.tests)) {
      //   console.log(name, test.score_modifier);
      // }

      if (process.env["DEEP_EQUAL"]) {
        assert.deepEqual(resultNew, resultOld);
      }
      console.log(
        `OLD score: ${resultOld.scan.score} grade ${resultOld.scan.grade} for ${domain}`
      );
      console.log(
        `NEW score: ${resultNew?.scan?.score} grade ${resultNew?.scan?.grade} for ${domain}`
      );
      let resultIcon = "❌";
      const diff = resultNew.scan.score - resultOld.scan.score;
      if (diff === 0) {
        resultIcon = "✅";
      } else if (diff > 0 && diff <= 10) {
        resultIcon = "🔼";
      } else if (diff < 0 && diff >= -10) {
        resultIcon = "🔽";
      }

      fs.appendFileSync(
        "compare_output.txt",
        `${resultIcon}\t${domain}\t${resultOld.scan.score}\t${resultNew?.scan?.score}\t${resultOld.scan.grade}\t${resultNew?.scan?.grade}\n`
      );
    }

    assert.isTrue(true);
  }).timeout(1000 * 6000);
});

/**
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch (e) {
    return url;
  }
}
