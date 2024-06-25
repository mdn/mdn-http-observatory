DROP MATERIALIZED VIEW IF EXISTS grade_distribution;

CREATE MATERIALIZED VIEW IF NOT EXISTS latest_scans
  AS SELECT latest_scans.site_id, latest_scans.scan_id, s.domain, latest_scans.state,
    latest_scans.start_time, latest_scans.end_time, latest_scans.tests_failed, latest_scans.tests_passed,
    latest_scans.grade, latest_scans.score, latest_scans.error
  FROM sites s,
  LATERAL ( SELECT id AS scan_id, site_id, state, start_time, end_time, tests_failed, tests_passed, grade, score, error
            FROM scans WHERE site_id = s.id AND state = 'FINISHED' ORDER BY end_time DESC LIMIT 1 ) latest_scans;
CREATE UNIQUE INDEX IF NOT EXISTS latest_scans_scan_id_idx ON latest_scans (scan_id);
COMMENT ON MATERIALIZED VIEW latest_scans IS 'Most recently completed scan for a given website';

CREATE MATERIALIZED VIEW IF NOT EXISTS latest_tests
  AS SELECT latest_scans.domain, tests.site_id, tests.scan_id, name, result, pass, output
  FROM tests
  INNER JOIN latest_scans
  ON (latest_scans.scan_id = tests.scan_id);
COMMENT ON MATERIALIZED VIEW latest_tests IS 'Test results from all the most recent scans';

CREATE MATERIALIZED VIEW IF NOT EXISTS grade_distribution
  AS SELECT grade, count(*)
    FROM latest_scans
    GROUP BY grade;
CREATE UNIQUE INDEX IF NOT EXISTS grade_distribution_grade_idx ON grade_distribution (grade);
COMMENT ON MATERIALIZED VIEW grade_distribution IS 'The grades and how many latest scans have that score';

CREATE MATERIALIZED VIEW IF NOT EXISTS grade_distribution_all_scans
  AS SELECT grade, count(*)
    FROM scans
    WHERE state = 'FINISHED'
    GROUP BY grade;
CREATE UNIQUE INDEX IF NOT EXISTS grade_distribution_all_scans_grade_idx ON grade_distribution_all_scans (grade);
COMMENT ON MATERIALIZED VIEW grade_distribution_all_scans IS 'The grades and how many scans have that score';


CREATE MATERIALIZED VIEW IF NOT EXISTS earliest_scans
  AS SELECT earliest_scans.site_id, earliest_scans.scan_id, s.domain, earliest_scans.state,
    earliest_scans.start_time, earliest_scans.end_time, earliest_scans.tests_failed, earliest_scans.tests_passed,
    earliest_scans.grade, earliest_scans.score, earliest_scans.error
  FROM sites s,
  LATERAL ( SELECT id AS scan_id, site_id, state, start_time, end_time, tests_failed, tests_passed, grade, score, error
            FROM scans WHERE site_id = s.id AND state = 'FINISHED' ORDER BY end_time ASC LIMIT 1 ) earliest_scans;
CREATE UNIQUE INDEX IF NOT EXISTS earliest_scans_scan_id_idx ON earliest_scans (scan_id);
COMMENT ON MATERIALIZED VIEW earliest_scans IS 'Oldest completed scan for a given website';

CREATE MATERIALIZED VIEW IF NOT EXISTS scan_score_difference_distribution
  AS SELECT earliest_scans.site_id, earliest_scans.domain, earliest_scans.score AS before, latest_scans.score AS after,
    (latest_scans.score - earliest_scans.score) AS difference
  FROM earliest_scans, latest_scans
  WHERE earliest_scans.site_id = latest_scans.site_id;
COMMENT ON MATERIALIZED VIEW scan_score_difference_distribution IS 'How much score has changed since first scan';
CREATE UNIQUE INDEX IF NOT EXISTS scan_score_difference_distribution_site_id_idx ON scan_score_difference_distribution (site_id);
CREATE INDEX scan_score_difference_difference_distribution_idx ON scan_score_difference_distribution (difference);

CREATE MATERIALIZED VIEW IF NOT EXISTS scan_score_difference_distribution_summation
  AS SELECT DISTINCT difference, COUNT(difference) AS num_sites
  FROM scan_score_difference_distribution
  GROUP BY difference
  ORDER BY difference DESC;
CREATE UNIQUE INDEX IF NOT EXISTS scan_score_difference_distribution_summation_difference_idx ON scan_score_difference_distribution_summation (difference);
COMMENT ON MATERIALIZED VIEW scan_score_difference_distribution_summation IS 'How many sites have improved by how many points';

