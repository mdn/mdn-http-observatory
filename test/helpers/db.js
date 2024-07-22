import { faker } from "@faker-js/faker";
import { ensureSite, ScanState } from "../../src/database/repository.js";
import { GRADE_CHART } from "../../src/grader/charts.js";
import { Expectation } from "../../src/types.js";
import { ALGORITHM_VERSION } from "../../src/constants.js";

/**
 * @typedef {import("pg").Pool} Pool
 */

/**
 *
 * @param {Pool} pool
 * @param {any} site
 */
export async function insertSite(pool, site) {
  await pool.query(
    `INSERT INTO sites (domain, creation_time, public_headers, private_headers, cookies) VALUES ($1, NOW(), $2, $3, $4)`,
    [site.domain, site.public_headers, site.private_headers, site.cookies]
  );
}

/**
 *
 * @param {Pool} pool
 */
export async function insertSeeds(pool) {
  // create a bunch of sites
  const siteIds = await Promise.all(
    [...Array(10).keys()].map((i) => {
      if (i === 0) {
        return ensureSite(pool, "www.mozilla.org");
      } else {
        return ensureSite(pool, faker.internet.domainName());
      }
    })
  );
  // make some random scans for those
  const scanIds = (
    await Promise.all(
      [...Array(20).keys()].map(async (i) => {
        let score = Math.floor(Math.random() * 120);
        score -= score % 5;
        const grade = GRADE_CHART.get(Math.min(score, 100));
        const siteId = siteIds[i % siteIds.length];
        return pool.query(
          `INSERT INTO scans (site_id, state, start_time, end_time, grade, score, tests_quantity, algorithm_version, status_code)
          VALUES ($1, 
            $2, 
            NOW() - INTERVAL '${(i + 1) * 2000} seconds', 
            NOW() - INTERVAL '${(i + 1) * 2000} seconds', 
            $3, 
            $4,
            9,
            $5,
            200) RETURNING id`,
          [siteId, ScanState.FINISHED, grade, score, ALGORITHM_VERSION]
        );
      })
    )
  ).map((r) => r.rows[0].id);

  await Promise.all(
    [...Array(100).keys()].map((i) => {
      const siteId = siteIds[i % siteIds.length];
      const scanId = scanIds[i % scanIds.length];
      const expectation =
        Object.values(Expectation)[
          Math.floor(Math.random() * Object.values(Expectation).length)
        ];
      return pool.query(
        `INSERT INTO tests (site_id, scan_id, name, expectation, result, score_modifier, pass, output)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          siteId,
          scanId,
          ["redirection", "cookies", "referrer-policy"][i % 3],
          expectation,
          expectation,
          [-20, -10, 0, 0, 0, 5, 10][i % 7],
          Math.random() > 0.5,
          { data: "some data" },
        ]
      );
    })
  );
}
