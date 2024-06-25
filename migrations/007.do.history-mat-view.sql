DROP MATERIALIZED VIEW IF EXISTS latest_tests;
DROP MATERIALIZED VIEW IF EXISTS grade_distribution;
DROP MATERIALIZED VIEW IF EXISTS grade_distribution_all_scans;
DROP MATERIALIZED VIEW IF EXISTS scan_score_difference_distribution_summation;
DROP MATERIALIZED VIEW IF EXISTS scan_score_difference_distribution;
DROP MATERIALIZED VIEW IF EXISTS earliest_scans;
DROP MATERIALIZED VIEW IF EXISTS latest_scans;

CREATE MATERIALIZED VIEW IF NOT EXISTS grade_distribution AS 
  SELECT grade, count(*) AS count FROM (
    SELECT DISTINCT ON (scans.site_id) 
        scans.grade
    FROM scans
    WHERE scans.end_time > (now() - INTERVAL '1 year') 
    AND scans.state = 'FINISHED'
    ORDER BY scans.site_id, scans.end_time DESC
  ) s
  GROUP BY grade;
CREATE UNIQUE INDEX IF NOT EXISTS grade_idx ON grade_distribution (grade);
COMMENT ON MATERIALIZED VIEW grade_distribution IS 'Grade distribution over the last year';
