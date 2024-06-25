CREATE TABLE IF NOT EXISTS expectations (
  id                                  SERIAL PRIMARY KEY,
  site_id                             INTEGER REFERENCES sites (id),
  test_name                           VARCHAR NOT NULL,
  expectation                         VARCHAR NOT NULL
);