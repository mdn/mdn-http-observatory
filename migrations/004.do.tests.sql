CREATE TABLE IF NOT EXISTS tests (
  id                                  BIGSERIAL PRIMARY KEY,
  site_id                             INTEGER REFERENCES sites (id) NOT NULL,
  scan_id                             INTEGER REFERENCES scans (id) NOT NULL,
  name                                VARCHAR  NOT NULL,
  expectation                         VARCHAR  NOT NULL,
  result                              VARCHAR  NOT NULL,
  score_modifier                      SMALLINT NOT NULL,
  pass                                BOOL     NOT NULL,
  output                              JSONB    NOT NULL
);

CREATE INDEX tests_scan_id_idx           ON tests (scan_id);
CREATE INDEX tests_name_idx              ON tests (name);
CREATE INDEX tests_result_idx            ON tests (result);
CREATE INDEX tests_pass_idx              ON tests (pass);
