CREATE TABLE IF NOT EXISTS scans (
  id                                  SERIAL PRIMARY KEY,
  site_id                             INTEGER REFERENCES sites (id) NOT NULL,
  state                               VARCHAR    NOT NULL,
  start_time                          TIMESTAMP  NOT NULL,
  end_time                            TIMESTAMP  NULL,
  algorithm_version                   SMALLINT   NOT NULL DEFAULT 1,
  tests_failed                        SMALLINT   NOT NULL DEFAULT 0,
  tests_passed                        SMALLINT   NOT NULL DEFAULT 0,
  tests_quantity                      SMALLINT   NOT NULL,
  grade                               VARCHAR(2) NULL,
  score                               SMALLINT   NULL,
  likelihood_indicator                VARCHAR    NULL,
  error                               VARCHAR    NULL,
  response_headers                    JSONB NULL,
  hidden                              BOOL       NOT NULL DEFAULT FALSE,
  status_code                         SMALLINT   NULL
);

CREATE INDEX scans_state_idx             ON scans (state);
CREATE INDEX scans_start_time_idx        ON scans (start_time);
CREATE INDEX scans_end_time_idx          ON scans (end_time);
CREATE INDEX scans_algorithm_version_idx ON scans (algorithm_version);
CREATE INDEX scans_grade_idx             ON scans (grade);
CREATE INDEX scans_score_idx             ON scans (score);
CREATE INDEX scans_hidden_idx            ON scans (hidden);
CREATE INDEX scans_site_id_finished_state_end_time_idx ON scans (site_id, state, end_time DESC) WHERE state = 'FINISHED';
