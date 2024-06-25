import { CONFIG } from "../config.js";
import format from "pg-format";
import { ALGORITHM_VERSION } from "../types.js";
import dayjs from "dayjs";
import pg from "pg";

const { Pool } = pg;

/**
 * @typedef {import("pg").Pool} Pool
 */

/**
 * @returns {import("pg").PoolConfig}
 */
export const poolOptions = {
  database: CONFIG.database.database,
  host: CONFIG.database.host,
  user: CONFIG.database.user,
  password: CONFIG.database.pass,
  port: CONFIG.database.port,
  ssl: CONFIG.database.sslmode,
  max: 40, // set pool max size to 50
  idleTimeoutMillis: 1000, // close idle clients after 1 second
  connectionTimeoutMillis: 1000, // return an error after 1 second if connection could not be established
  maxUses: 10000, // close (and replace) a connection after it has been used 7500 times (see below for discussion)
};

/**
 *
 * @returns {Pool}
 */
export function createPool() {
  return new Pool(poolOptions);
}

/** @enum { string } ScanState  */
export const ScanState = {
  ABORTED: "ABORTED",
  FAILED: "FAILED",
  FINISHED: "FINISHED",
  PENDING: "PENDING",
  STARTING: "STARTING",
  RUNNING: "RUNNING",
};

/**
 * @typedef {object} ScanRow
 * @property {number} id
 * @property {number} site_id
 * @property {string} state
 * @property {string} start_time
 * @property {string | null} end_time
 * @property {string | null} scanned_at - used in api replies
 * @property {number} algorithm_version
 * @property {number} tests_failed
 * @property {number} tests_passed
 * @property {number} tests_quantity
 * @property {number | null} grade
 * @property {number | null} score
 * @property {string | null} likelihood_indicator
 * @property {string | null} error
 * @property {Object | null} response_headers
 * @property {boolean} hidden
 * @property {number | null} status_code
 */

/**
 *
 * @param {Pool} pool
 * @param {number} siteId
 * @param {boolean} hidden
 * @returns {Promise<ScanRow>}
 */
export async function insertScan(pool, siteId, hidden = false) {
  const result = await pool.query(
    `INSERT INTO scans (site_id, state, start_time, tests_quantity, hidden, algorithm_version)
      VALUES ($1, $2, NOW(), 0, $3, $4)
      RETURNING *`,
    [siteId, ScanState.RUNNING, hidden, ALGORITHM_VERSION]
  );
  /** @type {ScanRow} */
  const row = result.rows["0"];
  return row;
}

/**
 * Inserts all test results, updates the scan record and returns the latter.
 * @param {Pool} pool
 * @param {number} siteId
 * @param {number} scanId
 * @param {import("../types.js").ScanResult} scanResult
 * @returns {Promise<ScanRow>}
 */
export async function insertTestResults(pool, siteId, scanId, scanResult) {
  // prepare our test data, remove all standard fields from test and lift it to the top level,
  // encode the rest for the JSON data field.
  const testValues = Object.entries(scanResult.tests).map(([name, test]) => {
    const t = { ...test };
    const expectation = t.expectation;
    delete t.expectation;
    const pass = t.pass;
    delete t.pass;
    const result = t.result;
    delete t.result;
    const scoreModifier = t.scoreModifier;
    delete t.scoreModifier;
    delete t.scoreDescription;
    delete t.name;

    return [
      siteId,
      scanId,
      name,
      expectation,
      result,
      pass,
      JSON.stringify(t),
      scoreModifier,
    ];
  });

  // Use pg-format for SQL escaping for a multi-value insert query
  if (Object.entries(testValues).length > 0) {
    const query = format(
      "INSERT INTO tests (site_id, scan_id, name, expectation, result, pass, output, score_modifier) VALUES %L",
      testValues
    );
    const _ = await pool.query(query, []);
  }

  // Update the scan record
  const scan = scanResult.scan;
  const result = await pool.query(
    `UPDATE scans
      SET (end_time, tests_failed, tests_passed, grade, score, likelihood_indicator,
      state, response_headers, status_code, algorithm_version, tests_quantity, error) =
      (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      WHERE id = $12
      RETURNING *`,
    [
      scan.testsFailed,
      scan.testsPassed,
      scan.grade,
      scan.score,
      scan.likelihoodIndicator,
      scan.score !== null ? ScanState.FINISHED : ScanState.FAILED,
      scan.responseHeaders,
      scan.statusCode,
      scan.algorithmVersion,
      scan.testsQuantity,
      scan.error,
      scanId,
    ]
  );

  return result.rows[0];
}

/**
 *
 * @param {Pool} pool
 * @param {string} hostname
 * @returns {Promise<number>}
 */
export async function ensureSite(pool, hostname) {
  // Return known id
  const result = await pool.query(
    `SELECT id FROM sites
      WHERE domain = $1
      ORDER BY creation_time DESC
      LIMIT 1`,
    [hostname]
  );
  if (result.rowCount > 0) {
    return result.rows[0]["id"];
  }

  // Create one and return the id if unknown
  const insert = await pool.query(
    `INSERT INTO sites (domain, creation_time)
      VALUES ($1, NOW())
      RETURNING id`,
    [hostname]
  );
  return insert.rows[0]["id"];
}

/**
 * @typedef {Object} HeadersCookiesResult
 * @prop {import("../types.js").StringMap} [cookies]
 * @prop {import("../types.js").StringMap} [headers]
 */

/**
 *
 * @param {Pool} pool
 * @returns {Promise<pg.QueryResult<any>>}
 */
export async function refreshMaterializedViews(pool) {
  const res = await pool.query(
    `REFRESH MATERIALIZED VIEW CONCURRENTLY grade_distribution`
  );
  return res;
}

/**
 *
 * @param {Pool} pool
 * @param {number} siteId
 * @returns {Promise<import("../types.js").ScanHistoryRow[]>}
 */
export async function selectScanHostHistory(pool, siteId) {
  // Using a pg window function to pick out only changes in the score over time
  const result = await pool.query(
    `
    SELECT id, grade, score, end_time, end_time_unix_timestamp
    FROM (
      SELECT id, grade, score, start_time as end_time,
        round(extract(epoch from start_time)) as end_time_unix_timestamp,
        LAG(score) OVER (ORDER BY end_time) AS prev_score
      FROM scans
      WHERE site_id=$1
      AND state=$2
    ) AS sq
    WHERE score IS DISTINCT FROM prev_score
    ORDER BY end_time ASC
    `,
    [siteId, ScanState.FINISHED]
  );
  return result.rows;
}

/**
 *
 * @param {Pool} pool
 * @param {number} scanId
 * @returns {Promise<import("../types.js").ScanHistoryRow[]>}
 */
export async function selectScan(pool, scanId) {
  const result = await pool.query(
    `SELECT * FROM scans
    WHERE id = $1`,
    [scanId]
  );
  return result.rows[0];
}

// /**
//  * - this is deprecated
//  * @param {Pool} pool
//  * @param {boolean} verbose
//  * @returns {Promise<import("../types.js").ScannerStatisticsResult>}
//  */

// export async function selectScanScannerStatistics(pool, verbose = false) {
//   const queries = [
//     // Get the grade distribution across all latest scans for all sites
//     pool.query("SELECT * FROM grade_distribution", []),
//     // Get the grade distribution across all scans for all sites
//     pool.query("SELECT * FROM grade_distribution_all_scans", []),
//     // And the summation of grade differences
//     pool.query(
//       "SELECT * FROM scan_score_difference_distribution_summation",
//       []
//     ),
//     // And the total number of scans
//     pool.query("SELECT id, start_time FROM scans ORDER BY id DESC LIMIT 1", []),
//   ];
//   // Get the recent scan count
//   queries.push(
//     pool.query(
//       `SELECT DATE_TRUNC('hour', end_time) AS hour, COUNT(*) as num_scans
//           FROM scans
//           WHERE (end_time < DATE_TRUNC('hour', NOW()))
//             AND (end_time >= DATE_TRUNC('hour', NOW()) - INTERVAL '24 hours')
//           GROUP BY hour
//           ORDER BY hour DESC`,
//       []
//     )
//   );
//   // This is rather expensive, taking a few seconds on prod data
//   // TODO: Put the scanner stats query into a mat view
//   if (verbose) {
//     // Get the scanner stats
//     queries.push(
//       pool.query(
//         "SELECT state, COUNT(*) as quantity FROM scans GROUP BY state;",
//         []
//       )
//     );
//   }

// const res = await Promise.all(queries);
// const gradeDistribution = res[0].rows.reduce((acc, { grade, count }) => {
//   acc[grade] = count;
//   return acc;
// }, {});
// const gradeDistributionAllScans = res[1].rows.reduce(
//   (acc, { grade, count }) => {
//     acc[grade] = parseInt(count);
//     return acc;
//   },
//   {}
// );
// const scanScoreDifferenceDistributionSummation = res[2].rows.reduce(
//   (acc, { difference, num_sites }) => {
//     acc[difference] = parseInt(num_sites);
//     return acc;
//   },
//   {}
// );

// // this is a tad hacky, ordering by primary key to get the latest one
// const mostRecentScanDateTime = res[3].rows[0].start_time;
// // this is even more hacks, just assumes that the primary key is
// // a linear monotonic value starting with 1
// const scanCount = res[3].rows[0].id;

// /** @type {import("../types.js").NumberMap} */
// let recentScans = {};
// /** @type {import("../types.js").NumberMap} */
// let states = {};

// recentScans = res[4].rows.reduce((acc, { hour, num_scans }) => {
//   acc[dayjs(hour).format("YYYY-MM-DD hh:mm:ss")] = parseInt(num_scans);
//   return acc;
// }, {});

// if (verbose) {
//   states = res[5].rows.reduce((acc, { state, quantity }) => {
//     acc[state] = quantity;
//     return acc;
//   }, {});
// }

//   return {
//     grade_distribution: gradeDistribution,
//     grade_distribution_all_scans: gradeDistributionAllScans,
//     scan_score_difference_distribution_summation:
//       scanScoreDifferenceDistributionSummation,
//     most_recent_scan_datetime: mostRecentScanDateTime,
//     recent_scans: recentScans,
//     scan_count: scanCount,
//     states: states,
//   };
// }

// /**
//  *
//  * @param {Pool} pool
//  * @param {number} numScans
//  * @param {number} minScore
//  * @param {number} maxScore
//  * @returns {Promise<import("../types.js").StringMap>}
//  */
// export async function selectScanRecentFinishedScans(
//   pool,
//   numScans = 10,
//   minScore = 0,
//   maxScore = 100
// ) {
//   const result = await pool.query(
//     `SELECT sites.domain as domain, s2.grade as grade
//     FROM
//       (
//         SELECT DISTINCT ON (s1.site_id) s1.site_id, s1.grade, s1.end_time
//         FROM
//           (
//             SELECT site_id, grade, end_time
//             FROM scans
//               WHERE state = $1
//               AND NOT hidden
//               AND score >= $2
//               AND score <= $3
//               ORDER BY end_time
//               DESC LIMIT $4
//           ) s1
//           ORDER BY s1.site_id, s1.end_time DESC
//       ) s2
//       INNER JOIN sites ON (sites.id = s2.site_id)
//       ORDER BY s2.end_time DESC LIMIT $5`,
//     [ScanState.FINISHED, minScore, maxScore, numScans * 2, numScans]
//   );
//   return result.rows.reduce((acc, row) => {
//     acc[row.domain] = row.grade;
//     return acc;
//   }, {});
// }

/**
 * Returns the most recent scan that has finished successfully
 * inside a window back in time in seconds, which defaults to
 * api.cachedResultTime seconds.
 * @param {Pool} pool
 * @param {number} siteId
 * @param {number} recentInSeconds
 * @returns {Promise<ScanRow | undefined>}
 */
export async function selectScanRecentScan(
  pool,
  siteId,
  recentInSeconds = CONFIG.api.cooldown
) {
  const result = await pool.query(
    `SELECT * FROM scans
      WHERE site_id = $1
      AND start_time >= NOW() - INTERVAL '${recentInSeconds} seconds'
      AND state = $2
      ORDER BY start_time DESC
      LIMIT 1`,
    [siteId, ScanState.FINISHED]
  );
  return result.rows[0];
}

/**
 * Returns the most recent scan for a host
 * @param {Pool} pool
 * @param {string} host
 * @returns {Promise<ScanRow | undefined>}
 */
export async function selectScanLatestScanByHost(pool, host) {
  const result = await pool.query(
    `SELECT scans.*
      FROM scans
      JOIN sites ON scans.site_id = sites.id
      WHERE sites.domain = $1
      AND state = $2
      ORDER BY scans.start_time DESC
      LIMIT 1`,
    [host, ScanState.FINISHED]
  );
  return result.rows[0];
}

/**
 * Returns the most recent scan for a host
 * @param {Pool} pool
 * @param {number} scanId
 * @returns {Promise<ScanRow | undefined>}
 */
export async function selectScanById(pool, scanId) {
  const result = await pool.query(
    `SELECT scans.*
      FROM scans
      WHERE scans.id = $1
      AND state = $2
      LIMIT 1`,
    [scanId, ScanState.FINISHED]
  );
  return result.rows[0];
}

// /**
//  * Is this used any more?
//  * @param {Pool} pool
//  * @param {string} hostname
//  * @returns {Promise<import("../types.js").SiteHeadersResult>}
//  */
// export async function selectSiteHeaders(pool, hostname) {
//   const result = await pool.query(
//     `SELECT public_headers, private_headers, cookies FROM sites
//       WHERE domain = $1
//       ORDER BY creation_time DESC
//       LIMIT 1`,
//     [hostname]
//   );
//   return result.rows[0];
// }

/**
 * @param {Pool} pool
 * @param {number} scanId
 * @returns {Promise<import("../types.js").TestResult[]>}
 */
export async function selectTestResults(pool, scanId) {
  const result = await pool.query(`SELECT * FROM tests WHERE scan_id = $1`, [
    scanId,
  ]);
  return result.rows;
}

/**
 *
 * @param {Pool} pool
 * @param {number} scanId
 * @param {ScanState} state
 * @param {string} error
 */
export async function updateScanState(pool, scanId, state, error = null) {
  if (error) {
    const result = await pool.query(
      `UPDATE scans
        SET (state, end_time, error) = ($1, NOW(), $2)
        WHERE id = $3
        RETURNING *`,
      [state, error, scanId]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `UPDATE scans
        SET state = $1
        WHERE id = $2
        RETURNING *`,
      [state, scanId]
    );
    return result.rows[0];
  }
}

/**
 * @param {Pool} pool
 * @returns {Promise<import("../types.js").GradeDistributionRow[]>}
 */
export async function selectGradeDistribution(pool) {
  const result = await pool.query(
    `SELECT grade, count FROM grade_distribution 
    ORDER BY array_position(array['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F'], grade) asc`,
    []
  );
  return result.rows;
}
